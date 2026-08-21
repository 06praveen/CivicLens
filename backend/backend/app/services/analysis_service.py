"""
CivicLens Phase 3, Phase 7.5 & Department AI Insights — Deterministic Budget Analysis & Anomaly Detection Service

Design decisions & Rules:
1. CANONICAL SCOPE & HIERARCHY SCOPING:
   Trends and anomalies compare ONLY comparable canonical entities within Statement 3 or valid scheme statements.
   Macro aggregate rows (row_type = 'ministry_total', row_type = 'other', 'Grand Total', 'TOTAL') are strictly excluded from scheme item anomaly scans.

2. ADJACENT YEAR COMPARISON:
   Year-over-year comparisons strictly compare adjacent financial years (e.g. 2023-2024 vs 2024-2025).

3. SAFE BASELINE & PERCENTAGE THRESHOLDS:
   - Requires previous outlay >= 10.0 Crore and current outlay >= 10.0 Crore.
   - Prevents division by zero or token baseline spikes.

4. CONFIDENCE CLASSIFICATION:
   - HIGH CONFIDENCE: Previous outlay >= 50.0 Cr, historical series >= 3 years, percentage_change <= 500%, no hierarchy conflict.
   - REQUIRES SOURCE REVIEW: percentage_change > 500% OR previous outlay < 50.0 Cr.
   - LIMITED HISTORICAL DATA: Insufficient comparable years (< 3).

5. SOURCE TRACEABILITY:
   - Populates source_file, source_record_ids, observation_years_count, and status_wording for complete auditability.
"""

import math
from typing import Optional, List, Tuple, Dict, Any
from decimal import Decimal
from sqlalchemy import select, func, distinct, case, and_, or_
from sqlalchemy.orm import Session
from app.models.budget import BudgetRecord

VALID_VALUE_TYPES = {
    "amount": BudgetRecord.amount,
    "total_amount": BudgetRecord.total_amount,
    "revenue_amount": BudgetRecord.revenue_amount,
    "capital_amount": BudgetRecord.capital_amount,
}

DEFAULT_AMOUNT_STAGE = "Budget Estimates"
DEFAULT_VALUE_TYPE = "amount"
DEFAULT_THRESHOLD = 20.0
MIN_BASELINE_FOR_PCT = 10.0  # Require previous outlay >= 10.0 Cr to compute percentage change for anomalies

# Sequential financial year map for adjacent year verification
FY_SEQUENCE = [
    "2018-2019",
    "2019-2020",
    "2020-2021",
    "2021-2022",
    "2022-2023",
    "2023-2024",
    "2024-2025"
]

def get_previous_fy(fy: str) -> Optional[str]:
    """Return the immediately preceding financial year in canonical sequence."""
    if fy in FY_SEQUENCE:
        idx = FY_SEQUENCE.index(fy)
        if idx > 0:
            return FY_SEQUENCE[idx - 1]
    return None


def _safe_float(v) -> Optional[float]:
    """Convert Decimal/numeric to float safely."""
    if v is None:
        return None
    if isinstance(v, Decimal):
        return float(v)
    return float(v)


def _compute_change(current: Optional[float], previous: Optional[float]) -> Tuple[Optional[float], Optional[float]]:
    """
    Compute absolute and percentage change between two amounts.
    Prevents token baseline division (previous < 10.0 Cr) from generating fake figures.
    """
    if current is None or previous is None:
        return None, None

    absolute = round(current - previous, 2)

    if previous < MIN_BASELINE_FOR_PCT:
        percentage = None
    else:
        percentage = round((absolute / previous) * 100, 2)

    return absolute, percentage


class AnalysisService:

    @staticmethod
    def get_value_column(value_type: str):
        return VALID_VALUE_TYPES.get(value_type, BudgetRecord.total_amount)

    @staticmethod
    def get_trend(
        db: Session,
        budget_item_key: str,
        ministry_department: Optional[str] = None,
        statement: Optional[str] = None,
        amount_stage: Optional[str] = None,
        value_type: str = DEFAULT_VALUE_TYPE,
    ) -> dict:
        """
        Retrieve year-over-year trend for a single budget_item_key.
        Strictly scopes by ministry_department and statement.
        """
        value_col = AnalysisService.get_value_column(value_type)

        conditions = [
            BudgetRecord.budget_item_key == budget_item_key,
        ]
        if amount_stage and amount_stage != "All":
            conditions.append(BudgetRecord.amount_stage == amount_stage)

        if ministry_department and ministry_department != "All":
            clean_dept = ministry_department.lower().strip()
            conditions.append(
                or_(
                    func.lower(func.trim(BudgetRecord.ministry_department)) == clean_dept,
                    func.lower(BudgetRecord.ministry_department).contains(clean_dept)
                )
            )

        if statement:
            conditions.append(BudgetRecord.statement == statement)

        stmt = (
            select(
                BudgetRecord.financial_year,
                func.sum(func.coalesce(value_col, BudgetRecord.amount, 0)).label("amount_sum"),
                func.count(BudgetRecord.record_id).label("record_count"),
                func.min(BudgetRecord.budget_item).label("budget_item"),
                func.min(BudgetRecord.ministry_department).label("ministry_department"),
                func.min(BudgetRecord.statement).label("statement"),
            )
            .where(and_(*conditions))
            .group_by(BudgetRecord.financial_year)
            .order_by(BudgetRecord.financial_year.asc())
        )

        rows = db.execute(stmt).all()

        budget_item_name = None
        ministry_name = None
        statement_name = None
        trend_points = []

        for i, row in enumerate(rows):
            amt = _safe_float(row.amount_sum)
            if budget_item_name is None and row.budget_item:
                budget_item_name = row.budget_item
            if ministry_name is None and row.ministry_department:
                ministry_name = row.ministry_department
            if statement_name is None and row.statement:
                statement_name = row.statement

            prev_fy = None
            prev_amt = None
            abs_change = None
            pct_change = None

            if i > 0:
                prev_row = rows[i - 1]
                prev_fy = prev_row.financial_year
                prev_amt = _safe_float(prev_row.amount_sum)
                abs_change, pct_change = _compute_change(amt, prev_amt)

            trend_points.append({
                "financial_year": row.financial_year,
                "amount": amt,
                "record_count": row.record_count,
                "previous_financial_year": prev_fy,
                "previous_amount": prev_amt,
                "absolute_change": abs_change,
                "percentage_change": pct_change,
            })

        return {
            "budget_item_key": budget_item_key,
            "budget_item": budget_item_name or budget_item_key,
            "ministry_department": ministry_name,
            "statement": statement_name,
            "amount_stage": amount_stage or "All",
            "value_type": value_type,
            "trend": trend_points,
        }

    @staticmethod
    def compare_years(
        db: Session,
        budget_item_key: str,
        year1: str,
        year2: str,
        ministry_department: Optional[str] = None,
        amount_stage: str = DEFAULT_AMOUNT_STAGE,
        value_type: str = DEFAULT_VALUE_TYPE,
    ) -> dict:
        """
        Compare a budget item between two specific financial years.
        """
        trend_data = AnalysisService.get_trend(
            db, budget_item_key, ministry_department=ministry_department, amount_stage=amount_stage, value_type=value_type
        )
        trend = trend_data.get("trend", [])

        pt1 = next((p for p in trend if p["financial_year"] == year1), None)
        pt2 = next((p for p in trend if p["financial_year"] == year2), None)

        if pt1 is None or pt2 is None:
            full_trend_data = AnalysisService.get_trend(
                db, budget_item_key, ministry_department=ministry_department, amount_stage=None, value_type=value_type
            )
            full_trend = full_trend_data.get("trend", [])
            if pt1 is None:
                pt1 = next((p for p in full_trend if p["financial_year"] == year1), None)
            if pt2 is None:
                pt2 = next((p for p in full_trend if p["financial_year"] == year2), None)

        amt1 = pt1["amount"] if pt1 else None
        amt2 = pt2["amount"] if pt2 else None

        abs_change, pct_change = _compute_change(amt2, amt1)

        direction = "no_change"
        if abs_change is not None:
            if abs_change > 0:
                direction = "increase"
            elif abs_change < 0:
                direction = "decrease"

        return {
            "budget_item_key": budget_item_key,
            "budget_item": trend_data.get("budget_item"),
            "ministry_department": trend_data.get("ministry_department"),
            "amount_stage": amount_stage,
            "value_type": value_type,
            "year1": year1,
            "year1_amount": amt1,
            "year2": year2,
            "year2_amount": amt2,
            "absolute_change": abs_change,
            "percentage_change": pct_change,
            "direction": direction,
        }

    @staticmethod
    def detect_anomalies(
        db: Session,
        threshold: float = DEFAULT_THRESHOLD,
        amount_stage: str = DEFAULT_AMOUNT_STAGE,
        value_type: str = DEFAULT_VALUE_TYPE,
        financial_year: Optional[str] = None,
        ministry_department: Optional[str] = None,
        expenditure_category: Optional[str] = None,
        anomaly_type: Optional[str] = None,
        page: int = 1,
        limit: int = 5,
    ) -> Tuple[List[dict], int]:
        """
        Detect year-over-year spending anomalies exceeding threshold.
        Applies multi-level confidence classification: HIGH CONFIDENCE, REQUIRES SOURCE REVIEW, LIMITED HISTORICAL DATA.
        """
        value_col = AnalysisService.get_value_column(value_type)

        valid_dept_names = set(
            db.scalars(
                select(distinct(BudgetRecord.ministry_department))
                .where(
                    BudgetRecord.ministry_department.is_not(None),
                    BudgetRecord.ministry_department != "",
                    BudgetRecord.row_type == "ministry_total",
                    BudgetRecord.statement == "Statement 3"
                )
            ).all()
        )

        base_filters = [
            BudgetRecord.amount_stage == amount_stage,
            BudgetRecord.statement == "Statement 3",
            BudgetRecord.ministry_department.in_(valid_dept_names),
            (BudgetRecord.row_type.is_(None) | (BudgetRecord.row_type == "category")),
            ~BudgetRecord.budget_item.ilike("Grand Total%"),
            ~BudgetRecord.budget_item.ilike("TOTAL%"),
            ~BudgetRecord.budget_item.ilike("Demand No%"),
        ]

        if financial_year and financial_year != "All":
            base_filters.append(BudgetRecord.financial_year == financial_year)

        if ministry_department and ministry_department != "All":
            clean_dept = ministry_department.lower().strip()
            base_filters.append(
                or_(
                    func.lower(func.trim(BudgetRecord.ministry_department)) == clean_dept,
                    func.lower(BudgetRecord.ministry_department).contains(clean_dept)
                )
            )

        if expenditure_category and expenditure_category != "All":
            clean_cat = expenditure_category.lower().strip()
            base_filters.append(
                or_(
                    func.lower(func.trim(BudgetRecord.expenditure_category)) == clean_cat,
                    func.lower(BudgetRecord.expenditure_category).contains(clean_cat)
                )
            )

        agg = (
            select(
                BudgetRecord.budget_item_key,
                BudgetRecord.ministry_department,
                BudgetRecord.statement,
                BudgetRecord.financial_year,
                func.sum(func.coalesce(value_col, BudgetRecord.amount, 0)).label("amount_sum"),
                func.min(BudgetRecord.budget_item).label("budget_item"),
                func.min(BudgetRecord.expenditure_category).label("expenditure_category"),
                func.min(BudgetRecord.source_file).label("source_file"),
                func.min(BudgetRecord.record_id).label("record_id"),
            )
            .where(and_(*base_filters))
            .group_by(
                BudgetRecord.budget_item_key,
                BudgetRecord.ministry_department,
                BudgetRecord.statement,
                BudgetRecord.financial_year
            )
            .subquery()
        )

        curr = agg.alias("curr")
        prev = agg.alias("prev")

        join_cond = and_(
            curr.c.budget_item_key == prev.c.budget_item_key,
            curr.c.ministry_department == prev.c.ministry_department,
            curr.c.statement == prev.c.statement,
            curr.c.financial_year != prev.c.financial_year
        )

        query = (
            select(
                curr.c.budget_item_key,
                curr.c.budget_item,
                curr.c.ministry_department,
                curr.c.expenditure_category,
                curr.c.statement,
                curr.c.source_file,
                curr.c.record_id.label("curr_id"),
                prev.c.record_id.label("prev_id"),
                curr.c.financial_year.label("financial_year"),
                prev.c.financial_year.label("previous_financial_year"),
                curr.c.amount_sum.label("current_amount"),
                prev.c.amount_sum.label("previous_amount"),
            )
            .select_from(curr.join(prev, join_cond))
            .where(
                and_(
                    prev.c.amount_sum >= MIN_BASELINE_FOR_PCT,
                    curr.c.amount_sum >= MIN_BASELINE_FOR_PCT,
                    curr.c.financial_year > prev.c.financial_year
                )
            )
        )

        all_rows = db.execute(query).all()

        # Build observation counts map per (budget_item_key)
        obs_counts = dict(
            db.execute(
                select(BudgetRecord.budget_item_key, func.count(distinct(BudgetRecord.financial_year)))
                .where(BudgetRecord.budget_item_key.is_not(None))
                .group_by(BudgetRecord.budget_item_key)
            ).all()
        )

        anomalies = []
        for r in all_rows:
            expected_prev = get_previous_fy(r.financial_year)
            if expected_prev and r.previous_financial_year != expected_prev:
                continue

            c_amt = _safe_float(r.current_amount)
            p_amt = _safe_float(r.previous_amount)
            abs_c, pct_c = _compute_change(c_amt, p_amt)

            if pct_c is None or abs(pct_c) < threshold:
                continue

            # Exclude item names that equal department name to prevent comparing parent ministry totals
            if r.budget_item and r.ministry_department and r.budget_item.strip().lower() == r.ministry_department.strip().lower():
                continue

            a_type = "spending_spike" if pct_c > 0 else "spending_drop"
            if anomaly_type and anomaly_type != a_type:
                continue

            obs_cnt = obs_counts.get(r.budget_item_key, 1)

            # Confidence Classification (Steps 8 & 11)
            if obs_cnt < 3:
                confidence = "LIMITED HISTORICAL DATA"
            elif abs(pct_c) > 500.0 or p_amt < 50.0:
                confidence = "REQUIRES SOURCE REVIEW"
            else:
                confidence = "HIGH CONFIDENCE"

            direction_verb = "increased" if abs_c >= 0 else "decreased"
            abs_val = abs(abs_c)
            wording = f"Allocation {direction_verb} by ₹{round(abs_val):,} Cr from ₹{round(p_amt):,} Cr in FY {r.previous_financial_year} to ₹{round(c_amt):,} Cr in FY {r.financial_year}."

            anomalies.append({
                "budget_item_key": r.budget_item_key,
                "budget_item": r.budget_item or r.budget_item_key,
                "ministry_department": r.ministry_department,
                "expenditure_category": r.expenditure_category,
                "statement": r.statement,
                "financial_year": r.financial_year,
                "previous_financial_year": r.previous_financial_year,
                "current_amount": c_amt,
                "previous_amount": p_amt,
                "absolute_change": abs_c,
                "percentage_change": pct_c,
                "anomaly_type": a_type,
                "threshold_used": threshold,
                "amount_stage": amount_stage,
                "value_type": value_type,
                "confidence_level": confidence,
                "status_wording": wording,
                "observation_years_count": obs_cnt,
                "source_file": r.source_file,
                "source_record_ids": [r.prev_id, r.curr_id]
            })

        # Rank by absolute change magnitude (Step 6 rule)
        anomalies.sort(key=lambda x: abs(x["absolute_change"]), reverse=True)

        total_count = len(anomalies)
        offset = (page - 1) * limit
        paged_anomalies = anomalies[offset:offset + limit]

        return paged_anomalies, total_count
