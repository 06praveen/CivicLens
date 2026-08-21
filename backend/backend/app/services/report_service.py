"""
CivicLens Phase 7.4 — Report & Data Export Service
Generates real CSV datasets and PDF transparency reports from PostgreSQL/SQLite data.
Completely respects Financial Year, Ministry/Department, and Expenditure Category filters using normalized flexible matching.
"""

import io
import csv
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import Session

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

from app.models.budget import BudgetRecord
from app.services.budget_service import BudgetService
from app.services.analysis_service import AnalysisService, _safe_float


class ReportService:

    @staticmethod
    def _clean_filter_str(val: Optional[str]) -> Optional[str]:
        if not val or val == "All" or val.strip() == "":
            return None
        return val.strip()

    @staticmethod
    def _build_filter_conditions(
        financial_year: Optional[str] = "2024-2025",
        ministry: Optional[str] = None,
        expenditure_category: Optional[str] = None
    ) -> List[Any]:
        conditions = [BudgetRecord.amount_stage == "Budget Estimates"]

        fy = ReportService._clean_filter_str(financial_year)
        dept = ReportService._clean_filter_str(ministry)
        cat = ReportService._clean_filter_str(expenditure_category)

        if fy:
            conditions.append(BudgetRecord.financial_year == fy)

        if dept:
            # Strip prefixes like "12 Demand No 15 " if present for flexible matching
            clean_dept = dept.lower()
            conditions.append(
                or_(
                    func.lower(func.trim(BudgetRecord.ministry_department)) == clean_dept,
                    func.lower(BudgetRecord.ministry_department).contains(clean_dept)
                )
            )

        if cat:
            clean_cat = cat.lower()
            conditions.append(
                or_(
                    func.lower(func.trim(BudgetRecord.expenditure_category)) == clean_cat,
                    func.lower(BudgetRecord.expenditure_category).contains(clean_cat)
                )
            )

        return conditions

    @staticmethod
    def _get_filtered_budget_data(
        db: Session,
        financial_year: Optional[str] = "2024-2025",
        ministry: Optional[str] = None,
        expenditure_category: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Unified filtering function used by Preview, CSV, and PDF reports.
        Applies AND-based normalized filtering across Financial Year, Ministry/Department, and Expenditure Category.
        """
        fy = ReportService._clean_filter_str(financial_year) or "2024-2025"
        dept = ReportService._clean_filter_str(ministry)
        cat = ReportService._clean_filter_str(expenditure_category)

        item_conditions = ReportService._build_filter_conditions(fy, dept, cat)

        # 1. Calculate Outlays (Total, Capital, Revenue)
        if not dept and not cat:
            # Macro year totals from Statement 1 / ministry totals
            summary = BudgetService.get_summary(db, financial_year=fy)
            total_budget = summary.get("total_budget", 0.0)
            capital_expenditure = summary.get("capital_expenditure", 0.0)
            revenue_expenditure = summary.get("revenue_expenditure", 0.0)
        else:
            # Specific department or category filters applied
            sum_stmt = (
                select(
                    func.sum(func.coalesce(BudgetRecord.total_amount, BudgetRecord.amount, 0)).label("total_sum"),
                    func.sum(func.coalesce(BudgetRecord.capital_amount, 0)).label("capital_sum"),
                    func.sum(func.coalesce(BudgetRecord.revenue_amount, 0)).label("revenue_sum")
                )
                .where(
                    and_(
                        *item_conditions,
                        BudgetRecord.budget_item.not_like("%Grand Total%"),
                        (BudgetRecord.row_type.is_(None) | (BudgetRecord.row_type != "ministry_total"))
                    )
                )
            )
            row = db.execute(sum_stmt).first()
            total_budget = _safe_float(row.total_sum) if row and row.total_sum is not None else 0.0
            capital_expenditure = _safe_float(row.capital_sum) if row and row.capital_sum is not None else 0.0
            revenue_expenditure = _safe_float(row.revenue_sum) if row and row.revenue_sum is not None else 0.0

        # 2. Fetch Top 10 Major Allocations
        top_stmt = (
            select(BudgetRecord)
            .where(
                and_(
                    *item_conditions,
                    BudgetRecord.budget_item.not_like("%Grand Total%"),
                    BudgetRecord.budget_item.not_like("TOTAL%"),
                    (BudgetRecord.row_type.is_(None) | (BudgetRecord.row_type != "ministry_total"))
                )
            )
            .order_by(BudgetRecord.total_amount.desc().nullslast())
            .limit(10)
        )
        top_records = db.scalars(top_stmt).all()

        top_items = [
            {
                "record_id": r.record_id,
                "budget_item": r.budget_item,
                "expenditure_category": r.expenditure_category or "General",
                "amount": _safe_float(r.total_amount or r.amount),
                "statement": r.statement
            }
            for r in top_records
        ]

        # 3. Fetch Anomaly Highlights
        anom_res = AnalysisService.detect_anomalies(
            db,
            threshold=10.0,
            limit=5,
            financial_year=fy,
            ministry_department=dept,
            expenditure_category=cat
        )
        anomalies_list = anom_res[0] if isinstance(anom_res, tuple) else (anom_res.get("anomalies", []) if isinstance(anom_res, dict) else [])

        scope_desc_parts = []
        if dept:
            scope_desc_parts.append(f"Dept: {dept}")
        else:
            scope_desc_parts.append("All Union Ministries")

        if cat:
            scope_desc_parts.append(f"Category: {cat}")
        else:
            scope_desc_parts.append("All Categories")

        scope_desc = " • ".join(scope_desc_parts)

        return {
            "title": "CivicLens Public Budget Transparency Report",
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
            "financial_year": fy,
            "ministry": dept or "All Union Ministries",
            "expenditure_category": cat or "All Categories",
            "scope_description": scope_desc,
            "total_budget": total_budget,
            "capital_expenditure": capital_expenditure,
            "revenue_expenditure": revenue_expenditure,
            "top_items": top_items,
            "anomalies": anomalies_list,
            "total_records_analyzed": len(top_items)
        }

    @staticmethod
    def generate_csv_report(
        db: Session,
        financial_year: Optional[str] = None,
        ministry: Optional[str] = None,
        expenditure_category: Optional[str] = None,
        limit: int = 5000
    ) -> str:
        """Queries database and generates CSV string buffer of real budget records matching all 3 filters."""
        conditions = ReportService._build_filter_conditions(financial_year, ministry, expenditure_category)

        stmt = (
            select(BudgetRecord)
            .where(and_(*conditions))
            .order_by(BudgetRecord.total_amount.desc().nullslast())
            .limit(limit)
        )

        records = db.scalars(stmt).all()

        output = io.StringIO()
        writer = csv.writer(output)

        # CSV Headers
        writer.writerow([
            "Record ID",
            "Financial Year",
            "Ministry / Department",
            "Expenditure Category",
            "Budget Item / Scheme",
            "Amount Stage",
            "Statement",
            "Demand No",
            "Amount (Rs. Crore)",
            "Revenue Amount (Rs. Crore)",
            "Capital Amount (Rs. Crore)",
            "Total Amount (Rs. Crore)",
            "Source File",
            "Source Row"
        ])

        for r in records:
            writer.writerow([
                r.record_id,
                r.financial_year,
                r.ministry_department,
                r.expenditure_category or "General",
                r.budget_item,
                r.amount_stage or "Budget Estimates",
                r.statement or "Statement 3",
                r.demand_no or "N/A",
                _safe_float(r.amount),
                _safe_float(r.revenue_amount),
                _safe_float(r.capital_amount),
                _safe_float(r.total_amount),
                r.source_file or "N/A",
                r.source_row or 0
            ])

        return output.getvalue()

    @staticmethod
    def get_report_preview_data(
        db: Session,
        financial_year: Optional[str] = "2024-2025",
        ministry: Optional[str] = None,
        expenditure_category: Optional[str] = None
    ) -> Dict[str, Any]:
        """Gather real summary data for the PDF/JSON report preview."""
        return ReportService._get_filtered_budget_data(db, financial_year, ministry, expenditure_category)

    @staticmethod
    def generate_pdf_report(
        db: Session,
        financial_year: Optional[str] = "2024-2025",
        ministry: Optional[str] = None,
        expenditure_category: Optional[str] = None
    ) -> bytes:
        """Generates a professional ReportLab PDF report buffer containing real database metrics matching all filters."""
        preview = ReportService._get_filtered_budget_data(db, financial_year, ministry, expenditure_category)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        # Custom Styles
        title_style = ParagraphStyle(
            'GovTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#00145C'),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'GovSubTitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#475569'),
            spaceAfter=12
        )
        h2_style = ParagraphStyle(
            'GovH2',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=15,
            textColor=colors.HexColor('#00145C'),
            spaceBefore=10,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'GovBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#1E293B')
        )
        table_header_style = ParagraphStyle(
            'GovTH',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.white
        )

        story = []

        # Header
        story.append(Paragraph("CIVICLENS — PUBLIC BUDGET TRANSPARENCY REPORT", title_style))
        story.append(Paragraph(f"Official Data Summary • FY: <b>{preview['financial_year']}</b> • Scope: <b>{preview['scope_description']}</b>", subtitle_style))
        story.append(Paragraph(f"Report Generated: {preview['generated_at']}", ParagraphStyle('Time', parent=body_style, fontSize=8, textColor=colors.HexColor('#64748B'))))
        story.append(Spacer(1, 8))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#E65100'), spaceAfter=12))

        # Section 1: Macro Outlay Summary
        story.append(Paragraph("1. Filtered Outlay Overview", h2_style))
        summary_data = [
            [Paragraph("<b>Metric</b>", table_header_style), Paragraph("<b>Amount (Rs. Crore)</b>", table_header_style), Paragraph("<b>Formatted Value</b>", table_header_style)],
            [Paragraph("Total Tracked Budget Outlay", body_style), f"Rs. {preview['total_budget']:,.2f}", f"Rs. {(preview['total_budget']/100000):.2f} Lakh Cr"],
            [Paragraph("Capital Expenditure Outlay", body_style), f"Rs. {preview['capital_expenditure']:,.2f}", f"Rs. {(preview['capital_expenditure']/100000):.2f} Lakh Cr"],
            [Paragraph("Revenue Expenditure Outlay", body_style), f"Rs. {preview['revenue_expenditure']:,.2f}", f"Rs. {(preview['revenue_expenditure']/100000):.2f} Lakh Cr"],
        ]
        t1 = Table(summary_data, colWidths=[200, 170, 170])
        t1.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#00145C')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(t1)
        story.append(Spacer(1, 14))

        # Section 2: Top Major Allocations
        story.append(Paragraph("2. Top Major Allocations in Scope", h2_style))
        if preview["top_items"]:
            top_table_data = [
                [Paragraph("<b>#</b>", table_header_style), Paragraph("<b>Budget Item / Scheme</b>", table_header_style), Paragraph("<b>Category</b>", table_header_style), Paragraph("<b>Outlay (Rs. Cr)</b>", table_header_style)]
            ]

            for i, item in enumerate(preview["top_items"], 1):
                top_table_data.append([
                    str(i),
                    Paragraph(item["budget_item"][:55], body_style),
                    Paragraph(item["expenditure_category"] or "General", body_style),
                    f"Rs. {item['amount']:,.2f}"
                ])

            t2 = Table(top_table_data, colWidths=[25, 260, 145, 110])
            t2.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#00145C')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
                ('PADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(t2)
        else:
            story.append(Paragraph("<i>No budget records match the selected filters.</i>", body_style))

        story.append(Spacer(1, 14))

        # Section 3: Significant Changes & Anomalies
        if preview["anomalies"]:
            story.append(Paragraph("3. Detected Spending Anomalies & Shifts in Scope", h2_style))
            anom_table_data = [
                [Paragraph("<b>Item Name</b>", table_header_style), Paragraph("<b>Period</b>", table_header_style), Paragraph("<b>Previous</b>", table_header_style), Paragraph("<b>Current</b>", table_header_style), Paragraph("<b>Change %</b>", table_header_style)]
            ]
            for a in preview["anomalies"][:5]:
                pct_val = a.get("percentage_change")
                pct_str = f"{pct_val:+.1f}%" if pct_val is not None else "N/A"
                anom_table_data.append([
                    Paragraph(a.get("budget_item", a.get("budget_item_key"))[:35], body_style),
                    f"{a.get('previous_financial_year','N/A')} → {a.get('financial_year')}",
                    f"Rs. {a.get('previous_amount', 0):,.2f}",
                    f"Rs. {a.get('current_amount', 0):,.2f}",
                    Paragraph(f"<b>{pct_str}</b>", body_style)
                ])
            t3 = Table(anom_table_data, colWidths=[180, 100, 85, 85, 90])
            t3.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#00145C')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
                ('PADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(t3)
            story.append(Spacer(1, 14))

        # Footer Source Statement
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceBefore=10, spaceAfter=8))
        story.append(Paragraph("<b>Source & Verification Statement:</b> Figures in this report are calculated directly from official Union Budget statement records stored in the CivicLens PostgreSQL database. Generated automatically by CivicLens Platform.", ParagraphStyle('Footer', parent=body_style, fontSize=7, textColor=colors.HexColor('#64748B'))))

        doc.build(story)
        return buffer.getvalue()
