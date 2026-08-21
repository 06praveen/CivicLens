"""
CivicLens Phase 4 & Phase 5 — Agentic AI Investigation Service with RAG Document Integration

Implements goal-driven, evidence-based investigation workflow:
1. Tool 1: get_anomaly_details
2. Tool 2: get_budget_history
3. Tool 3: get_related_budget_records
4. Tool 4: get_source_records
5. Tool 5: assess_evidence
6. Tool 6: query_rag_document_context (Phase 5 RAG Integration)
7. AI / Grounded Explanation Synthesizer (with strict anti-hallucination prompt & graceful fallback)
"""

import os
import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import Session

from app.config import settings
from app.models.budget import BudgetRecord
from app.services.analysis_service import AnalysisService, _safe_float, _compute_change
from app.services.rag_service import RAGService


class InvestigationService:

    @staticmethod
    def get_anomaly_details(
        db: Session,
        budget_item_key: str,
        ministry_department: Optional[str] = None,
        financial_year: Optional[str] = None,
        previous_financial_year: Optional[str] = None,
        amount_stage: str = "Budget Estimates",
        value_type: str = "amount",
        threshold: float = 20.0
    ) -> Dict[str, Any]:
        """Tool 1: Retrieve and verify specific anomaly metrics."""
        trend_data = AnalysisService.get_trend(
            db, budget_item_key, ministry_department=ministry_department, amount_stage=amount_stage, value_type=value_type
        )
        trend = trend_data.get("trend", [])

        if not trend:
            return {
                "budget_item_key": budget_item_key,
                "budget_item": budget_item_key,
                "status": "not_found",
                "message": f"No data found for {budget_item_key}"
            }

        target_point = None
        if financial_year:
            for pt in trend:
                if pt["financial_year"] == financial_year:
                    target_point = pt
                    break

        if not target_point:
            valid_points = [p for p in trend if p.get("percentage_change") is not None]
            if valid_points:
                target_point = max(valid_points, key=lambda x: abs(x["percentage_change"]))
            else:
                target_point = trend[-1]

        prev_fy = previous_financial_year or target_point.get("previous_financial_year") or "N/A"
        curr_fy = target_point.get("financial_year", financial_year or "N/A")
        prev_amt = target_point.get("previous_amount")
        curr_amt = target_point.get("amount")
        abs_change = target_point.get("absolute_change")
        pct_change = target_point.get("percentage_change")

        a_type = "normal_change"
        if pct_change is not None:
            if pct_change >= threshold:
                a_type = "spending_spike"
            elif pct_change <= -threshold:
                a_type = "spending_drop"

        return {
            "budget_item_key": budget_item_key,
            "budget_item": trend_data.get("budget_item") or budget_item_key,
            "ministry_department": trend_data.get("ministry_department"),
            "financial_year": curr_fy,
            "previous_financial_year": prev_fy,
            "previous_amount": prev_amt,
            "current_amount": curr_amt,
            "absolute_change": abs_change,
            "percentage_change": pct_change,
            "anomaly_type": a_type,
            "threshold_used": threshold,
            "amount_stage": amount_stage,
            "value_type": value_type,
            "unit": trend_data.get("unit", "₹ Crore")
        }

    @staticmethod
    def get_budget_history(
        db: Session,
        budget_item_key: str,
        ministry_department: Optional[str] = None,
        amount_stage: str = "Budget Estimates",
        value_type: str = "amount"
    ) -> List[Dict[str, Any]]:
        """Tool 2: Retrieve chronological budget history across all available financial years."""
        trend_data = AnalysisService.get_trend(
            db, budget_item_key, ministry_department=ministry_department, amount_stage=amount_stage, value_type=value_type
        )
        return trend_data.get("trend", [])

    @staticmethod
    def get_related_budget_records(
        db: Session,
        budget_item_key: str,
        ministry_department: Optional[str],
        financial_year: str,
        amount_stage: str = "Budget Estimates",
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Tool 3: Retrieve contextual/nearby records from the same ministry or category."""
        if not ministry_department:
            return []

        stmt = (
            select(BudgetRecord)
            .where(
                and_(
                    BudgetRecord.ministry_department == ministry_department,
                    BudgetRecord.financial_year == financial_year,
                    BudgetRecord.amount_stage == amount_stage,
                    BudgetRecord.budget_item_key != budget_item_key
                )
            )
            .order_by(BudgetRecord.amount.desc().nullslast())
            .limit(limit)
        )
        records = db.scalars(stmt).all()
        return [
            {
                "record_id": r.record_id,
                "budget_item": r.budget_item,
                "budget_item_key": r.budget_item_key,
                "expenditure_category": r.expenditure_category,
                "amount": _safe_float(r.amount),
                "statement": r.statement
            }
            for r in records
        ]

    @staticmethod
    def get_source_records(
        db: Session,
        budget_item_key: str,
        financial_year: str,
        amount_stage: str = "Budget Estimates"
    ) -> List[Dict[str, Any]]:
        """Tool 4: Retrieve official dataset source references (file, row, statement)."""
        stmt = (
            select(BudgetRecord)
            .where(
                and_(
                    BudgetRecord.budget_item_key == budget_item_key,
                    BudgetRecord.financial_year == financial_year,
                    BudgetRecord.amount_stage == amount_stage
                )
            )
            .limit(10)
        )
        records = db.scalars(stmt).all()
        return [
            {
                "record_id": r.record_id,
                "source_file": r.source_file,
                "source_row": r.source_row,
                "statement": r.statement,
                "demand_no": r.demand_no,
                "ministry_department": r.ministry_department,
                "budget_item": r.budget_item
            }
            for r in records
        ]

    @staticmethod
    def query_rag_document_context(
        query: str,
        financial_year: Optional[str] = None,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """Tool 6 (Phase 5): Retrieve contextual excerpts from official PDF documents using RAG."""
        try:
            return RAGService.search_documents(
                query=query,
                top_k=top_k,
                financial_year=financial_year
            )
        except Exception:
            return []

    @staticmethod
    def assess_evidence(
        anomaly: Dict[str, Any],
        history: List[Dict[str, Any]],
        related: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
        rag_chunks: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Tool 5: Assess evidence sufficiency to classify findings into:
        - 'directly_supported': Verified directly against budget statements and/or official document excerpts.
        - 'pattern_observed': Multi-year numerical trend pattern is present across 3+ financial years.
        - 'insufficient_evidence': Cannot confirm cause from available numerical line items alone.
        """
        num_years = len(history)
        has_sources = len(sources) > 0
        has_rag = bool(rag_chunks and len(rag_chunks) > 0)

        pct = anomaly.get("percentage_change")
        abs_val = anomaly.get("absolute_change")

        if has_rag and rag_chunks[0].get("similarity_score", 0) > 0.3:
            status = "directly_supported"
            reason = f"Verified directly against official budget document excerpts ({rag_chunks[0]['document_name']}, Page {rag_chunks[0]['page_number']})."
            confidence = "high"
        elif num_years >= 3 and pct is not None:
            status = "pattern_observed"
            reason = f"Historical spending pattern observed across {num_years} financial years."
            confidence = "medium"
        elif has_sources and (abs(pct or 0) > 50 or (abs_val or 0) > 1000):
            status = "directly_supported"
            reason = "Significant change verified directly against official budget statements."
            confidence = "high"
        else:
            status = "insufficient_evidence"
            reason = "Available line items verify the numerical change, but do not contain narrative cause."
            confidence = "low"

        return {
            "evidence_status": status,
            "reason": reason,
            "confidence": confidence,
            "years_observed": num_years,
            "related_records_count": len(related),
            "sources_count": len(sources),
            "rag_chunks_count": len(rag_chunks) if rag_chunks else 0
        }

    @staticmethod
    def run_agent_investigation(
        db: Session,
        budget_item_key: str,
        ministry_department: Optional[str] = None,
        financial_year: Optional[str] = None,
        previous_financial_year: Optional[str] = None,
        amount_stage: str = "Budget Estimates",
        value_type: str = "amount",
        threshold: float = 20.0
    ) -> Dict[str, Any]:
        """
        Main Goal-Driven Agentic Workflow:
        Executes discrete decision steps, uses tools, checks evidence sufficiency,
        optionally queries RAG documents if needed, and synthesizes a grounded explanation.
        """
        investigation_id = f"inv_{uuid.uuid4().hex[:8]}"
        steps = []

        # Step 1: Fetch Anomaly Details
        anomaly = InvestigationService.get_anomaly_details(
            db, budget_item_key, ministry_department, financial_year, previous_financial_year, amount_stage, value_type, threshold
        )
        steps.append({
            "step": 1,
            "action": "Retrieved anomaly details and verified numerical metrics",
            "result": f"Verified change of {anomaly.get('percentage_change')}% ({anomaly.get('anomaly_type')})",
            "details": anomaly
        })

        # Step 2: Fetch Budget History
        curr_fy = anomaly.get("financial_year")
        history = InvestigationService.get_budget_history(db, budget_item_key, ministry_department, amount_stage, value_type)
        steps.append({
            "step": 2,
            "action": "Retrieved chronological budget history",
            "result": f"Fetched {len(history)} financial year trend points",
            "details": {"history_length": len(history)}
        })

        # Step 3: Fetch Related Contextual Records
        ministry = anomaly.get("ministry_department")
        related = InvestigationService.get_related_budget_records(
            db, budget_item_key, ministry, curr_fy, amount_stage
        )
        steps.append({
            "step": 3,
            "action": "Retrieved related ministry context records",
            "result": f"Retrieved {len(related)} contextual line items from {ministry or 'general budget'}",
            "details": {"related_count": len(related)}
        })

        # Step 4: Fetch Official Source Metadata
        sources = InvestigationService.get_source_records(db, budget_item_key, curr_fy, amount_stage)
        steps.append({
            "step": 4,
            "action": "Collected official dataset source references",
            "result": f"Preserved {len(sources)} source record references",
            "details": {"source_count": len(sources)}
        })

        # Step 5: Initial Evidence Sufficiency Assessment
        initial_assessment = InvestigationService.assess_evidence(anomaly, history, related, sources)
        
        # Step 6 (Phase 5 RAG Decision): Query RAG if context needed or beneficial
        rag_chunks = []
        item_name = anomaly.get("budget_item") or budget_item_key
        
        if initial_assessment["evidence_status"] in ["insufficient_evidence", "pattern_observed"] or len(history) < 3:
            rag_chunks = InvestigationService.query_rag_document_context(
                query=item_name, financial_year=curr_fy, top_k=3
            )
            steps.append({
                "step": 5,
                "action": "Queried official budget PDF documents via RAG for textual context",
                "result": f"Retrieved {len(rag_chunks)} relevant document page excerpts",
                "details": {
                    "rag_chunks_count": len(rag_chunks),
                    "retrieved_sources": [f"{c['document_name']}, Page {c['page_number']}" for c in rag_chunks]
                }
            })

        # Re-evaluate final evidence status with RAG chunks
        assessment = InvestigationService.assess_evidence(anomaly, history, related, sources, rag_chunks)
        steps.append({
            "step": 6,
            "action": "Evaluated final evidence sufficiency",
            "result": f"Evidence Status: {assessment['evidence_status']} (Confidence: {assessment['confidence']})",
            "details": assessment
        })

        # Step 7: Synthesize Grounded Explanation
        explanation = InvestigationService.synthesize_explanation(
            anomaly, history, related, sources, assessment, rag_chunks
        )

        return {
            "investigation_id": investigation_id,
            "status": "completed" if explanation.get("ai_generated") else "ai_explanation_unavailable",
            "anomaly": anomaly,
            "investigation_steps": steps,
            "explanation": explanation,
            "sources": sources,
            "document_evidence": rag_chunks
        }

    @staticmethod
    def synthesize_explanation(
        anomaly: Dict[str, Any],
        history: List[Dict[str, Any]],
        related: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
        assessment: Dict[str, Any],
        rag_chunks: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes a plain-language explanation using AI if API key is present,
        or falls back to a deterministic, source-grounded report.
        """
        item_name = anomaly.get("budget_item", "Budget Item")
        curr_fy = anomaly.get("financial_year", "N/A")
        prev_fy = anomaly.get("previous_financial_year", "N/A")
        curr_amt = anomaly.get("current_amount")
        prev_amt = anomaly.get("previous_amount")
        abs_change = anomaly.get("absolute_change")
        pct_change = anomaly.get("percentage_change")
        a_type = anomaly.get("anomaly_type", "change")
        status_eval = assessment.get("evidence_status", "insufficient_evidence")
        conf = assessment.get("confidence", "medium")

        api_key = settings.GEMINI_API_KEY or settings.OPENAI_API_KEY or settings.LLM_API_KEY or os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")

        if api_key:
            ai_res = InvestigationService._call_llm_for_synthesis(
                api_key, anomaly, history, related, sources, assessment, rag_chunks
            )
            if ai_res:
                return ai_res

        # Deterministic Grounded Fallback (when AI key is omitted or unavailable)
        abs_str = f"{abs_change:+.2f}" if abs_change is not None else "N/A"
        pct_str = f"{pct_change:.2f}%" if pct_change is not None else "N/A"
        key_findings = [
            f"Official budget allocation for '{item_name}' changed from {prev_amt} ₹ Crore in {prev_fy} to {curr_amt} ₹ Crore in {curr_fy}.",
            f"Absolute change: {abs_str} ₹ Crore ({pct_str} {a_type.replace('_', ' ')}).",
            f"Multi-year tracking covers {len(history)} financial years."
        ]

        if rag_chunks:
            top_c = rag_chunks[0]
            key_findings.append(
                f"Retrieved official document excerpt from {top_c['document_name']} (Page {top_c['page_number']})."
            )

        if status_eval == "insufficient_evidence":
            summary = (
                f"The budget allocation for '{item_name}' experienced a {pct_change}% {a_type.replace('_', ' ')} "
                f"between {prev_fy} and {curr_fy}. While the numerical change is verified in official budget records, "
                f"the available line items do not explicitly state the underlying cause for the change."
            )
        elif status_eval == "pattern_observed":
            summary = (
                f"Analysis of official budget data reveals a significant {pct_change}% {a_type.replace('_', ' ')} "
                f"for '{item_name}' from {prev_amt} ₹ Crore in {prev_fy} to {curr_amt} ₹ Crore in {curr_fy}. "
                f"This reflects an observed multi-year spending trend across {len(history)} financial years."
            )
        else:
            doc_info = f" (Ref: {rag_chunks[0]['document_name']}, Page {rag_chunks[0]['page_number']})" if rag_chunks else ""
            summary = (
                f"Official budget records confirm a {pct_change}% {a_type.replace('_', ' ')} for '{item_name}', "
                f"moving from {prev_amt} ₹ Crore ({prev_fy}) to {curr_amt} ₹ Crore ({curr_fy}){doc_info}."
            )

        return {
            "summary": summary,
            "confidence": conf,
            "evidence_status": status_eval,
            "key_findings": key_findings,
            "ai_generated": False
        }

    @staticmethod
    def _call_llm_for_synthesis(
        api_key: str,
        anomaly: Dict[str, Any],
        history: List[Dict[str, Any]],
        related: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
        assessment: Dict[str, Any],
        rag_chunks: Optional[List[Dict[str, Any]]] = None
    ) -> Optional[Dict[str, Any]]:
        """Invokes Gemini / OpenAI via httpx if API key is provided."""
        try:
            import httpx

            rag_text = ""
            if rag_chunks:
                rag_text = "\nOFFICIAL DOCUMENT EXCERPTS (RAG):\n" + "\n".join(
                    [f"- [{c['document_name']} Page {c['page_number']}]: {c['text'][:300]}" for c in rag_chunks]
                )

            prompt = f"""You are an investigation assistant for CivicLens, a government budget transparency platform.

STRICT INSTRUCTIONS:
- Explain ONLY the numerical change and any evidence retrieved from official CivicLens source records.
- Do NOT invent causes, government decisions, or events not present in the data.
- If no official cause document is available in the retrieved records, you MUST explicitly state:
  "The available CivicLens records show the change, but do not provide enough evidence to determine the reason."

EVIDENCE DATA:
Item: {anomaly.get('budget_item')}
Period: {anomaly.get('previous_financial_year')} -> {anomaly.get('financial_year')}
Previous Amount: {anomaly.get('previous_amount')} ₹ Crore
Current Amount: {anomaly.get('current_amount')} ₹ Crore
Percentage Change: {anomaly.get('percentage_change')}% ({anomaly.get('anomaly_type')})
Evidence Status: {assessment.get('evidence_status')}
Historical Points: {len(history)} years observed.
{rag_text}

Generate a JSON object with:
"summary": "1-2 sentence plain-language summary with exact citations if document excerpts exist",
"confidence": "high" or "medium" or "low",
"evidence_status": "{assessment.get('evidence_status')}",
"key_findings": ["finding 1", "finding 2"]
"""
            if api_key.startswith("AIza"):
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                resp = httpx.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=10.0)
                if resp.status_code == 200:
                    text_out = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                    return {
                        "summary": text_out.strip(),
                        "confidence": assessment.get("confidence", "medium"),
                        "evidence_status": assessment.get("evidence_status", "insufficient_evidence"),
                        "key_findings": [
                            f"Numerical change: {anomaly.get('percentage_change')}% ({anomaly.get('anomaly_type')})",
                            f"Verified against official {anomaly.get('amount_stage')} records."
                        ],
                        "ai_generated": True
                    }
        except Exception:
            pass
        return None
