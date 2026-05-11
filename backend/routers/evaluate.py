from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from backend.database import get_db
from backend import models, schemas
from backend.auth import get_current_user
from backend.rag_evaluator import get_evaluator

router = APIRouter(prefix="/api/evaluate", tags=["evaluate"])


@router.post("", response_model=schemas.EvaluationOut)
def submit_evaluation(
    payload: schemas.EvaluateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Fetch job info
    job = db.query(models.Job).filter(models.Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Get evaluator for this job's title/role
    evaluator = get_evaluator(job.title)

    if not evaluator._ready:
        raise HTTPException(
            status_code=503,
            detail="RAG evaluator is not ready. Check Ollama + vector DB setup.",
        )

    # Run evaluation
    result = evaluator.evaluate_transcript(
        transcript_text=payload.transcript,
        resume_text=payload.resume_text,
        job_description=job.description,
        required_skills=job.required_skills or [],
        thresh_select=payload.thresh_select or 70.0,
        thresh_consider=payload.thresh_consider or 45.0,
        model_name=payload.model_name,
    )

    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])

    # Save to DB
    evaluation = models.Evaluation(
        candidate_id=current_user.id,
        job_id=job.id,
        resume_text=payload.resume_text,
        transcript_text=payload.transcript,
        job_title=job.title,
        job_company=job.company,
        **{k: v for k, v in result.items() if k != "error"},
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    return evaluation


@router.get("/{eval_id}", response_model=schemas.EvaluationOut)
def get_evaluation(
    eval_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ev = db.query(models.Evaluation).filter(models.Evaluation.id == eval_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    # Candidates can only see their own
    if current_user.role == "candidate" and ev.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return ev
