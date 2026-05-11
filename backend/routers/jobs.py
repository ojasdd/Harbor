from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend import models, schemas
from backend.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("", response_model=List[schemas.JobOut])
def list_jobs(
    active_only: bool = Query(True),
    limit: int = Query(50),
    db: Session = Depends(get_db),
):
    q = db.query(models.Job)
    if active_only:
        q = q.filter(models.Job.is_active == True)
    return q.order_by(models.Job.created_at.desc()).limit(limit).all()


@router.get("/{job_id}", response_model=schemas.JobOut)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("", response_model=schemas.JobOut)
def create_job(
    payload: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("recruiter", "admin")),
):
    job = models.Job(**payload.model_dump(), created_by=current_user.id)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.patch("/{job_id}", response_model=schemas.JobOut)
def update_job(
    job_id: str,
    payload: schemas.JobUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("recruiter", "admin")),
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}")
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("recruiter", "admin")),
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"ok": True}
