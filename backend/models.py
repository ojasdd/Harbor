import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Float, Integer, Text, DateTime, JSON
from backend.database import Base


def gen_uuid():
    return str(uuid.uuid4())


def now_utc():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="candidate")  # candidate | recruiter | admin
    resume_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=gen_uuid)
    title = Column(String, nullable=False)
    company = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    required_skills = Column(JSON, default=list)
    location = Column(String, nullable=True)
    employment_type = Column(String, nullable=True)
    salary_range = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(String, nullable=True)  # user id
    created_at = Column(DateTime, default=now_utc)


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String, primary_key=True, default=gen_uuid)
    candidate_id = Column(String, nullable=True)
    job_id = Column(String, nullable=True)

    # Resume + transcript
    resume_text = Column(Text, nullable=True)
    transcript_text = Column(Text, nullable=True)

    # Scores mapped from RAG evaluator
    match_score = Column(Float, nullable=True)          # 0-100 overall %
    skill_match_ratio = Column(Float, nullable=True)    # 0-1
    num_matched_skills = Column(Integer, nullable=True)
    num_missing_skills = Column(Integer, nullable=True)
    num_candidate_skills = Column(Integer, nullable=True)

    # Interview analysis
    comm_score = Column(Float, nullable=True)   # clarity avg  0-1
    conf_score = Column(Float, nullable=True)   # technical accuracy  0-1
    subj_score = Column(Float, nullable=True)   # completeness  0-1
    tech_score = Column(Float, nullable=True)   # communication  0-1
    response_len = Column(Integer, nullable=True)
    sentence_cmplx = Column(Float, nullable=True)

    # Decision
    ml_decision = Column(String, nullable=True)
    ml_confidence = Column(Float, nullable=True)  # 0-100 %
    rule_decision = Column(String, nullable=True)
    final_decision = Column(String, nullable=True)  # SELECT | CONSIDER | REJECT
    explanation = Column(Text, nullable=True)
    model_used = Column(String, nullable=True)

    # Skills
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)

    # Per-question breakdown
    question_results = Column(JSON, default=list)

    # Denormalized for display
    job_title = Column(String, nullable=True)
    job_company = Column(String, nullable=True)

    created_at = Column(DateTime, default=now_utc)
