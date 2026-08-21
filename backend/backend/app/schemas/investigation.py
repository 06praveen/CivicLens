"""
CivicLens Phase 4 — Agentic AI Investigation Schemas
"""
from typing import Optional, List, Any, Dict
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


class InvestigationRequest(BaseModel):
    """Payload to trigger an agentic investigation for a budget item anomaly."""
    budget_item_key: str = Field(..., description="Target budget item key to investigate")
    ministry_department: Optional[str] = Field(None, description="Scope by Ministry / Department")
    financial_year: Optional[str] = Field(None, description="Target anomaly financial year (e.g. '2020-2021')")
    previous_financial_year: Optional[str] = Field(None, description="Previous financial year to compare against")
    amount_stage: str = Field("Budget Estimates", description="Budget stage: 'Actuals', 'Budget Estimates', 'Revised Estimates'")
    value_type: str = Field("amount", description="Amount column to evaluate: 'amount', 'total_amount', 'revenue_amount', 'capital_amount'")
    threshold: float = Field(20.0, ge=0.0, description="Minimum percentage change threshold to verify")


class InvestigationStep(BaseModel):
    """A discrete visible step taken by the investigation workflow."""
    step: int
    action: str
    result: str
    details: Optional[Dict[str, Any]] = None

    @field_validator('details', mode='before')
    @classmethod
    def convert_decimal_in_details(cls, v):
        if isinstance(v, dict):
            return {k: (float(val) if isinstance(val, Decimal) else val) for k, val in v.items()}
        return v


class InvestigationSource(BaseModel):
    """Official source record metadata preserved for CivicLens transparency."""
    record_id: int
    source_file: str
    source_row: int
    statement: Optional[str] = None
    demand_no: Optional[str] = None
    ministry_department: Optional[str] = None
    budget_item: str


class InvestigationExplanation(BaseModel):
    """Synthesized grounded explanation and evidence sufficiency classification."""
    summary: str
    confidence: str = Field("medium", description="Confidence score: 'high', 'medium', 'low'")
    evidence_status: str = Field("insufficient_evidence", description="Status: 'directly_supported', 'pattern_observed', 'insufficient_evidence'")
    key_findings: List[str] = Field(default_factory=list)
    ai_generated: bool = False


class InvestigationResponse(BaseModel):
    """Complete structured investigation result."""
    investigation_id: str
    status: str = Field("completed", description="Status: 'completed' or 'ai_explanation_unavailable'")
    anomaly: Dict[str, Any]
    investigation_steps: List[InvestigationStep]
    explanation: InvestigationExplanation
    sources: List[InvestigationSource]

    @field_validator('anomaly', mode='before')
    @classmethod
    def convert_decimal_in_anomaly(cls, v):
        if isinstance(v, dict):
            return {k: (float(val) if isinstance(val, Decimal) else val) for k, val in v.items()}
        return v
