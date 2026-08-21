from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, field_validator

class BudgetRecordResponse(BaseModel):
    record_id: int
    financial_year: str
    amount_stage: str
    statement: Optional[str] = None
    demand_no: Optional[str] = None
    ministry_department: Optional[str] = None
    expenditure_category: Optional[str] = None
    category_number: Optional[str] = None
    budget_item: str
    row_type: Optional[str] = None
    budget_item_key: str
    amount: Optional[float] = None
    revenue_amount: Optional[float] = None
    capital_amount: Optional[float] = None
    total_amount: Optional[float] = None
    unit: str
    source_file: str
    source_row: int

    @field_validator('amount', 'revenue_amount', 'capital_amount', 'total_amount', mode='before')
    @classmethod
    def convert_decimal_to_float(cls, v):
        if isinstance(v, Decimal):
            return float(v)
        return v

    model_config = ConfigDict(from_attributes=True)

class PaginatedBudgetResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    data: List[BudgetRecordResponse]

class SectorAllocationSchema(BaseModel):
    sector: str
    amount: float
    pct: float
    color: str

class YoYTrendSchema(BaseModel):
    year: str
    budget: float
    expenditure: float
    capitalExp: float

class BudgetSummaryResponse(BaseModel):
    financial_year: Optional[str] = "2024-2025"
    total_records: int
    unique_ministries: int
    unique_categories: int
    unique_budget_items: int
    unique_item_keys: int
    total_budget: Optional[float] = 0.0
    revenue_expenditure: Optional[float] = 0.0
    capital_expenditure: Optional[float] = 0.0
    department_count: Optional[int] = 0
    items_count: Optional[int] = 0
    available_financial_years: List[str]
    available_amount_stages: List[str]
    filtered_amount_stage: Optional[str] = None
    total_amount: Optional[float] = None
    sector_allocations: List[SectorAllocationSchema] = []
    yoy_trend: List[YoYTrendSchema] = []
    top_departments: Optional[List[dict]] = []

class BudgetFiltersResponse(BaseModel):
    financial_years: List[str]
    amount_stages: List[str]
    ministries_departments: List[str]
    expenditure_categories: List[str]
    statements: List[str]
