import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.budget import (
    BudgetRecordResponse,
    PaginatedBudgetResponse,
    BudgetSummaryResponse,
    BudgetFiltersResponse
)
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])

@router.get("", response_model=PaginatedBudgetResponse, summary="Query budget records with filtering and pagination")
def list_budgets(
    financial_year: Optional[str] = Query(None, description="Filter by target financial year (e.g., '2024-2025')"),
    ministry: Optional[str] = Query(None, description="Filter by ministry or department name"),
    expenditure_category: Optional[str] = Query(None, description="Filter by expenditure category"),
    amount_stage: Optional[str] = Query(None, description="Filter by stage: 'Actuals', 'Budget Estimates', 'Revised Estimates'"),
    statement: Optional[str] = Query(None, description="Filter by Statement name (e.g., 'Statement 3')"),
    search: Optional[str] = Query(None, description="Search keyword across item names, categories, and keys"),
    page: int = Query(1, ge=1, description="Page number (default: 1)"),
    limit: int = Query(50, ge=1, le=500, description="Items per page (default: 50, max: 500)"),
    db: Session = Depends(get_db)
):
    try:
        records, total = BudgetService.get_budgets(
            db=db,
            financial_year=financial_year,
            ministry_department=ministry,
            expenditure_category=expenditure_category,
            amount_stage=amount_stage,
            statement=statement,
            search=search,
            page=page,
            limit=limit
        )
        total_pages = math.ceil(total / limit) if total > 0 else 0
        return PaginatedBudgetResponse(
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
            data=[BudgetRecordResponse.model_validate(r) for r in records]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query error: {str(e)}"
        )

@router.get("/summary", response_model=BudgetSummaryResponse, summary="Get summary statistics and totals")
def get_budget_summary(
    financial_year: Optional[str] = Query(None, description="Optional target financial year filter (e.g., '2024-2025')"),
    amount_stage: Optional[str] = Query(None, description="Optional amount stage filter for total calculation (e.g., 'Budget Estimates')"),
    db: Session = Depends(get_db)
):
    try:
        summary_data = BudgetService.get_summary(db=db, financial_year=financial_year, amount_stage=amount_stage)
        return BudgetSummaryResponse(**summary_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while calculating summary: {str(e)}"
        )

@router.get("/filters", response_model=BudgetFiltersResponse, summary="Get distinct filter choices for frontend dropdowns")
def get_budget_filters(db: Session = Depends(get_db)):
    try:
        filter_data = BudgetService.get_filters(db=db)
        return BudgetFiltersResponse(**filter_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while fetching filters: {str(e)}"
        )

@router.get("/{record_id}", response_model=BudgetRecordResponse, summary="Get detailed budget record by ID")
def get_budget_detail(record_id: int, db: Session = Depends(get_db)):
    try:
        record = BudgetService.get_budget_by_id(db=db, record_id=record_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Budget record with ID {record_id} not found"
            )
        return BudgetRecordResponse.model_validate(record)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while fetching record detail: {str(e)}"
        )
