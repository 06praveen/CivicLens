"""
CivicLens Phase 4 — Agentic AI Investigation API Router
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.investigation import (
    InvestigationRequest,
    InvestigationResponse,
    InvestigationStep,
    InvestigationExplanation,
    InvestigationSource
)
from app.services.investigation_service import InvestigationService

router = APIRouter(prefix="/api/investigations", tags=["Agentic AI Investigation"])


@router.post(
    "",
    response_model=InvestigationResponse,
    summary="Trigger an agentic investigation for a budget item anomaly",
    description=(
        "Executes a goal-driven investigation workflow for a verified budget anomaly. "
        "The agent retrieves anomaly metrics, historical budget trends, contextual ministry "
        "records, and source references before synthesizing a grounded explanation."
    ),
)
def create_investigation(
    payload: InvestigationRequest,
    db: Session = Depends(get_db)
):
    try:
        result = InvestigationService.run_agent_investigation(
            db=db,
            budget_item_key=payload.budget_item_key,
            ministry_department=payload.ministry_department,
            financial_year=payload.financial_year,
            previous_financial_year=payload.previous_financial_year,
            amount_stage=payload.amount_stage,
            value_type=payload.value_type,
            threshold=payload.threshold
        )
        if result["anomaly"].get("status") == "not_found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Budget item key '{payload.budget_item_key}' not found."
            )
        return InvestigationResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing agent investigation: {str(e)}"
        )


@router.get(
    "/{budget_item_key}",
    response_model=InvestigationResponse,
    summary="Get investigation details and explanation for a budget item key",
    description=(
        "Runs or retrieves the investigation for a specific budget item key. "
        "Returns step-by-step agent workflow logs, grounded explanation, and official source references."
    ),
)
def get_investigation_for_key(
    budget_item_key: str,
    financial_year: Optional[str] = Query(None, description="Target financial year"),
    previous_financial_year: Optional[str] = Query(None, description="Previous financial year"),
    amount_stage: str = Query("Budget Estimates", description="Budget stage"),
    value_type: str = Query("amount", description="Amount column to evaluate"),
    threshold: float = Query(20.0, description="Anomaly threshold"),
    db: Session = Depends(get_db)
):
    try:
        result = InvestigationService.run_agent_investigation(
            db=db,
            budget_item_key=budget_item_key,
            financial_year=financial_year,
            previous_financial_year=previous_financial_year,
            amount_stage=amount_stage,
            value_type=value_type,
            threshold=threshold
        )
        if result["anomaly"].get("status") == "not_found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Budget item key '{budget_item_key}' not found."
            )
        return InvestigationResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running investigation for '{budget_item_key}': {str(e)}"
        )


@router.post(
    "/{budget_item_key}/auto",
    response_model=InvestigationResponse,
    summary="Auto-trigger investigation for a detected anomaly key",
    description=(
        "Automatically investigates an anomaly when detected by monitoring or analysis workflows."
    ),
)
def auto_investigate_key(
    budget_item_key: str,
    amount_stage: str = Query("Budget Estimates", description="Budget stage"),
    value_type: str = Query("amount", description="Amount column"),
    threshold: float = Query(20.0, description="Threshold"),
    db: Session = Depends(get_db)
):
    try:
        result = InvestigationService.run_agent_investigation(
            db=db,
            budget_item_key=budget_item_key,
            amount_stage=amount_stage,
            value_type=value_type,
            threshold=threshold
        )
        return InvestigationResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Auto investigation failed: {str(e)}"
        )
