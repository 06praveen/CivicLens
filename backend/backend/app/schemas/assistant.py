"""
CivicLens Phase 6 & RAG Pipeline — Citizen Budget Assistant Schemas
"""
from typing import Optional, List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


class AssistantMessageHistory(BaseModel):
    role: str
    content: str


class AssistantRequest(BaseModel):
    """Citizen request payload for asking natural language budget questions."""
    question: str = Field(..., min_length=1, description="Natural language question from citizen")
    financial_year: Optional[str] = Field(None, description="Optional financial year filter (e.g. '2024-2025')")
    top_k: Optional[int] = Field(5, ge=1, le=50, description="Max results for search/RAG")
    session_id: Optional[str] = Field(None, description="Session ID for conversational follow-ups")
    history: Optional[List[AssistantMessageHistory]] = Field(default_factory=list, description="Recent conversation history")


class AssistantOption(BaseModel):
    """Selectable budget item option when user query is ambiguous."""
    budget_item_key: str
    budget_item: str
    ministry_department: Optional[str] = None


class AssistantSource(BaseModel):
    """Source reference citation for transparency."""
    source_type: str = Field(..., description="'budget_record' or 'government_document'")
    record_id: Optional[int] = None
    source_file: Optional[str] = None
    source_row: Optional[int] = None
    document_name: Optional[str] = None
    page_number: Optional[int] = None
    chunk_id: Optional[str] = None
    statement: Optional[str] = None


class AssistantResponse(BaseModel):
    """Structured response from the Citizen Budget Assistant."""
    answer: str
    intent: str = Field(..., description="Detected question intent")
    confidence: str = Field("high", description="Confidence score: 'high', 'medium', 'low'")
    budget_items: List[Dict[str, Any]] = Field(default_factory=list)
    data: Optional[Dict[str, Any]] = None
    tools_used: List[str] = Field(default_factory=list)
    sources: List[AssistantSource] = Field(default_factory=list)
    evidence_status: str = Field("directly_supported", description="Status: 'directly_supported', 'pattern_observed', 'insufficient_evidence', 'general_explanation'")
    requires_clarification: bool = False
    options: Optional[List[AssistantOption]] = None
    ai_available: bool = True
    session_id: Optional[str] = None
    source_indicator: str = Field("verified_civiclens_data", description="'verified_civiclens_data', 'budget_explanation', 'general_ai'")
    source_indicator_label: str = Field("✓ Verified CivicLens Data", description="User-facing source indicator badge text")

    @field_validator('data', mode='before')
    @classmethod
    def convert_decimal_in_data(cls, v):
        if isinstance(v, dict):
            return {k: (float(val) if isinstance(val, Decimal) else val) for k, val in v.items()}
        return v
