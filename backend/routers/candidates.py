import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend import models, schemas
from backend.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/candidates", tags=["candidates"])


@router.get("/my", response_model=List[schemas.EvaluationOut])
def my_evaluations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return all evaluations for the current candidate."""
    return (
        db.query(models.Evaluation)
        .filter(models.Evaluation.candidate_id == current_user.id)
        .order_by(models.Evaluation.created_at.desc())
        .all()
    )


@router.get("/export/csv")
def export_csv(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("recruiter", "admin")),
):
    evals = db.query(models.Evaluation).order_by(models.Evaluation.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "candidate_id", "job_title", "job_company",
        "match_score", "final_decision", "ml_confidence",
        "comm_score", "tech_score", "created_at",
    ])
    for ev in evals:
        writer.writerow([
            ev.id, ev.candidate_id, ev.job_title, ev.job_company,
            ev.match_score, ev.final_decision, ev.ml_confidence,
            ev.comm_score, ev.tech_score, ev.created_at,
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ats_candidates.csv"},
    )


@router.get("", response_model=List[schemas.EvaluationOut])
def list_candidates(
    decision: Optional[str] = Query(None),
    job_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("recruiter", "admin")),
):
    q = db.query(models.Evaluation)
    if decision:
        q = q.filter(models.Evaluation.final_decision == decision.upper())
    if job_id:
        q = q.filter(models.Evaluation.job_id == job_id)
    return q.order_by(models.Evaluation.created_at.desc()).limit(200).all()
