"""
CivicLens Phase 3 — Analysis & Anomaly Detection API Router
"""
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.analysis import (
    BudgetTrendResponse,
    BudgetComparisonResponse,
    AnomalyRecord,
    PaginatedAnomalyResponse,
    ItemAnomalyHistoryResponse,
    TrendPoint,
)
from app.services.analysis_service import (
    AnalysisService,
    VALID_VALUE_TYPES,
    DEFAULT_AMOUNT_STAGE,
    DEFAULT_VALUE_TYPE,
    DEFAULT_THRESHOLD,
)

router = APIRouter(tags=["Analysis & Anomaly Detection"])


# ──────────────────────────────────────────────────────────
# 1. GET /api/analysis/trends/{budget_item_key}
# ──────────────────────────────────────────────────────────
@router.get(
    "/api/analysis/trends/{budget_item_key}",
    response_model=BudgetTrendResponse,
    summary="Year-over-year trend for a budget item",
    description=(
        "Returns the chronological spending trend for a single budget_item_key "
        "within a specific amount_stage. Includes absolute and percentage change "
        "from the previous comparable year. Multiple records per key/year are "
        "summed to produce a single comparable value."
    ),
)
def get_item_trend(
    budget_item_key: str,
    ministry_department: Optional[str] = Query(default=None, description="Filter trend by Ministry / Department"),
    amount_stage: Optional[str] = Query(
        None,
        description="Budget stage to compare: 'Actuals', 'Budget Estimates', or 'Revised Estimates'",
    ),
    value_type: str = Query(
        DEFAULT_VALUE_TYPE,
        description="Amount column to use: 'amount', 'total_amount', 'revenue_amount', 'capital_amount'",
    ),
    db: Session = Depends(get_db),
):
    if value_type not in VALID_VALUE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid value_type '{value_type}'. Must be one of: {list(VALID_VALUE_TYPES.keys())}",
        )
    try:
        result = AnalysisService.get_trend(
            db=db,
            budget_item_key=budget_item_key,
            ministry_department=ministry_department,
            amount_stage=amount_stage,
            value_type=value_type,
        )
        if not result["trend"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No records found for budget_item_key='{budget_item_key}' with amount_stage='{amount_stage}'",
            )
        return BudgetTrendResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error computing trend: {str(e)}",
        )


# ──────────────────────────────────────────────────────────
# 2. GET /api/analysis/compare
# ──────────────────────────────────────────────────────────
@router.get(
    "/api/analysis/compare",
    response_model=BudgetComparisonResponse,
    summary="Compare a budget item between two financial years",
    description=(
        "Compares the aggregated amount for a budget_item_key between two "
        "specified financial years within the same amount_stage. Returns "
        "absolute change, percentage change, and direction."
    ),
)
def compare_budget_years(
    budget_item_key: str = Query(..., description="The budget item key to compare"),
    year1: str = Query(..., description="First financial year (e.g., '2022-2023')"),
    year2: str = Query(..., description="Second financial year (e.g., '2023-2024')"),
    amount_stage: Optional[str] = Query(
        None,
        description="Budget stage to compare",
    ),
    value_type: str = Query(
        DEFAULT_VALUE_TYPE,
        description="Amount column to use",
    ),
    db: Session = Depends(get_db),
):
    if value_type not in VALID_VALUE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid value_type '{value_type}'. Must be one of: {list(VALID_VALUE_TYPES.keys())}",
        )
    try:
        result = AnalysisService.compare_years(
            db, budget_item_key, year1, year2, amount_stage, value_type
        )
        if result["year1_amount"] is None and result["year2_amount"] is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"No data found for budget_item_key='{budget_item_key}' "
                    f"in either year '{year1}' or '{year2}' with amount_stage='{amount_stage}'"
                ),
            )
        return BudgetComparisonResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error comparing years: {str(e)}",
        )


# ──────────────────────────────────────────────────────────
# 3. GET /api/anomalies
# ──────────────────────────────────────────────────────────
@router.get(
    "/api/anomalies",
    response_model=PaginatedAnomalyResponse,
    summary="Detect significant budget changes across all items",
    description=(
        "Scans all budget items for year-over-year changes exceeding the "
        "threshold percentage. Only same-stage comparisons are performed. "
        "Results are sorted by absolute percentage change (largest first). "
        "Default threshold is 20%."
    ),
)
def get_anomalies(
    threshold: float = Query(
        DEFAULT_THRESHOLD, ge=0, le=1000,
        description="Minimum absolute percentage change to classify as anomaly (default: 20)",
    ),
    financial_year: Optional[str] = Query(None, description="Filter anomalies by current financial year"),
    ministry_department: Optional[str] = Query(None, description="Filter by ministry/department name"),
    expenditure_category: Optional[str] = Query(None, description="Filter by expenditure category"),
    amount_stage: str = Query(DEFAULT_AMOUNT_STAGE, description="Budget stage to analyze"),
    value_type: str = Query(DEFAULT_VALUE_TYPE, description="Amount column to use"),
    anomaly_type: Optional[str] = Query(
        None, description="Filter by anomaly type: 'spending_spike' or 'spending_drop'"
    ),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=500, description="Items per page"),
    db: Session = Depends(get_db),
):
    if value_type not in VALID_VALUE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid value_type '{value_type}'. Must be one of: {list(VALID_VALUE_TYPES.keys())}",
        )
    if anomaly_type and anomaly_type not in ("spending_spike", "spending_drop"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="anomaly_type must be 'spending_spike' or 'spending_drop'",
        )
    try:
        data, total = AnalysisService.detect_anomalies(
            db=db,
            threshold=threshold,
            amount_stage=amount_stage,
            value_type=value_type,
            financial_year=financial_year,
            ministry_department=ministry_department,
            expenditure_category=expenditure_category,
            anomaly_type=anomaly_type,
            page=page,
            limit=limit,
        )
        total_pages = math.ceil(total / limit) if total > 0 else 0
        return PaginatedAnomalyResponse(
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
            threshold=threshold,
            amount_stage=amount_stage,
            value_type=value_type,
            data=[AnomalyRecord(**d) for d in data],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error detecting anomalies: {str(e)}",
        )


# ──────────────────────────────────────────────────────────
# 4. GET /api/anomalies/{budget_item_key}
# ──────────────────────────────────────────────────────────
@router.get(
    "/api/anomalies/{budget_item_key}",
    response_model=ItemAnomalyHistoryResponse,
    summary="Anomaly history and trend for a specific budget item",
    description=(
        "Returns all detected anomalies and the full year-over-year trend "
        "for a single budget_item_key. This endpoint will be used by the "
        "Agentic AI investigation phase to understand WHAT changed before "
        "investigating WHY."
    ),
)
def get_item_anomalies(
    budget_item_key: str,
    amount_stage: str = Query(DEFAULT_AMOUNT_STAGE, description="Budget stage to analyze"),
    value_type: str = Query(DEFAULT_VALUE_TYPE, description="Amount column to use"),
    threshold: float = Query(DEFAULT_THRESHOLD, ge=0, le=1000, description="Anomaly threshold"),
    db: Session = Depends(get_db),
):
    if value_type not in VALID_VALUE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid value_type '{value_type}'. Must be one of: {list(VALID_VALUE_TYPES.keys())}",
        )
    try:
        result = AnalysisService.get_item_anomalies(
            db, budget_item_key, amount_stage, value_type, threshold
        )
        if not result["trend"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No records found for budget_item_key='{budget_item_key}' with amount_stage='{amount_stage}'",
            )
        return ItemAnomalyHistoryResponse(
            budget_item_key=result["budget_item_key"],
            budget_item=result["budget_item"],
            ministry_department=result["ministry_department"],
            amount_stage=result["amount_stage"],
            value_type=result["value_type"],
            anomalies=[AnomalyRecord(**a) for a in result["anomalies"]],
            trend=[TrendPoint(**t) for t in result["trend"]],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching item anomalies: {str(e)}",
        )
