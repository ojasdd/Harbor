import os
import re
import json
import ollama
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma


# ── Document Loading ──────────────────────────────────────────────────────────

def load_documents(folder_path):
    documents = []
    for file in os.listdir(folder_path):
        file_path = os.path.join(folder_path, file)
        if file.endswith(".txt"):
            with open(file_path, "r", encoding="utf-8") as f:
                documents.append(f.read())
    return documents


def split_by_question(documents):
    chunks = []
    for doc in documents:
        sections = doc.split("Question:")
        for section in sections:
            section = section.strip()
            if section:
                chunks.append("Question:" + section)
    return list(set(chunks))


def split_chapters(documents, chunk_size=500):
    chunks = []
    for doc in documents:
        paragraphs = [p.strip() for p in doc.split("\n\n") if p.strip()]
        current_chunk = ""
        for para in paragraphs:
            if len(current_chunk) + len(para) <= chunk_size:
                current_chunk += "\n\n" + para
            else:
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())
                current_chunk = para
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
    return list(set(chunks))


# ── Transcript Parser ─────────────────────────────────────────────────────────

def parse_transcript(transcript_path):
    pairs = []
    with open(transcript_path, "r", encoding="utf-8") as f:
        content = f.read()

    blocks = re.split(r'\n(?=Question:)', content.strip())

    for block in blocks:
        block = block.strip()
        if not block:
            continue
        q_match = re.search(r'Question:\s*(.+)', block)
        a_match = re.search(r'Answer:\s*(.+)', block, re.DOTALL)
        if q_match and a_match:
            pairs.append({
                "question": q_match.group(1).strip(),
                "answer"  : a_match.group(1).strip()
            })
    return pairs


# ── Vector DB Builder ─────────────────────────────────────────────────────────

def build_or_load_db(chunks, persist_path, embedding):
    if os.path.exists(persist_path) and os.listdir(persist_path):
        print(f"    Loaded from disk  : {persist_path}")
        return Chroma(persist_directory=persist_path, embedding_function=embedding)
    else:
        print(f"    Created new DB    : {persist_path}")
        return Chroma.from_texts(
            texts=chunks,
            embedding=embedding,
            persist_directory=persist_path
        )


# ── Retrieval with Threshold ──────────────────────────────────────────────────

QA_THRESHOLD      = 0.8
CHAPTER_THRESHOLD = 1.5

def retrieve_context(qa_db, chapter_db, query):
    """
    Returns (context, source, score):
      'qa'      — exact match found in QA database
      'chapter' — fallback match found in chapters database
      'none'    — nothing relevant found
    """
    # Step 1: try QA DB
    qa_results = qa_db.similarity_search_with_score(query, k=1)
    if qa_results:
        doc, score = qa_results[0]
        if score < QA_THRESHOLD:
            return doc.page_content, "qa", score

    # Step 2: fall back to chapters DB
    chapter_results = chapter_db.similarity_search_with_score(query, k=1)
    if chapter_results:
        doc, score = chapter_results[0]
        if score < CHAPTER_THRESHOLD:
            return doc.page_content, "chapter", score

    # Step 3: nothing found
    return None, "none", None


# ── JSON Cleaner ──────────────────────────────────────────────────────────────

def clean_json(raw):
    # Strip markdown code blocks
    raw = re.sub(r'```json|```', '', raw)
    # Extract only first { to matching }
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        return ""
    raw = raw[start:end]
    raw = re.sub(r'//[^\n]*', '', raw)
    raw = re.sub(r'--[^\n]*', '', raw)
    raw = re.sub(r',\s*([}\]])', r'\1', raw)
    return raw.strip()


# ── Evaluator ─────────────────────────────────────────────────────────────────

def evaluate_answer(qa_db, chapter_db, query, candidate_answer, scoring_rubric):

    context, source, score = retrieve_context(qa_db, chapter_db, query)

    if source == "none":
        print("  ⚠ Out of scope — question not in knowledge base")
        return None, "none"

    source_label = "QA Database" if source == "qa" else "Chapter Reference"
    print(f"  [Source: {source_label} | Score: {score:.2f}] {context[:100].strip()}...")

    if source == "qa":
        context_instruction = "Use the Ideal Answer in the context as your reference."
    else:
        context_instruction = "No pre-written ideal answer exists. Use the chapter content to infer what a good answer should cover."

    prompt = f"""You are an interview evaluator. Output ONLY a JSON object.

Scoring Rubric:
{scoring_rubric}

Context:
{context}

Instruction: {context_instruction}

Question: {query}
Candidate Answer: {candidate_answer}

Score each dimension using the rubric above:
- technical_accuracy: factual correctness vs ideal answer (0.0-10.0)
- clarity: how clear and concise the answer is (0.0-10.0)
- completeness: how many key points were covered (0.0-10.0)
- communication: structure and professionalism of the answer (0.0-10.0)
- Do NOT penalize for extra correct information added.

Output ONLY this JSON, no other text:
{{"technical_accuracy": 0.0, "clarity": 0.0, "completeness": 0.0, "communication": 0.0, "strengths": ["point1"], "weaknesses": ["point1"]}}"""

    response = ollama.chat(
        model="phi3:mini",
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.message.content
    clean = clean_json(raw)

    try:
        result = json.loads(clean)

        scores = {
            "technical_accuracy": result.get("technical_accuracy"),
            "clarity"           : result.get("clarity"),
            "completeness"      : result.get("completeness"),
            "communication"     : result.get("communication"),
        }

        none_scores = [k for k, v in scores.items() if v is None]
        if none_scores:
            print(f"  ⚠ LLM returned null for: {', '.join(none_scores)}")

        low_scores = [f"{k}:{v}" for k, v in scores.items() if v is not None and v <= 2]
        if low_scores:
            print(f"  ⚠ Low scores detected: {', '.join(low_scores)}")

        return result, source

    except json.JSONDecodeError as e:
        print(f"  Parse error: {e}")
        print(f"  Raw: {raw[:200]}")
        return None, source

# ── Print Evaluation ──────────────────────────────────────────────────────────

def print_evaluation(result, answer, source):
    tag = "[QA]" if source == "qa" else "[Chapter ⚠ less reliable]"
    print(f"  Source             : {tag}")
    print(f"  Candidate Answer   : {answer[:100]}{'...' if len(answer) > 100 else ''}")
    print(f"  Technical Accuracy : {result.get('technical_accuracy')}/10")
    print(f"  Clarity            : {result.get('clarity')}/10")
    print(f"  Completeness       : {result.get('completeness')}/10")
    print(f"  Communication      : {result.get('communication')}/10")

    # Overall for this question
    vals = [
        result.get('technical_accuracy') or 0,
        result.get('clarity')            or 0,
        result.get('completeness')       or 0,
        result.get('communication')      or 0,
    ]
    print(f"  Question Average   : {sum(vals)/len(vals):.1f}/10")

    print("\n  Strengths:")
    for s in result.get("strengths", []):
        if s.strip():
            print(f"    ✓ {s}")
    print("\n  Weaknesses:")
    for w in result.get("weaknesses", []):
        if w.strip():
            print(f"    ✗ {w}")

# ── Main ──────────────────────────────────────────────────────────────────────

TRANSCRIPT_PATH = "transcript.txt"
QA_FOLDER       = "job_roles/data_analyst/qa"
CHAPTER_FOLDER  = "job_roles/data_analyst/chapters"
QA_DB_PATH      = "vector_db/qa"
CHAPTER_DB_PATH = "vector_db/chapters"
RUBRIC_PATH     = "job_roles/data_analyst/scoring_rubric.txt"

print("=" * 60)
print("  Loading Knowledge Base")
print("=" * 60)

# Load scoring rubric
scoring_rubric = ""
if os.path.exists(RUBRIC_PATH):
    with open(RUBRIC_PATH, "r", encoding="utf-8") as f:
        scoring_rubric = f.read()
    print("  Scoring rubric     : loaded")
else:
    print("  Scoring rubric     : not found, using default rules")

# Load QA documents
qa_documents = load_documents(QA_FOLDER)
if not qa_documents:
    raise ValueError(f"No documents found in '{QA_FOLDER}'")
qa_chunks = split_by_question(qa_documents)
print(f"  QA documents       : {len(qa_documents)} files, {len(qa_chunks)} chunks")

# Load chapter documents
chapter_documents = load_documents(CHAPTER_FOLDER)
if not chapter_documents:
    raise ValueError(f"No documents found in '{CHAPTER_FOLDER}'")
chapter_chunks = split_chapters(chapter_documents)
print(f"  Chapter documents  : {len(chapter_documents)} files, {len(chapter_chunks)} chunks")

# Embeddings
print("\n  Loading embeddings...")
embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Build or load vector DBs
os.makedirs("vector_db", exist_ok=True)
print("  QA DB:")
qa_db      = build_or_load_db(qa_chunks,      QA_DB_PATH,      embedding)
print("  Chapter DB:")
chapter_db = build_or_load_db(chapter_chunks, CHAPTER_DB_PATH, embedding)

# Parse transcript
if not os.path.exists(TRANSCRIPT_PATH):
    raise FileNotFoundError(f"Transcript not found: {TRANSCRIPT_PATH}")

transcript = parse_transcript(TRANSCRIPT_PATH)
print(f"\n  Transcript         : {len(transcript)} question(s) found")

# ── Evaluate ──────────────────────────────────────────────────────────────────

print("\n" + "=" * 60)
print("       AI INTERVIEW EVALUATOR — TRANSCRIPT MODE")
print("=" * 60)

scores = []

for i, pair in enumerate(transcript, 1):
    question = pair["question"]
    answer   = pair["answer"]

    print(f"\nQ{i}: {question}")
    print("Evaluating...")

    result, source = evaluate_answer(
        qa_db, chapter_db, question, answer, scoring_rubric
    )

    if result:
        print()
        print_evaluation(result, answer, source)
        print("-" * 60)

        scores.append({
            "question"          : question,
            "answer"            : answer,
            "source"            : source,
            "technical_accuracy": result.get("technical_accuracy"),
            "clarity"           : result.get("clarity"),
            "completeness"      : result.get("completeness"),
            "communication"     : result.get("communication"),
            "strengths"         : result.get("strengths", []),
            "weaknesses"        : result.get("weaknesses", [])
        })

    elif source == "none":
        print(f"  Skipped — not in knowledge base")
        scores.append({
            "question"          : question,
            "answer"            : answer,
            "source"            : "none",
            "technical_accuracy": None,
            "completeness"      : None,
            "strengths"         : [],
            "weaknesses"        : ["Question not in knowledge base"]
        })

# ── Summary ───────────────────────────────────────────────────────────────────

if scores:
    print("\n" + "=" * 70)
    print("                    FINAL SCORE SUMMARY")
    print("=" * 70)
    print(f"  {'Question':<35} {'Src':>4} {'Acc':>5} {'Cla':>5} {'Com':>5} {'Cmn':>5} {'Avg':>5}")
    print("-" * 70)

    total_acc  = 0
    total_cla  = 0
    total_comp = 0
    total_comm = 0
    evaluated  = 0

    for s in scores:
        q    = s["question"][:34]
        src  = s["source"].upper()[:3]
        acc  = s.get("technical_accuracy")
        cla  = s.get("clarity")
        comp = s.get("completeness")
        comm = s.get("communication")

        if all(v is not None for v in [acc, cla, comp, comm]):
            avg = (acc + cla + comp + comm) / 4
            print(f"  {q:<35} {src:>4} {acc:>5.1f} {cla:>5.1f} {comp:>5.1f} {comm:>5.1f} {avg:>5.1f}")
            total_acc  += acc
            total_cla  += cla
            total_comp += comp
            total_comm += comm
            evaluated  += 1
        else:
            print(f"  {q:<35} {'N/A':>4} {'N/A':>5} {'N/A':>5} {'N/A':>5} {'N/A':>5} {'N/A':>5}")

    if evaluated > 0:
        avg_acc  = total_acc  / evaluated
        avg_cla  = total_cla  / evaluated
        avg_comp = total_comp / evaluated
        avg_comm = total_comm / evaluated
        overall  = (avg_acc + avg_cla + avg_comp + avg_comm) / 4

        if overall >= 8:
            verdict = "STRONG HIRE ✓"
        elif overall >= 6:
            verdict = "CONSIDER ~"
        else:
            verdict = "PASS ✗"

        print("-" * 70)
        print(f"  {'Average':<35} {'':>4} {avg_acc:>5.1f} {avg_cla:>5.1f} {avg_comp:>5.1f} {avg_comm:>5.1f} {overall:>5.1f}")
        print("=" * 70)
        print(f"\n  Evaluated : {evaluated}/{len(scores)} questions")
        print(f"  Skipped   : {len(scores) - evaluated} (not in knowledge base)")
        print(f"\n  Breakdown :")
        print(f"    Technical Accuracy : {avg_acc:.1f}/10")
        print(f"    Clarity            : {avg_cla:.1f}/10")
        print(f"    Completeness       : {avg_comp:.1f}/10")
        print(f"    Communication      : {avg_comm:.1f}/10")
        print(f"\n  Overall Score : {overall:.1f}/10")
        print(f"  Verdict       : {verdict}")
        print("=" * 70)

    # Save updated results
    with open("evaluation_results.json", "w") as f:
        json.dump(scores, f, indent=2)
    print("\n  Full results saved to evaluation_results.json")