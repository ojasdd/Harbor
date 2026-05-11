import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import engine, Base
from backend.routers import auth, jobs, evaluate, candidates, upload, analytics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all DB tables on startup
    Base.metadata.create_all(bind=engine)
    logger.info("[Startup] Database tables created / verified.")

    # Preload default RAG evaluator in background
    try:
        from backend.rag_evaluator import preload_default_evaluator
        import threading
        t = threading.Thread(target=preload_default_evaluator, daemon=True)
        t.start()
        logger.info("[Startup] RAG evaluator preload started in background thread.")
    except Exception as exc:
        logger.warning(f"[Startup] RAG evaluator preload skipped: {exc}")

    yield
    logger.info("[Shutdown] Bye.")


app = FastAPI(
    title="ATS Intelligence API",
    description="RAG-powered AI interview evaluator backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(evaluate.router)
app.include_router(candidates.router)
app.include_router(upload.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {
        "service": "ATS Intelligence API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    import sys
    from pathlib import Path
    
    # Ensure the parent directory is in sys.path so 'backend.x' imports work
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
