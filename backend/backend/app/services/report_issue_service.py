"""
CivicLens Budget Concern & Issue Reporting Service
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import select, distinct, func
from sqlalchemy.orm import Session

from app.models.budget import BudgetRecord
from app.models.report import BudgetIssueReport
from app.models.user import User
from app.schemas.report import IssueReportCreate, IssueReportUpdateAdmin, VALID_CATEGORIES


class ReportIssueService:

    @staticmethod
    def get_options(db: Session) -> Dict[str, Any]:
        """Fetch real database-driven distinct financial years and ministries from PostgreSQL."""
        # Distinct financial years
        years_stmt = (
            select(distinct(BudgetRecord.financial_year))
            .where(BudgetRecord.financial_year.is_not(None))
            .order_by(BudgetRecord.financial_year.asc())
        )
        years = [y for y in db.scalars(years_stmt).all() if y]

        # Distinct ministry / department names
        depts_stmt = (
            select(distinct(BudgetRecord.ministry_department))
            .where(
                BudgetRecord.ministry_department.is_not(None),
                BudgetRecord.ministry_department != "",
                BudgetRecord.ministry_department != "Grand Total"
            )
            .order_by(BudgetRecord.ministry_department.asc())
        )
        depts = [d for d in db.scalars(depts_stmt).all() if d]

        return {
            "financial_years": years,
            "ministries_departments": depts,
            "categories": VALID_CATEGORIES
        }

    @staticmethod
    def create_report(db: Session, payload: IssueReportCreate, current_user: User) -> BudgetIssueReport:
        """Create a new citizen budget concern report in PostgreSQL."""
        report = BudgetIssueReport(
            user_id=current_user.id,
            is_anonymous=payload.is_anonymous,
            issue_category=payload.issue_category,
            financial_year=payload.financial_year,
            ministry_department=payload.ministry_department,
            budget_item=payload.budget_item,
            issue_title=payload.issue_title,
            description=payload.description,
            evidence_reference=payload.evidence_reference,
            status="submitted",
            priority="normal"
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def get_user_reports(db: Session, user_id: int) -> List[Dict[str, Any]]:
        """Fetch all reports submitted by the currently logged-in user."""
        stmt = (
            select(BudgetIssueReport)
            .where(BudgetIssueReport.user_id == user_id)
            .order_by(BudgetIssueReport.created_at.desc())
        )
        reports = db.scalars(stmt).all()

        results = []
        for r in reports:
            item = ReportIssueService._serialize_report(db, r)
            results.append(item)
        return results

    @staticmethod
    def get_admin_reports(
        db: Session,
        status_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        fy_filter: Optional[str] = None,
        priority_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Admin-only: fetch all submitted budget concern reports with optional filters."""
        stmt = select(BudgetIssueReport)

        if status_filter:
            stmt = stmt.where(BudgetIssueReport.status == status_filter)
        if category_filter:
            stmt = stmt.where(BudgetIssueReport.issue_category == category_filter)
        if fy_filter:
            stmt = stmt.where(BudgetIssueReport.financial_year == fy_filter)
        if priority_filter:
            stmt = stmt.where(BudgetIssueReport.priority == priority_filter)

        stmt = stmt.order_by(BudgetIssueReport.created_at.desc())
        reports = db.scalars(stmt).all()

        results = []
        for r in reports:
            item = ReportIssueService._serialize_report(db, r)
            results.append(item)
        return results

    @staticmethod
    def get_report_detail(db: Session, report_id: int) -> Optional[Dict[str, Any]]:
        """Fetch a single issue report detail by ID."""
        stmt = select(BudgetIssueReport).where(BudgetIssueReport.id == report_id)
        report = db.scalar(stmt)
        if not report:
            return None
        return ReportIssueService._serialize_report(db, report)

    @staticmethod
    def update_report_admin(db: Session, report_id: int, payload: IssueReportUpdateAdmin, admin_user: User) -> Optional[Dict[str, Any]]:
        """Admin-only: update status, priority, and admin notes on an issue report."""
        stmt = select(BudgetIssueReport).where(BudgetIssueReport.id == report_id)
        report = db.scalar(stmt)
        if not report:
            return None

        if payload.status:
            report.status = payload.status
        if payload.priority:
            report.priority = payload.priority
        if payload.admin_notes is not None:
            report.admin_notes = payload.admin_notes

        report.reviewed_by = admin_user.id
        report.reviewed_at = datetime.utcnow()

        db.commit()
        db.refresh(report)
        return ReportIssueService._serialize_report(db, report)

    @staticmethod
    def _serialize_report(db: Session, report: BudgetIssueReport) -> Dict[str, Any]:
        """Serialize BudgetIssueReport object with reporter_name protection for anonymous reports."""
        reporter = "Anonymous Citizen"
        if not report.is_anonymous and report.user_id:
            u = db.scalar(select(User).where(User.id == report.user_id))
            if u:
                reporter = u.full_name or u.username or u.email

        return {
            "id": report.id,
            "user_id": report.user_id,
            "is_anonymous": report.is_anonymous,
            "issue_category": report.issue_category,
            "financial_year": report.financial_year,
            "ministry_department": report.ministry_department,
            "budget_item": report.budget_item,
            "issue_title": report.issue_title,
            "description": report.description,
            "evidence_reference": report.evidence_reference,
            "status": report.status,
            "priority": report.priority,
            "admin_notes": report.admin_notes,
            "reviewed_by": report.reviewed_by,
            "reviewed_at": report.reviewed_at,
            "created_at": report.created_at,
            "updated_at": report.updated_at,
            "reporter_name": reporter
        }
