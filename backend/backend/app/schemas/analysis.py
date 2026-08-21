"""
CivicLens Phase 3 & Department AI Insights — Analysis & Anomaly Detection Pydantic Schemas
"""
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, field_validator


class TrendPoint(BaseModel):
    """A single year's data point in a budget item trend."""
    financial_year: str
    amount: Optional[float] = None
    record_count: int = 1
    previous_financial_year: Optional[str] = None
    previous_amount: Optional[float] = None
    absolute_change: Optional[float] = None
    percentage_change: Optional[float] = None

    @field_validator('amount', 'previous_amount', 'absolute_change', 'percentage_change', mode='before')
    @classmethod
    def convert_decimal(cls, v):
        if isinstance(v, Decimal):
            return float(v)
        return v


class BudgetTrendResponse(BaseModel):
    """Year-over-year trend for a single budget item."""
    budget_item_key: str
    budget_item: Optional[str] = None
    ministry_department: Optional[str] = None
    amount_stage: str
    value_type: str
    unit: str = "₹ Crore"
    trend: List[TrendPoint]


class BudgetComparisonResponse(BaseModel):
    """Side-by-side comparison of a budget item between two financial years."""
    budget_item_key: str
    budget_item: Optional[str] = None
    ministry_department: Optional[str] = None
    amount_stage: str
    value_type: str
    unit: str = "₹ Crore"
    year1: str
    year1_amount: Optional[float] = None
    year2: str
    year2_amount: Optional[float] = None
    absolute_change: Optional[float] = None
    percentage_change: Optional[float] = None
    direction: str  # "increase", "decrease", "no_change", "unavailable"

    @field_validator(
        'year1_amount', 'year2_amount', 'absolute_change', 'percentage_change',
        mode='before'
    )
    @classmethod
    def convert_decimal(cls, v):
        if isinstance(v, Decimal):
            return float(v)
        return v


class AnomalyRecord(BaseModel):
    """A single detected spending anomaly with confidence classification and source traceability."""
    budget_item_key: str
    budget_item: Optional[str] = None
    ministry_department: Optional[str] = None
    expenditure_category: Optional[str] = None
    statement: Optional[str] = None
    financial_year: str
    previous_financial_year: str
    previous_amount: Optional[float] = None
    current_amount: Optional[float] = None
    absolute_change: Optional[float] = None
    percentage_change: Optional[float] = None
    anomaly_type: str  # "spending_spike" or "spending_drop"
    threshold_used: float
    amount_stage: str
    value_type: str
    unit: str = "₹ Crore"
    confidence_level: str = "HIGH CONFIDENCE"  # "HIGH CONFIDENCE", "REQUIRES SOURCE REVIEW", "LIMITED HISTORICAL DATA"
    status_wording: Optional[str] = None
    observation_years_count: int = 1
    source_file: Optional[str] = None
    source_record_ids: List[int] = []

    @field_validator(
        'previous_amount', 'current_amount', 'absolute_change', 'percentage_change',
        mode='before'
    )
    @classmethod
    def convert_decimal(cls, v):
        if isinstance(v, Decimal):
            return float(v)
        return v


class PaginatedAnomalyResponse(BaseModel):
    """Paginated list of anomaly results."""
    total: int
    page: int
    limit: int
    total_pages: int
    threshold: float
    amount_stage: str
    value_type: str
    data: List[AnomalyRecord]


class ItemAnomalyHistoryResponse(BaseModel):
    """All anomalies for a single budget item across years."""
    budget_item_key: str
    budget_item: Optional[str] = None
    ministry_department: Optional[str] = None
    amount_stage: str
    value_type: str
    unit: str = "₹ Crore"
    anomalies: List[AnomalyRecord]
    trend: List[TrendPoint]
