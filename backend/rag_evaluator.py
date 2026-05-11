"""
RAG Evaluator — refactored from app.py into a reusable class.
Initialises once at startup; evaluate() is called per-request.
"""

from __future__ import annotations

import os
import re
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── Paths (relative to project root) ─────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DEFAULT_ROLE = "data_analyst"
JOB_ROLES_DIR = os.path.join(BASE_DIR, "job_roles")
VECTOR_DB_DIR = os.path.join(BASE_DIR, "vector_db")

QA_THRESHOLD = 0.8
CHAPTER_THRESHOLD = 1.5


# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_documents(folder_path: str) -> list[str]:
    docs = []
    if not os.path.isdir(folder_path):
        return docs
    for fname in os.listdir(folder_path):
        if fname.endswith(".txt"):
            with open(os.path.join(folder_path, fname), "r", encoding="utf-8") as f:
                docs.append(f.read())
    return docs


def _split_by_question(documents: list[str]) -> list[str]:
    chunks: list[str] = []
    for doc in documents:
        for section in doc.split("Question:"):
            section = section.strip()
            if section:
                chunks.append("Question:" + section)
    return list(set(chunks))


def _split_chapters(documents: list[str], chunk_size: int = 500) -> list[str]:
    chunks: list[str] = []
    for doc in documents:
        paragraphs = [p.strip() for p in doc.split("\n\n") if p.strip()]
        current = ""
        for para in paragraphs:
            if len(current) + len(para) <= chunk_size:
                current += "\n\n" + para
            else:
                if current.strip():
                    chunks.append(current.strip())
                current = para
        if current.strip():
            chunks.append(current.strip())
    return list(set(chunks))


def _clean_json(raw: str) -> str:
    raw = re.sub(r"```json|```", "", raw)
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        return ""
    raw = raw[start:end]
    raw = re.sub(r"//[^\n]*", "", raw)
    raw = re.sub(r"--[^\n]*", "", raw)
    raw = re.sub(r",\s*([}\]])", r"\1", raw)
    return raw.strip()


def parse_transcript(text: str) -> list[dict]:
    """Parse Q&A transcript text into list of {question, answer} dicts."""
    pairs = []
    blocks = re.split(r"\n(?=Question:)", text.strip())
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        q_match = re.search(r"Question:\s*(.+)", block)
        a_match = re.search(r"Answer:\s*(.+)", block, re.DOTALL)
        if q_match and a_match:
            pairs.append({
                "question": q_match.group(1).strip(),
                "answer": a_match.group(1).strip(),
            })
    return pairs


# ── Main Evaluator Class ──────────────────────────────────────────────────────

class RAGEvaluator:
    """
    Loads ChromaDB QA + Chapter vector DBs for a given job role and
    provides an evaluate() method for scoring a Q&A pair.
    """

    def __init__(self, role: str = DEFAULT_ROLE):
        self.role = role
        self.qa_db = None
        self.chapter_db = None
        self.scoring_rubric = ""
        self.embedding = None
        self._ready = False
        self._init_error: Optional[str] = None

    def load(self) -> bool:
        """Initialise embeddings and vector DBs. Returns True on success."""
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
            from langchain_chroma import Chroma

            role_path = os.path.join(JOB_ROLES_DIR, self.role)
            qa_folder = os.path.join(role_path, "qa")
            chapter_folder = os.path.join(role_path, "chapters")
            rubric_path = os.path.join(role_path, "scoring_rubric.txt")

            qa_db_path = os.path.join(VECTOR_DB_DIR, self.role, "qa")
            chapter_db_path = os.path.join(VECTOR_DB_DIR, self.role, "chapters")

            # Load scoring rubric
            if os.path.exists(rubric_path):
                with open(rubric_path, "r", encoding="utf-8") as f:
                    self.scoring_rubric = f.read()

            # Load SBERT embeddings
            logger.info(f"[RAGEvaluator] Loading SBERT embeddings for role={self.role}")
            self.embedding = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )

            # QA DB
            qa_docs = _load_documents(qa_folder)
            if not qa_docs:
                logger.warning(f"[RAGEvaluator] No QA docs for role={self.role}")
                return False
            qa_chunks = _split_by_question(qa_docs)
            os.makedirs(qa_db_path, exist_ok=True)
            if os.path.exists(qa_db_path) and os.listdir(qa_db_path):
                self.qa_db = Chroma(
                    persist_directory=qa_db_path, embedding_function=self.embedding
                )
            else:
                self.qa_db = Chroma.from_texts(
                    texts=qa_chunks,
                    embedding=self.embedding,
                    persist_directory=qa_db_path,
                )

            # Chapter DB
            ch_docs = _load_documents(chapter_folder)
            if not ch_docs:
                logger.warning(f"[RAGEvaluator] No chapter docs for role={self.role}")
                return False
            ch_chunks = _split_chapters(ch_docs)
            os.makedirs(chapter_db_path, exist_ok=True)
            if os.path.exists(chapter_db_path) and os.listdir(chapter_db_path):
                self.chapter_db = Chroma(
                    persist_directory=chapter_db_path, embedding_function=self.embedding
                )
            else:
                self.chapter_db = Chroma.from_texts(
                    texts=ch_chunks,
                    embedding=self.embedding,
                    persist_directory=chapter_db_path,
                )

            self._ready = True
            logger.info(f"[RAGEvaluator] Ready for role={self.role}")
            return True

        except Exception as exc:
            self._init_error = str(exc)
            logger.error(f"[RAGEvaluator] Load failed: {exc}")
            return False

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _retrieve_context(self, query: str):
        """Returns (context_text, source, score)."""
        if self.qa_db:
            qa_res = self.qa_db.similarity_search_with_score(query, k=1)
            if qa_res:
                doc, score = qa_res[0]
                if score < QA_THRESHOLD:
                    return doc.page_content, "qa", score

        if self.chapter_db:
            ch_res = self.chapter_db.similarity_search_with_score(query, k=1)
            if ch_res:
                doc, score = ch_res[0]
                if score < CHAPTER_THRESHOLD:
                    return doc.page_content, "chapter", score

        return None, "none", None

    def _call_llm(self, question: str, answer: str, context: str, source: str) -> Optional[dict]:
        try:
            import ollama
        except ImportError:
            logger.error("[RAGEvaluator] ollama not installed")
            return None

        if source == "qa":
            ctx_instr = "Use the Ideal Answer in the context as your reference."
        else:
            ctx_instr = (
                "No pre-written ideal answer exists. "
                "Use the chapter content to infer what a good answer should cover."
            )

        prompt = f"""You are an interview evaluator. Output ONLY a JSON object.

Scoring Rubric:
{self.scoring_rubric}

Context:
{context}

Instruction: {ctx_instr}

Question: {question}
Candidate Answer: {answer}

Score each dimension (0.0-10.0):
- technical_accuracy: factual correctness vs ideal answer
- clarity: how clear and concise the answer is
- completeness: how many key points were covered
- communication: structure and professionalism

Output ONLY this JSON:
{{"technical_accuracy": 0.0, "clarity": 0.0, "completeness": 0.0, "communication": 0.0, "strengths": ["point1"], "weaknesses": ["point1"]}}"""

        try:
            response = ollama.chat(
                model="phi3:mini",
                messages=[{"role": "user", "content": prompt}],
            )
            raw = response.message.content
            clean = _clean_json(raw)
            return json.loads(clean)
        except Exception as exc:
            logger.error(f"[RAGEvaluator] LLM call failed: {exc}")
            return None

    # ── Public API ────────────────────────────────────────────────────────────

    def evaluate_pair(self, question: str, answer: str) -> dict:
        """Evaluate a single Q&A pair. Returns score dict."""
        context, source, score = self._retrieve_context(question)

        if source == "none" or context is None:
            return {
                "question": question,
                "answer": answer,
                "source": "none",
                "technical_accuracy": None,
                "clarity": None,
                "completeness": None,
                "communication": None,
                "strengths": [],
                "weaknesses": ["Question not in knowledge base"],
            }

        result = self._call_llm(question, answer, context, source)
        if result is None:
            # Fallback: neutral scores
            result = {
                "technical_accuracy": 5.0,
                "clarity": 5.0,
                "completeness": 5.0,
                "communication": 5.0,
                "strengths": [],
                "weaknesses": ["Could not evaluate — LLM unavailable"],
            }

        return {
            "question": question,
            "answer": answer,
            "source": source,
            "technical_accuracy": result.get("technical_accuracy"),
            "clarity": result.get("clarity"),
            "completeness": result.get("completeness"),
            "communication": result.get("communication"),
            "strengths": result.get("strengths", []),
            "weaknesses": result.get("weaknesses", []),
        }

    def evaluate_transcript(
        self,
        transcript_text: str,
        resume_text: str = "",
        job_description: str = "",
        required_skills: list[str] | None = None,
        thresh_select: float = 70.0,
        thresh_consider: float = 45.0,
        model_name: str = "rag_evaluator",
    ) -> dict:
        """
        Full pipeline: parse transcript → evaluate each pair → aggregate.
        Returns a dict shaped to match the Evaluation model.
        """
        if required_skills is None:
            required_skills = []

        pairs = parse_transcript(transcript_text)
        if not pairs:
            return {"error": "No Q&A pairs found in transcript"}

        question_results = []
        acc_vals, cla_vals, comp_vals, comm_vals = [], [], [], []

        for pair in pairs:
            res = self.evaluate_pair(pair["question"], pair["answer"])
            question_results.append(res)
            if res["technical_accuracy"] is not None:
                acc_vals.append(res["technical_accuracy"])
            if res["clarity"] is not None:
                cla_vals.append(res["clarity"])
            if res["completeness"] is not None:
                comp_vals.append(res["completeness"])
            if res["communication"] is not None:
                comm_vals.append(res["communication"])

        def avg(lst):
            return sum(lst) / len(lst) if lst else 0.0

        avg_acc = avg(acc_vals)
        avg_cla = avg(cla_vals)
        avg_comp = avg(comp_vals)
        avg_comm = avg(comm_vals)
        overall = avg([avg_acc, avg_cla, avg_comp, avg_comm])  # 0-10

        # Convert to 0-100 scale for match_score / ml_confidence
        match_score = overall * 10.0

        # Skill matching from resume vs required_skills
        matched_skills: list[str] = []
        missing_skills: list[str] = []
        resume_lower = resume_text.lower()
        for skill in required_skills:
            if skill.lower() in resume_lower:
                matched_skills.append(skill)
            else:
                missing_skills.append(skill)

        num_candidate_skills = len(matched_skills)
        num_matched = len(matched_skills)
        num_missing = len(missing_skills)
        skill_match_ratio = num_matched / len(required_skills) if required_skills else 0.5

        # Decision
        if match_score >= thresh_select:
            final_decision = "SELECT"
        elif match_score >= thresh_consider:
            final_decision = "CONSIDER"
        else:
            final_decision = "REJECT"

        # Build explanation
        strengths_all = [s for r in question_results for s in r.get("strengths", []) if s.strip()]
        weaknesses_all = [w for r in question_results for w in r.get("weaknesses", []) if w.strip()]
        verdict_map = {
            "SELECT": "Strong candidate",
            "CONSIDER": "Possible candidate — review manually",
            "REJECT": "Does not meet threshold",
        }
        explanation_parts = [verdict_map[final_decision]]
        if strengths_all:
            explanation_parts.append("Strengths: " + "; ".join(strengths_all[:3]) + ".")
        if weaknesses_all:
            explanation_parts.append("Areas to improve: " + "; ".join(weaknesses_all[:3]) + ".")
        explanation = " ".join(explanation_parts)

        # Response length / complexity from transcript
        all_answers = " ".join(p["answer"] for p in pairs)
        response_len = len(all_answers.split())
        sentences = re.split(r"[.!?]", all_answers)
        sentence_cmplx = (
            sum(len(s.split()) for s in sentences if s.strip()) / len([s for s in sentences if s.strip()])
            if any(s.strip() for s in sentences)
            else 0.0
        )

        return {
            "match_score": round(match_score, 2),
            "skill_match_ratio": round(skill_match_ratio, 4),
            "num_matched_skills": num_matched,
            "num_missing_skills": num_missing,
            "num_candidate_skills": num_candidate_skills,
            # comm_score = clarity (0-1)
            "comm_score": round(avg_cla / 10.0, 4),
            # conf_score = technical accuracy (0-1)
            "conf_score": round(avg_acc / 10.0, 4),
            # subj_score = completeness (0-1)
            "subj_score": round(avg_comp / 10.0, 4),
            # tech_score = communication (0-1)
            "tech_score": round(avg_comm / 10.0, 4),
            "response_len": response_len,
            "sentence_cmplx": round(sentence_cmplx, 2),
            "ml_decision": final_decision,
            "ml_confidence": round(match_score, 2),
            "rule_decision": final_decision,
            "final_decision": final_decision,
            "explanation": explanation,
            "model_used": model_name,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "question_results": question_results,
        }


# ── Global evaluator registry ─────────────────────────────────────────────────

_evaluators: dict[str, RAGEvaluator] = {}


def get_evaluator(role: str = DEFAULT_ROLE) -> RAGEvaluator:
    """
    Return a cached evaluator for the given role.
    Loads lazily on first call.
    """
    global _evaluators
    # Normalise role name: replace spaces and map to folder names
    role_clean = role.lower().replace(" ", "_").replace("-", "_")

    # Map common job titles to folder names
    title_map = {
        "data analyst": "data_analyst",
        "ml engineer": "ml_engineer",
        "machine learning engineer": "ml_engineer",
        "data scientist": "data _scientist",
        "data engineer": "data_engineer",
        "backend engineer": "backend_engineer",
        "frontend engineer": "frontend_engineer",
        "ai engineer": "ai_engineer",
        "business analyst": "business_analyst",
    }
    # Try direct match first, then mapped, then default
    resolved = role_clean
    for k, v in title_map.items():
        if k in role.lower():
            resolved = v
            break

    # Check if folder exists; fall back to default
    role_path = os.path.join(JOB_ROLES_DIR, resolved)
    if not os.path.isdir(role_path):
        logger.warning(f"[RAGEvaluator] Role folder not found: {resolved}, using {DEFAULT_ROLE}")
        resolved = DEFAULT_ROLE

    if resolved not in _evaluators:
        ev = RAGEvaluator(role=resolved)
        ev.load()
        _evaluators[resolved] = ev

    return _evaluators[resolved]


def preload_default_evaluator():
    """Call on app startup to warm up the default evaluator."""
    get_evaluator(DEFAULT_ROLE)
