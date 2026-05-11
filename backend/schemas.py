from __future__ import annotations
from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


# ─── Auth ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "candidate"

    @field_validator("role")
    @classmethod
    def valid_role(cls, v):
        if v not in ("candidate", "recruiter", "admin"):
            return "candidate"
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    resume_text: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    token: str
    user: UserOut


class UpdateMeRequest(BaseModel):
    full_name: Optional[str] = None
    resume_text: Optional[str] = None


# ─── Jobs ────────────────────────────────────────────────────────────────────

class JobCreate(BaseModel):
    title: str
    company: Optional[str] = None
    description: str
    required_skills: Optional[List[str]] = []
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_range: Optional[str] = None
    is_active: Optional[bool] = True


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_range: Optional[str] = None
    is_active: Optional[bool] = None


class JobOut(BaseModel):
    id: str
    title: str
    company: Optional[str]
    description: str
    required_skills: Optional[List[str]]
    location: Optional[str]
    employment_type: Optional[str]
    salary_range: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Evaluate ────────────────────────────────────────────────────────────────

class EvaluateRequest(BaseModel):
    job_id: str
    resume_text: str
    transcript: str          # multi-line "Question: …\nAnswer: …" text
    model_name: str = "rag_evaluator"
    thresh_select: Optional[float] = 70.0
    thresh_consider: Optional[float] = 45.0


class EvaluationOut(BaseModel):
    id: str
    candidate_id: Optional[str]
    job_id: Optional[str]
    match_score: Optional[float]
    skill_match_ratio: Optional[float]
    num_matched_skills: Optional[int]
    num_missing_skills: Optional[int]
    num_candidate_skills: Optional[int]
    comm_score: Optional[float]
    conf_score: Optional[float]
    subj_score: Optional[float]
    tech_score: Optional[float]
    response_len: Optional[int]
    sentence_cmplx: Optional[float]
    ml_decision: Optional[str]
    ml_confidence: Optional[float]
    rule_decision: Optional[str]
    final_decision: Optional[str]
    explanation: Optional[str]
    model_used: Optional[str]
    matched_skills: Optional[List[str]]
    missing_skills: Optional[List[str]]
    question_results: Optional[List[Any]]
    job_title: Optional[str]
    job_company: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Analytics ───────────────────────────────────────────────────────────────

class AnalyticsOverview(BaseModel):
    total_candidates: int
    total_selected: int
    total_consider: int
    total_rejected: int
    avg_match_score: float
    total_jobs: int
    total_evaluations: int
