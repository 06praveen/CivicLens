"""
CivicLens Budget Issue Reporting Schemas
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


VALID_CATEGORIES = [
    "Possible Data Discrepancy",
    "Suspicious Budget Allocation",
    "Possible Misuse of Funds",
    "Unusual Budget Change",
    "Missing or Incorrect Information",
    "Possible Scam / Fraud Concern",
    "Other"
]

VALID_STATUSES = ["submitted", "under_review", "needs_information", "resolved", "dismissed"]
VALID_PRIORITIES = ["low", "normal", "high", "urgent"]


class IssueReportCreate(BaseModel):
    issue_category: str = Field(..., description="Category of the reported concern")
    financial_year: Optional[str] = Field(None, description="Related financial year")
    ministry_department: Optional[str] = Field(None, description="Related ministry or department")
    budget_item: Optional[str] = Field(None, description="Related budget item or scheme name")
    issue_title: str = Field(..., min_length=3, max_length=150, description="Short title summarizing the concern")
    description: str = Field(..., min_length=20, description="Detailed explanation of the concern (min 20 chars)")
    evidence_reference: Optional[str] = Field(None, description="Optional evidence, record ID, or reference URL")
    is_anonymous: bool = Field(False, description="Whether to submit anonymously")
    declaration: bool = Field(..., description="Must agree that submission is a concern for review")

    @field_validator("issue_category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"Invalid issue category. Must be one of: {', '.join(VALID_CATEGORIES)}")
        return v

    @field_validator("declaration")
    @classmethod
    def validate_declaration(cls, v: bool) -> bool:
        if not v:
            raise ValueError("You must accept the declaration that this submission is a concern for review.")
        return v


class IssueReportUpdateAdmin(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    admin_notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in VALID_STATUSES:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in VALID_PRIORITIES:
            raise ValueError(f"Invalid priority. Must be one of: {', '.join(VALID_PRIORITIES)}")
        return v


class IssueReportResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    is_anonymous: bool
    issue_category: str
    financial_year: Optional[str] = None
    ministry_department: Optional[str] = None
    budget_item: Optional[str] = None
    issue_title: str
    description: str
    evidence_reference: Optional[str] = None
    status: str
    priority: str
    admin_notes: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    reporter_name: str = "Anonymous Citizen"

    class Config:
        from_attributes = True


class ReportOptionsResponse(BaseModel):
    financial_years: List[str]
    ministries_departments: List[str]
    categories: List[str]
