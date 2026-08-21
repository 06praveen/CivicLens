"""
CivicLens Phase 7.4 — Reports & Downloads FastAPI Router
Exposes CSV and PDF download endpoints backed by real PostgreSQL data.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.report_service import ReportService

router = APIRouter(prefix="/api/reports", tags=["Reports & Downloads"])

@router.get("/preview", summary="Get report summary preview data")
def get_report_preview(
    financial_year: Optional[str] = Query(default="2024-2025", description="Filter by Financial Year"),
    ministry: Optional[str] = Query(default=None, description="Filter by Ministry / Department"),
    expenditure_category: Optional[str] = Query(default=None, description="Filter by Expenditure Category"),
    db: Session = Depends(get_db)
):
    """Returns aggregated report preview JSON including summary metrics, top allocations, and anomaly records."""
    return ReportService.get_report_preview_data(db, financial_year, ministry, expenditure_category)


@router.get("/csv", summary="Download filtered budget data as CSV")
def download_csv_report(
    financial_year: Optional[str] = Query(default=None, description="Filter by Financial Year"),
    ministry: Optional[str] = Query(default=None, description="Filter by Ministry / Department"),
    expenditure_category: Optional[str] = Query(default=None, description="Filter by Expenditure Category"),
    db: Session = Depends(get_db)
):
    """Generates and streams a real CSV dataset download matching the selected filters."""
    csv_content = ReportService.generate_csv_report(
        db,
        financial_year=financial_year,
        ministry=ministry,
        expenditure_category=expenditure_category
    )

    filename_parts = ["civiclens_budget"]
    if financial_year and financial_year != "All":
        filename_parts.append(financial_year.replace(" ", "_"))
    if ministry and ministry != "All":
        filename_parts.append("dept")
    if expenditure_category and expenditure_category != "All":
        filename_parts.append("cat")

    filename = "_".join(filename_parts) + ".csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.get("/pdf", summary="Download CivicLens Budget Summary Report as PDF")
def download_pdf_report(
    financial_year: Optional[str] = Query(default="2024-2025", description="Filter by Financial Year"),
    ministry: Optional[str] = Query(default=None, description="Filter by Ministry / Department"),
    expenditure_category: Optional[str] = Query(default=None, description="Filter by Expenditure Category"),
    db: Session = Depends(get_db)
):
    """Generates and streams an institutional PDF budget transparency report using real database data."""
    pdf_bytes = ReportService.generate_pdf_report(
        db,
        financial_year=financial_year,
        ministry=ministry,
        expenditure_category=expenditure_category
    )

    fy_clean = (financial_year or "2024-2025").replace(" ", "_")
    filename = f"civiclens_budget_report_{fy_clean}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
