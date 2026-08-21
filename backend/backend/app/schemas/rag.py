"""
CivicLens Phase 5 — RAG Document Schemas
"""
from typing import Optional, List
from pydantic import BaseModel, Field


class DocumentChunk(BaseModel):
    """A single retrieved text chunk from official government budget documents."""
    chunk_id: str
    text: str
    document_name: str
    source_file: str
    document_type: str = Field("Union Budget Document", description="Document type: e.g. Expenditure Profile, Budget at a Glance")
    financial_year: str = Field("Unknown", description="Target financial year (e.g. '2024-2025')")
    page_number: int = Field(1, ge=1, description="1-indexed page number in the original PDF")
    similarity_score: Optional[float] = Field(None, description="Relevance/similarity score")


class RAGSearchRequest(BaseModel):
    """Payload to search official budget documents semantically."""
    query: str = Field(..., min_length=2, description="Search query or budget topic to look up")
    top_k: int = Field(5, ge=1, le=50, description="Maximum number of relevant chunks to return")
    financial_year: Optional[str] = Field(None, description="Optional financial year filter (e.g. '2024-2025')")
    document_type: Optional[str] = Field(None, description="Optional document type filter")


class RAGSearchResponse(BaseModel):
    """Structured response for RAG search query."""
    query: str
    total_results: int
    results: List[DocumentChunk]
