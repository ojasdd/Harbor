"""
Seed script — creates initial data:
  - Admin user (admin@ats.ai / admin123)
  - Recruiter user (recruiter@ats.ai / recruiter123)
  - One job per role in job_roles/
Run once: python -m backend.seed
"""
import os
import sys

# Ensure we can import from project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, SessionLocal, Base
from backend import models
from backend.auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ── Users ─────────────────────────────────────────────────────────────────────

def create_user_if_missing(email, password, full_name, role):
    existing = db.query(models.User).filter(models.User.email == email).first()
    if not existing:
        user = models.User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=role,
        )
        db.add(user)
        db.commit()
        print(f"  Created {role}: {email}")
    else:
        print(f"  Already exists: {email}")
    return db.query(models.User).filter(models.User.email == email).first()

admin = create_user_if_missing("admin@ats.ai", "admin123", "Admin User", "admin")
recruiter = create_user_if_missing("recruiter@ats.ai", "recruiter123", "HR Recruiter", "recruiter")
create_user_if_missing("candidate@ats.ai", "candidate123", "Demo Candidate", "candidate")

# ── Jobs ──────────────────────────────────────────────────────────────────────

JOB_DATA = [
    {
        "title": "Data Analyst",
        "company": "ATS Intelligence",
        "description": (
            "Analyze large datasets, build dashboards, and generate actionable business insights. "
            "Work with SQL, Python, and BI tools to support data-driven decisions."
        ),
        "required_skills": ["SQL", "Python", "Excel", "Tableau", "Statistics", "ETL", "Power BI"],
        "location": "Remote",
        "employment_type": "Full-time",
        "salary_range": "$70,000 – $95,000",
    },
    {
        "title": "ML Engineer",
        "company": "ATS Intelligence",
        "description": (
            "Design, train, and deploy machine learning models at scale. "
            "Collaborate with data scientists and engineers to bring ML solutions to production."
        ),
        "required_skills": ["Python", "TensorFlow", "PyTorch", "Docker", "Kubernetes", "MLflow", "scikit-learn"],
        "location": "Hybrid — New York, NY",
        "employment_type": "Full-time",
        "salary_range": "$120,000 – $160,000",
    },
    {
        "title": "Data Scientist",
        "company": "ATS Intelligence",
        "description": (
            "Apply statistical modelling, NLP, and deep learning to solve complex business problems. "
            "Communicate findings to stakeholders through visualisations and reports."
        ),
        "required_skills": ["Python", "R", "Statistics", "Machine Learning", "NLP", "Jupyter", "SQL"],
        "location": "Remote",
        "employment_type": "Full-time",
        "salary_range": "$100,000 – $140,000",
    },
    {
        "title": "Data Engineer",
        "company": "ATS Intelligence",
        "description": (
            "Build and maintain scalable data pipelines, warehouses, and infrastructure. "
            "Work with cloud platforms to ensure data quality and availability."
        ),
        "required_skills": ["Python", "Spark", "Airflow", "AWS", "Kafka", "dbt", "SQL", "PostgreSQL"],
        "location": "Hybrid — San Francisco, CA",
        "employment_type": "Full-time",
        "salary_range": "$115,000 – $155,000",
    },
    {
        "title": "Backend Engineer",
        "company": "ATS Intelligence",
        "description": (
            "Develop high-performance APIs and microservices. "
            "Own backend systems end-to-end from design to deployment."
        ),
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis", "REST API", "Git"],
        "location": "Remote",
        "employment_type": "Full-time",
        "salary_range": "$110,000 – $150,000",
    },
    {
        "title": "Frontend Engineer",
        "company": "ATS Intelligence",
        "description": (
            "Build modern, responsive web interfaces with React and Next.js. "
            "Collaborate closely with designers and backend engineers."
        ),
        "required_skills": ["TypeScript", "React", "Next.js", "Tailwind CSS", "REST API", "Git", "CSS"],
        "location": "Remote",
        "employment_type": "Full-time",
        "salary_range": "$100,000 – $140,000",
    },
    {
        "title": "AI Engineer",
        "company": "ATS Intelligence",
        "description": (
            "Integrate LLMs and AI services into production products. "
            "Build RAG pipelines, fine-tune models, and implement AI workflows."
        ),
        "required_skills": ["Python", "LangChain", "OpenAI", "RAG", "Vector DB", "FastAPI", "Transformers"],
        "location": "Remote",
        "employment_type": "Full-time",
        "salary_range": "$130,000 – $170,000",
    },
    {
        "title": "Business Analyst",
        "company": "ATS Intelligence",
        "description": (
            "Bridge business and technology by gathering requirements, documenting processes, "
            "and delivering analysis to drive strategic decisions."
        ),
        "required_skills": ["Excel", "SQL", "Power BI", "Jira", "Confluence", "Process Mapping", "Stakeholder Management"],
        "location": "Hybrid — Chicago, IL",
        "employment_type": "Full-time",
        "salary_range": "$75,000 – $100,000",
    },
]

for data in JOB_DATA:
    existing = db.query(models.Job).filter(models.Job.title == data["title"]).first()
    if not existing:
        job = models.Job(**data, created_by=recruiter.id)
        db.add(job)
        print(f"  Created job: {data['title']}")
    else:
        print(f"  Job already exists: {data['title']}")

db.commit()
db.close()

print("\nSeed complete!")
print("  Admin:     admin@ats.ai     / admin123")
print("  Recruiter: recruiter@ats.ai / recruiter123")
print("  Candidate: candidate@ats.ai / candidate123")
