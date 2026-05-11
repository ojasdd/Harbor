import io
from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend import models
from backend.auth import get_current_user

router = APIRouter(prefix="/api/upload", tags=["upload"])


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from PDF bytes using pdfplumber."""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        return "\n".join(pages).strip()
    except ImportError:
        return ""
    except Exception:
        return ""


@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    save_to_profile: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    content = await file.read()

    # Extract text depending on file type
    filename = file.filename or ""
    if filename.lower().endswith(".pdf"):
        text = extract_text_from_pdf(content)
    else:
        # Plain text fallback
        text = content.decode("utf-8", errors="replace")

    if save_to_profile and text:
        current_user.resume_text = text
        db.commit()

    return {
        "filename": filename,
        "characters": len(text),
        "resume_text": text[:500] + ("..." if len(text) > 500 else ""),
        "full_text": text,
    }
