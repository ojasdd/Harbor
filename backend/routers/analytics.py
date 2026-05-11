from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Any
from collections import Counter

from backend.database import get_db
from backend import models, schemas
from backend.auth import require_roles

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _get_evals(db: Session):
    return db.query(models.Evaluation).all()


@router.get("/overview", response_model=schemas.AnalyticsOverview)
def overview(
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter", "admin")),
):
    evals = _get_evals(db)
    total_evals = len(evals)
    unique_candidates = len(set(e.candidate_id for e in evals if e.candidate_id))
    selected = sum(1 for e in evals if (e.final_decision or "").upper() == "SELECT")
    consider = sum(1 for e in evals if (e.final_decision or "").upper() == "CONSIDER")
    rejected = sum(1 for e in evals if (e.final_decision or "").upper() == "REJECT")
    avg_match = (
        sum(e.match_score or 0 for e in evals) / total_evals if total_evals else 0.0
    )
    total_jobs = db.query(models.Job).count()

    return {
        "total_candidates": unique_candidates,
        "total_selected": selected,
        "total_consider": consider,
        "total_rejected": rejected,
        "avg_match_score": round(avg_match, 2),
        "total_jobs": total_jobs,
        "total_evaluations": total_evals,
    }


@router.get("/scores")
def score_distribution(
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter", "admin")),
):
    evals = _get_evals(db)
    buckets = {f"{i}-{i+10}": 0 for i in range(0, 100, 10)}
    for ev in evals:
        score = ev.match_score or 0
        bucket_idx = min(int(score // 10) * 10, 90)
        key = f"{bucket_idx}-{bucket_idx+10}"
        buckets[key] = buckets.get(key, 0) + 1
    return [{"range": k, "count": v} for k, v in buckets.items()]


@router.get("/skills")
def skills_gap(
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter", "admin")),
):
    evals = _get_evals(db)
    matched_counter: Counter = Counter()
    missing_counter: Counter = Counter()
    for ev in evals:
        for skill in (ev.matched_skills or []):
            matched_counter[skill] += 1
        for skill in (ev.missing_skills or []):
            missing_counter[skill] += 1

    all_skills = set(list(matched_counter.keys()) + list(missing_counter.keys()))
    result = [
        {
            "skill": skill,
            "matched": matched_counter.get(skill, 0),
            "missing": missing_counter.get(skill, 0),
        }
        for skill in all_skills
    ]
    result.sort(key=lambda x: x["matched"] + x["missing"], reverse=True)
    return result[:15]


@router.get("/model-performance")
def model_performance(
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter", "admin")),
):
    """Return static model performance data (from frontend page.tsx MODEL_STATS)."""
    return {
        "model_scores": {
            "transformer": {"accuracy": 0.965, "f1": 0.972, "roc_auc": 0.975},
            "lstm": {"accuracy": 0.952, "f1": 0.961, "roc_auc": 0.965},
            "gru": {"accuracy": 0.948, "f1": 0.957, "roc_auc": 0.960},
            "dnn": {"accuracy": 0.945, "f1": 0.955, "roc_auc": 0.958},
            "mlp": {"accuracy": 0.940, "f1": 0.968, "roc_auc": 0.962},
            "xgboost": {"accuracy": 0.929, "f1": 0.962, "roc_auc": 0.968},
            "random_forest": {"accuracy": 0.895, "f1": 0.943, "roc_auc": 0.968},
            "logistic_regression": {"accuracy": 0.849, "f1": 0.917, "roc_auc": 0.963},
        }
    }


@router.get("/jobs-breakdown")
def jobs_breakdown(
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter", "admin")),
):
    evals = _get_evals(db)
    jobs = db.query(models.Job).all()
    job_map = {j.id: j for j in jobs}

    breakdown: dict = {}
    for ev in evals:
        jid = ev.job_id
        if jid not in breakdown:
            job = job_map.get(jid)
            breakdown[jid] = {
                "job_id": jid,
                "job_title": ev.job_title or (job.title if job else "Unknown"),
                "total": 0,
                "selected": 0,
                "consider": 0,
                "rejected": 0,
            }
        breakdown[jid]["total"] += 1
        dec = (ev.final_decision or "").upper()
        if dec == "SELECT":
            breakdown[jid]["selected"] += 1
        elif dec == "CONSIDER":
            breakdown[jid]["consider"] += 1
        else:
            breakdown[jid]["rejected"] += 1

    result = sorted(breakdown.values(), key=lambda x: x["total"], reverse=True)
    return result[:10]
