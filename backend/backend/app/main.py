from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import check_db_connection
from app.routers import budgets, analysis, investigations, rag, assistant, reports, auth, admin, voice, issue_reports

app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    description="CivicLens Intelligent Government Budget Transparency Platform API",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
origins = [origin.strip() for origin in settings.FRONTEND_ORIGIN.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(budgets.router)
app.include_router(analysis.router)
app.include_router(investigations.router)
app.include_router(rag.router)
app.include_router(assistant.router)
app.include_router(reports.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(voice.router)
app.include_router(issue_reports.router)





@app.get("/", tags=["Health"])
def root():
    return {
        "service": settings.APP_TITLE,
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }

@app.get("/health", tags=["Health"])
@app.get("/status", tags=["Health"])
@app.get("/api/status", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    db_status = check_db_connection()
    return {
        "status": "ok" if db_status["connected"] else "degraded",
        "service": settings.APP_TITLE,
        "database": db_status
    }
