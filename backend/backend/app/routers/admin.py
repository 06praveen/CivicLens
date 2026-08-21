"""
CivicLens Backend Admin API Router — Role-Based Access Control Protected
Requires role == 'admin' for all operations. Returns 403 Forbidden for non-admin users.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db, get_auth_db
from app.routers.auth import require_admin
from app.models.user import User
from app.models.budget import BudgetRecord

router = APIRouter(prefix="/api/admin", tags=["Admin Portal Security"])


@router.get("/dashboard", summary="Get administrative dashboard metrics (Admin Only)")
def get_admin_dashboard(
    admin_user: User = Depends(require_admin),
    auth_db: Session = Depends(get_auth_db),
    budget_db: Session = Depends(get_db)
):
    """
    Returns platform telemetry and admin metrics.
    Enforces backend role verification (requires_admin dependency).
    Returns 403 Forbidden if called by normal users or unauthenticated clients.
    """
    total_users = auth_db.query(User).count()
    admin_count = auth_db.query(User).filter(User.role == "admin").count()
    active_users = auth_db.query(User).filter(User.is_active == True).count()
    total_records = budget_db.query(BudgetRecord).count()

    return {
        "status": "success",
        "admin": {
            "id": admin_user.id,
            "full_name": admin_user.full_name,
            "email": admin_user.email,
            "role": admin_user.role
        },
        "metrics": {
            "total_users": total_users,
            "active_users": active_users,
            "admin_count": admin_count,
            "total_budget_records": total_records
        }
    }


@router.post("/upload-data", summary="Upload/Manage budget CSV datasets (Admin Only)")
def upload_budget_data(
    payload: dict,
    admin_user: User = Depends(require_admin)
):
    """Admin-only dataset management endpoint."""
    return {
        "status": "success",
        "message": f"Dataset action authorized by admin '{admin_user.email}'.",
        "payload": payload
    }


# ====================================================
# ADMIN BUDGET ISSUE REPORT MANAGEMENT ENDPOINTS
# ====================================================

from typing import List, Optional
from app.schemas.report import IssueReportResponse, IssueReportUpdateAdmin
from app.services.report_issue_service import ReportIssueService


@router.get(
    "/reports",
    response_model=List[IssueReportResponse],
    summary="List all citizen budget issue reports (Admin Only)",
    description="Admin-only endpoint to review submitted citizen concern reports with optional filters."
)
def list_admin_issue_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_filter: Optional[str] = Query(None, alias="category"),
    fy_filter: Optional[str] = Query(None, alias="financial_year"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return ReportIssueService.get_admin_reports(
        db=db,
        status_filter=status_filter,
        category_filter=category_filter,
        fy_filter=fy_filter,
        priority_filter=priority_filter
    )


@router.get(
    "/reports/{report_id}",
    response_model=IssueReportResponse,
    summary="Get single issue report details (Admin Only)"
)
def get_admin_issue_report_detail(
    report_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    report = ReportIssueService.get_report_detail(db, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget issue report #{report_id} not found"
        )
    return report


@router.patch(
    "/reports/{report_id}",
    response_model=IssueReportResponse,
    summary="Update issue report status, priority, or admin notes (Admin Only)"
)
def update_admin_issue_report(
    report_id: int,
    payload: IssueReportUpdateAdmin,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    updated = ReportIssueService.update_report_admin(db, report_id, payload, admin_user)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget issue report #{report_id} not found"
        )
    return updated
