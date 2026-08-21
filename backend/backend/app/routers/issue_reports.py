"""
CivicLens Budget Concern & Issue Reporting Router
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db, get_auth_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.report import (
    IssueReportCreate,
    IssueReportResponse,
    ReportOptionsResponse
)
from app.services.report_issue_service import ReportIssueService

router = APIRouter(prefix="/api/reports", tags=["Budget Issue Reports"])


@router.get(
    "/options",
    response_model=ReportOptionsResponse,
    summary="Get database-driven options for issue reporting dropdowns",
    description="Returns distinct financial years, ministries/departments from PostgreSQL budget_records table."
)
def get_report_options(db: Session = Depends(get_db)):
    return ReportIssueService.get_options(db)


@router.post(
    "",
    response_model=IssueReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new budget concern report",
    description="Allows authenticated citizens to raise concerns about suspicious allocations, discrepancies, or missing information."
)
def create_issue_report(
    payload: IssueReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        report = ReportIssueService.create_report(db, payload, current_user)
        return ReportIssueService.get_report_detail(db, report.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to submit issue report: {str(e)}"
        )


@router.get(
    "/my-reports",
    response_model=List[IssueReportResponse],
    summary="Get issue reports submitted by current user",
    description="Returns list of concern reports raised by the currently authenticated user."
)
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ReportIssueService.get_user_reports(db, current_user.id)
