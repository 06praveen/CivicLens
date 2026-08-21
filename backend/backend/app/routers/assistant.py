"""
CivicLens Phase 6 — Citizen Budget Assistant API Router
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db, check_db_connection
from app.schemas.assistant import AssistantRequest, AssistantResponse
from app.services.assistant_service import AssistantService
from app.services.rag_service import RAGService

router = APIRouter(prefix="/api/assistant", tags=["Citizen Budget Assistant"])


@router.post(
    "/ask",
    response_model=AssistantResponse,
    summary="Ask the CivicLens Citizen Budget Assistant a plain language question",
    description=(
        "Accepts natural language questions from citizens, classifies intent, "
        "resolves target budget items, orchestrates queries across PostgreSQL budget data, "
        "YoY analysis, anomaly detection, Phase 4 investigation workflows, and RAG document search. "
        "Returns grounded plain language answers with full source citations."
    ),
)
def ask_assistant(
    payload: AssistantRequest,
    db: Session = Depends(get_db)
):
    try:
        result = AssistantService.ask_assistant(
            db=db,
            question=payload.question,
            target_fy=payload.financial_year,
            top_k=payload.top_k or 5,
            session_id=payload.session_id
        )
        return AssistantResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing citizen question: {str(e)}"
        )


@router.get(
    "/health",
    summary="Check Citizen Assistant system & dependency health",
    description="Reports connectivity and readiness status of database, RAG vector store, and AI provider.",
)
def assistant_health_check():
    db_status = check_db_connection()
    
    # Check vector store
    v_path = RAGService.get_vector_store_path()
    rag_ready = v_path.exists()
    chunks_count = 0
    if rag_ready:
        try:
            import json
            with open(v_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                chunks_count = data.get("total_chunks", 0)
        except Exception:
            pass

    # Check LLM key configuration
    has_llm_key = bool(settings.GEMINI_API_KEY or settings.OPENAI_API_KEY or settings.LLM_API_KEY)

    return {
        "status": "ok" if db_status["connected"] else "degraded",
        "service": "CivicLens Citizen Budget Assistant",
        "dependencies": {
            "database": db_status,
            "vector_store": {
                "available": rag_ready,
                "chunks_count": chunks_count,
                "path": str(v_path)
            },
            "ai_provider": {
                "configured": has_llm_key,
                "fallback_mode_active": not has_llm_key
            }
        }
    }
