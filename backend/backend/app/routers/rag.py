"""
CivicLens Phase 5 — RAG Document Search API Router
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.rag import RAGSearchRequest, RAGSearchResponse, DocumentChunk
from app.services.rag_service import RAGService

router = APIRouter(prefix="/api/rag", tags=["RAG Document Retrieval"])

@router.get(
    "/search",
    response_model=RAGSearchResponse,
    summary="Search official government budget documents semantically",
    description=(
        "Retrieves relevant text chunks from official Indian Union Budget PDF documents "
        "including exact page numbers, document names, and financial years for source grounding."
    ),
)
def search_documents_get(
    query: str = Query(..., min_length=2, description="Search query or budget topic"),
    top_k: int = Query(5, ge=1, le=50, description="Maximum number of relevant chunks to return"),
    financial_year: Optional[str] = Query(None, description="Optional target financial year filter (e.g. '2024-2025')"),
    document_type: Optional[str] = Query(None, description="Optional document type filter"),
):
    try:
        results = RAGService.search_documents(
            query=query,
            top_k=top_k,
            financial_year=financial_year,
            document_type=document_type
        )
        return RAGSearchResponse(
            query=query,
            total_results=len(results),
            results=[DocumentChunk(**r) for r in results]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG document search failed: {str(e)}"
        )

@router.post(
    "/search",
    response_model=RAGSearchResponse,
    summary="Search official budget documents via POST",
    description="POST payload equivalent of the document retrieval search endpoint.",
)
def search_documents_post(payload: RAGSearchRequest):
    try:
        results = RAGService.search_documents(
            query=payload.query,
            top_k=payload.top_k,
            financial_year=payload.financial_year,
            document_type=payload.document_type
        )
        return RAGSearchResponse(
            query=payload.query,
            total_results=len(results),
            results=[DocumentChunk(**r) for r in results]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG document search failed: {str(e)}"
        )

@router.post(
    "/ingest",
    summary="Trigger document ingestion and vector index update",
    description="Scans PDF document directories, extracts text page by page, chunks, and updates vector store.",
)
def trigger_ingestion(max_pages: int = Query(50, ge=1, le=500)):
    try:
        summary = RAGService.ingest_documents(max_pages_per_doc=max_pages)
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document ingestion failed: {str(e)}"
        )
