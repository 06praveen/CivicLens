"""
CivicLens Phase 6 & Hybrid Intelligent Assistant Service

Dual Conversation Mode Pipeline:
1. CIVICLENS BUDGET / DATA QUESTIONS (PostgreSQL + RAG + Grounded Synthesis)
2. NORMAL / GENERAL CONVERSATION AND CONCEPTUAL QUESTIONS (Gemini Direct)

Features:
- Automatic Intent Routing: budget_data, budget_explanation, general_conversation, general_information
- Source Indicators: verified_civiclens_data, budget_explanation, general_ai
- Conversational Context Tracking (session_id)
- Zero Budget Hallucination for financial data
"""

import re
import os
import json
import uuid
import httpx
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy import select, func, or_, and_, distinct
from sqlalchemy.orm import Session

from app.config import settings
from app.models.budget import BudgetRecord
from app.services.budget_service import BudgetService
from app.services.analysis_service import AnalysisService, _safe_float
from app.services.investigation_service import InvestigationService
from app.services.rag_service import RAGService

# In-memory session store for conversational context tracking
SESSION_STORE: Dict[str, Dict[str, Any]] = {}

# Configurable Topic Mapping Layer (Mapped to real PostgreSQL dataset entities)
TOPIC_MAPPINGS: Dict[str, Dict[str, List[str]]] = {
    "education": {
        "departments": [
            "Department of School Education and Literacy",
            "Department of Higher Education",
            "Ministry of Education"
        ],
        "keywords": ["education", "literacy", "school", "schools", "university", "universities", "higher education", "student", "students", "samagra shiksha"]
    },
    "healthcare": {
        "departments": [
            "Department of Health and Family Welfare",
            "Department of Health Research",
            "Ministry of Health and Family Welfare",
            "Ministry of Ayush"
        ],
        "keywords": ["health", "healthcare", "medical", "hospital", "hospitals", "family welfare", "ayushman", "nhm"]
    },
    "defence": {
        "departments": [
            "Ministry of Defence",
            "Defence Services (Revenue)",
            "Capital Outlay on Defence Services",
            "Defence Pensions"
        ],
        "keywords": ["defence", "army", "navy", "air force", "military"]
    },
    "agriculture": {
        "departments": [
            "Department of Agriculture and Farmers Welfare",
            "Department of Agricultural Research and Education",
            "Department of Animal Husbandry and Dairying",
            "Department of Fisheries"
        ],
        "keywords": ["agriculture", "farmer", "farmers", "crop", "crops", "pm-kisan", "fertiliser", "fertilisers", "dairying", "fisheries"]
    },
    "infrastructure": {
        "departments": [
            "Ministry of Road Transport and Highways",
            "Ministry of Railways",
            "Ministry of Ports, Shipping and Waterways",
            "Ministry of Civil Aviation",
            "Ministry of Housing and Urban Affairs"
        ],
        "keywords": ["road", "railway", "railways", "highway", "highways", "port", "ports", "shipping", "aviation", "infrastructure"]
    },
    "rural development": {
        "departments": [
            "Department of Rural Development",
            "Ministry of Panchayati Raj",
            "Department of Land Resources"
        ],
        "keywords": ["mgnregs", "rural", "panchayat", "gramin", "housing", "land resources"]
    },
    "mgnregs": {
        "departments": [
            "Department of Rural Development"
        ],
        "keywords": ["mgnregs", "mahatma gandhi national rural employment", "nrega", "rural employment"]
    }
}

BUDGET_KEYWORDS = [
    "budget", "allocation", "allocated", "spending", "expenditure", "crore", "lakh", "fy",
    "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026",
    "education", "healthcare", "health", "defence", "infrastructure", "agriculture", "mgnregs", "rural",
    "fertiliser", "fertilisers", "railway", "railways", "road", "housing", "telecom", "atomic energy",
    "ministry of", "department of", "scheme", "grant", "revenue expenditure", "capital expenditure",
    "fiscal deficit", "revenue deficit", "tax"
]

GREETING_PATTERNS = [
    r"^(hi|hello|hey|namaste|greetings|good morning|good afternoon|good evening)\b",
    r"how are you", r"who are you", r"what can you do", r"tell me a joke", r"thank you"
]

BUDGET_EXPLANATION_PATTERNS = [
    r"what is (capital expenditure|revenue expenditure|fiscal deficit|revenue deficit|inflation|gdp|taxation)",
    r"explain (capital expenditure|revenue expenditure|fiscal deficit|inflation|how tax works|how parliament works)"
]


def _format_cr(amt: Optional[float]) -> str:
    """Format float amount into Crore string."""
    if amt is None:
        return "₹ 0 Cr"
    return f"₹ {round(amt):,} Cr"


class AssistantService:

    @staticmethod
    def call_gemini(prompt: str) -> Optional[str]:
        """Calls Google Gemini API using GEMINI_API_KEY from environment."""
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return None

        model = getattr(settings, "GEMINI_MODEL", "gemini-flash-latest") or "gemini-flash-latest"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}

        try:
            resp = httpx.post(url, json=payload, timeout=12.0)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text.strip()
        except Exception:
            pass
        return None

    @staticmethod
    def route_intent(question: str, session_ctx: Dict[str, Any]) -> Tuple[str, str, str, str]:
        """
        Routing layer for hybrid assistant:
        Returns (intent_category, granular_intent, source_indicator, source_indicator_label)
        """
        ql = question.lower().strip()

        # 1. Greetings & Casual Chat
        if any(re.search(p, ql) for p in GREETING_PATTERNS):
            return "general_conversation", "general_conversation", "general_ai", "AI General Response"

        # 2. Conceptual Budget Explanations (No dataset figures requested)
        if any(re.search(p, ql) for p in BUDGET_EXPLANATION_PATTERNS):
            return "budget_explanation", "budget_explanation", "budget_explanation", "Budget Information"

        # 3. Budget Sub-intents (PostgreSQL + RAG pipeline)
        if any(w in ql for w in ["anomaly", "anomalies", "unusual", "significant", "spending change", "spending changes", "spikes"]):
            return "budget_data", "anomaly_question", "verified_civiclens_data", "✓ Verified CivicLens Data"

        if any(w in ql for w in ["why did", "why has", "reason for", "cause of", "explain spike", "explain drop", "investigate", "change"]):
            return "budget_data", "investigation_question", "verified_civiclens_data", "✓ Verified CivicLens Data"

        if any(w in ql for w in ["compare", "versus", " vs ", "between 20", "increase between", "decrease between", "increase", "decrease"]):
            return "budget_data", "budget_comparison", "verified_civiclens_data", "✓ Verified CivicLens Data"

        if any(w in ql for w in ["trend", "history", "over the years", "over recent years", "last 5 years", "timeline", "over time"]):
            return "budget_data", "trend_analysis", "verified_civiclens_data", "✓ Verified CivicLens Data"

        if any(w in ql for w in ["document", "pdf", "what does the budget say", "report says", "explanatory"]):
            return "budget_data", "document_context", "verified_civiclens_data", "✓ Verified CivicLens Data"

        if any(kw in ql for kw in BUDGET_KEYWORDS) or session_ctx.get("previous_topic"):
            return "budget_data", "budget_lookup", "verified_civiclens_data", "✓ Verified CivicLens Data"

        # 4. General Information / Knowledge
        return "general_information", "general_information", "general_ai", "AI General Response"

    @staticmethod
    def get_available_years(db: Session) -> List[str]:
        """Fetch all distinct financial years available in PostgreSQL."""
        rows = db.scalars(
            select(distinct(BudgetRecord.financial_year))
            .where(BudgetRecord.financial_year.is_not(None))
            .order_by(BudgetRecord.financial_year.asc())
        ).all()
        return list(rows) if rows else ["2018-2019", "2019-2020", "2020-2021", "2021-2022", "2022-2023", "2023-2024", "2024-2025"]

    @staticmethod
    def extract_topic(question: str) -> Optional[str]:
        """Match natural language text against topic keywords."""
        q = question.lower()
        for topic_key, mapping in TOPIC_MAPPINGS.items():
            for kw in mapping["keywords"]:
                if re.search(r'\b' + re.escape(kw) + r'\b', q):
                    return topic_key
        return None

    @staticmethod
    def extract_financial_years(question: str) -> List[str]:
        """Extract all financial year patterns mentioned in question."""
        matches = re.findall(r'\b(20\d{2})[-_](\d{2,4})\b', question)
        years = []
        for y1, y2 in matches:
            if len(y2) == 2:
                y2 = '20' + y2
            years.append(f"{y1}-{y2}")
        return years

    @staticmethod
    def get_topic_allocation(db: Session, topic_key: str, years: List[str]) -> Dict[str, Any]:
        """
        Aggregate topic allocation across financial years using canonical department totals.
        Prevents double-counting between parent ministry totals and child schemes.
        """
        mapping = TOPIC_MAPPINGS.get(topic_key)
        if not mapping:
            return {"topic": topic_key, "years": [], "included_entities": []}

        depts = mapping["departments"]
        included_depts = set()

        year_results = []
        for fy in years:
            stage = "Actuals" if fy in ["2018-2019", "2019-2020", "2022-2023"] else "Budget Estimates"

            rows = db.execute(
                select(
                    BudgetRecord.ministry_department,
                    func.sum(func.coalesce(BudgetRecord.total_amount, BudgetRecord.amount, 0)).label("amt")
                )
                .where(
                    BudgetRecord.financial_year == fy,
                    BudgetRecord.statement == "Statement 3",
                    BudgetRecord.row_type == "ministry_total",
                    BudgetRecord.ministry_department.in_(depts)
                )
                .group_by(BudgetRecord.ministry_department)
            ).all()

            total_amt = sum(_safe_float(r.amt) or 0 for r in rows)

            for r in rows:
                if r.ministry_department:
                    included_depts.add(r.ministry_department)

            year_results.append({
                "financial_year": fy,
                "amount": round(total_amt, 2),
                "amount_stage": stage
            })

        return {
            "topic": topic_key.capitalize(),
            "years": year_results,
            "included_entities": sorted(list(included_depts))
        }

    @staticmethod
    def ask_assistant(
        db: Session,
        question: str,
        target_fy: Optional[str] = None,
        top_k: int = 5,
        session_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Main Hybrid Intelligent Assistant Entry Point:
        Routes to BUDGET_DATA pipeline or NORMAL_CONVERSATION pipeline.
        """
        available_fys = AssistantService.get_available_years(db)
        latest_fy = available_fys[-1] if available_fys else "2024-2025"

        sid = session_id or f"sess_{uuid.uuid4().hex[:8]}"
        session_ctx = SESSION_STORE.get(sid, {})

        intent_category, granular_intent, source_ind, source_ind_label = AssistantService.route_intent(question, session_ctx)
        extracted_topic = AssistantService.extract_topic(question)
        extracted_years = AssistantService.extract_financial_years(question)

        # Follow-up Resolution
        if not extracted_topic and session_ctx.get("previous_topic"):
            if any(w in question.lower() for w in ["which year", "highest", "lowest", "peak", "compare", "previous year", "prior year", "more"]):
                extracted_topic = session_ctx["previous_topic"]
                intent_category = "budget_data"
                source_ind = "verified_civiclens_data"
                source_ind_label = "✓ Verified CivicLens Data"

        tools_used = ["route_intent"]

        # ====================================================
        # PIPELINE 1: NORMAL / GENERAL CONVERSATION
        # ====================================================
        if intent_category == "general_conversation":
            ql = question.lower().strip()
            if any(w in ql for w in ["hi", "hello", "hey", "namaste"]):
                ans = "Namaste! I'm the CivicLens Assistant. I can help you explore Union Budget data, compare allocations across years, explain government spending, or answer general questions. What would you like to know?"
            elif "who are you" in ql:
                ans = "I am the CivicLens Citizen Budget Assistant, an intelligent transparency assistant trained on official Indian Union Budget data and public finance records."
            elif "what can you do" in ql:
                ans = "I can query verified Union Budget allocations (FY 2018–19 to FY 2024–25), compare spending across financial years, detect significant budget changes, search official PDF documents, or answer general knowledge questions."
            else:
                prompt = (
                    "You are the CivicLens Assistant, a polite and helpful assistant for Indian citizens.\n"
                    f"Respond naturally to the citizen's greeting/chat message below.\n\n"
                    f"Citizen: {question}\nAssistant:"
                )
                ans = AssistantService.call_gemini(prompt) or "Hello! How can I assist you today with budget information or general questions?"

            return {
                "answer": ans,
                "intent": intent_category,
                "confidence": "high",
                "data": None,
                "tools_used": tools_used,
                "sources": [],
                "evidence_status": "general_explanation",
                "requires_clarification": False,
                "ai_available": True,
                "session_id": sid,
                "source_indicator": source_ind,
                "source_indicator_label": source_ind_label
            }

        # ====================================================
        # PIPELINE 2: GENERAL INFORMATION / CONCEPTUAL EXPLANATION
        # ====================================================
        if intent_category in ["general_information", "budget_explanation"]:
            prompt = (
                f"You are the CivicLens Assistant, a polite and clear assistant for public knowledge.\n"
                f"Answer the following question clearly and informatively in 2-3 paragraphs.\n"
                f"Note: This is a general explanation response. Do not invent specific database figures for CivicLens.\n\n"
                f"Question: {question}\nAnswer:"
            )
            ans = AssistantService.call_gemini(prompt) or f"Here is information regarding '{question}': This represents a key public concept."

            return {
                "answer": ans,
                "intent": intent_category,
                "confidence": "high",
                "data": None,
                "tools_used": tools_used,
                "sources": [],
                "evidence_status": "general_explanation",
                "requires_clarification": False,
                "ai_available": True,
                "session_id": sid,
                "source_indicator": source_ind,
                "source_indicator_label": source_ind_label
            }

        # ====================================================
        # PIPELINE 3: CIVICLENS BUDGET / DATA QUESTIONS
        # ====================================================
        # Handle future year check (Requirement 2)
        note = None
        if any(y > latest_fy for y in extracted_years) or "2026" in question or "2027" in question:
            note = f"CivicLens currently has processed records through FY {latest_fy}, so I can compare available financial years (FY 2018-19 to FY {latest_fy}) instead."

        # Handle Anomaly Intent
        if granular_intent == "anomaly_question":
            tools_used.append("detect_anomalies")
            anom_data, total = AnalysisService.detect_anomalies(db, threshold=20.0, limit=top_k)
            sources = []
            for a in anom_data[:3]:
                sources.append({
                    "source_type": "budget_record",
                    "source_file": a.get("source_file"),
                    "statement": "Statement 3"
                })
            top_a = anom_data[0] if anom_data else None
            ans = f"Official budget records record notable spending changes between FY {top_a['previous_financial_year']} and FY {top_a['financial_year']}, such as {top_a['ministry_department']} ({top_a['budget_item']}) changing by {_format_cr(top_a['absolute_change'])}." if top_a else "No significant spending changes detected."

            return {
                "answer": ans,
                "intent": "anomaly_question",
                "confidence": "high",
                "data": {"anomalies": anom_data},
                "tools_used": tools_used,
                "sources": sources,
                "evidence_status": "directly_supported",
                "session_id": sid,
                "source_indicator": "verified_civiclens_data",
                "source_indicator_label": "✓ Verified CivicLens Data"
            }

        # Handle Document Context Intent
        if granular_intent == "document_context":
            tools_used.append("search_budget_documents")
            rag_chunks = RAGService.search_documents(query=question, top_k=top_k)
            sources = [{
                "source_type": "government_document",
                "document_name": c["document_name"],
                "page_number": c["page_number"],
                "chunk_id": c["chunk_id"]
            } for c in rag_chunks]
            top_doc = rag_chunks[0] if rag_chunks else None
            ans = f"According to official budget document {top_doc['document_name']} (Page {top_doc['page_number']}): {top_doc['text'][:300]}" if top_doc else "Official budget documents confirm allocations across departments."

            return {
                "answer": ans,
                "intent": "document_context",
                "confidence": "high" if rag_chunks else "medium",
                "data": {"rag_chunks": rag_chunks},
                "tools_used": tools_used,
                "sources": sources,
                "evidence_status": "directly_supported" if rag_chunks else "insufficient_evidence",
                "session_id": sid,
                "source_indicator": "verified_civiclens_data",
                "source_indicator_label": "✓ Verified CivicLens Data"
            }

        if extracted_topic:
            tools_used.append("get_topic_allocation")

            target_years = extracted_years if extracted_years else ["2022-2023", "2023-2024", "2024-2025"]
            topic_data = AssistantService.get_topic_allocation(db, extracted_topic, target_years)

            SESSION_STORE[sid] = {
                "previous_topic": extracted_topic,
                "previous_data": topic_data,
                "previous_intent": "budget_data",
                "previous_granular_intent": granular_intent
            }

            context_str = f"Topic: {topic_data['topic']}\n"
            context_str += "Year-wise Allocations:\n" + "\n".join([f"- {y['financial_year']}: {_format_cr(y['amount'])}" for y in topic_data["years"]])
            context_str += f"\nIncluded Entities: {', '.join(topic_data['included_entities'])}\n"
            if note:
                context_str += f"Note: {note}\n"

            prompt = f"""You are CivicLens AI, an official budget assistant.
Answer the question accurately using ONLY the PostgreSQL numbers provided below.

EVIDENCE CONTEXT:
{context_str}

CITIZEN QUESTION: {question}

INSTRUCTION: Write a concise 2-3 sentence summary listing the allocations by financial year in ₹ Crore and mentioning the included entities.
"""

            gemini_ans = AssistantService.call_gemini(prompt)
            if not gemini_ans:
                years_summary = ", ".join([f"{y['financial_year']}: {_format_cr(y['amount'])}" for y in topic_data["years"]])
                gemini_ans = f"Official budget allocations for {topic_data['topic']} are as follows: {years_summary}. This includes {', '.join(topic_data['included_entities'])}."

            if note:
                gemini_ans += f"\n\n*Note: {note}*"

            return {
                "answer": gemini_ans,
                "intent": granular_intent,
                "confidence": "high",
                "data": topic_data,
                "tools_used": tools_used,
                "sources": [{"source_type": "budget_record", "statement": "Statement 3"}],
                "evidence_status": "directly_supported",
                "session_id": sid,
                "source_indicator": "verified_civiclens_data",
                "source_indicator_label": "✓ Verified CivicLens Data"
            }

        # Fallback Entity Search
        tools_used.append("resolve_budget_item")
        item_match, req_clarification, options = AssistantService.resolve_budget_item(db, question)

        if not item_match:
            return {
                "answer": f"I could not find a matching official budget item or sufficiently relevant records for '{question}' in the currently processed CivicLens budget data. Try asking about Education, Healthcare, Defence, Agriculture, Infrastructure, or MGNREGS.",
                "intent": granular_intent,
                "confidence": "low",
                "data": None,
                "tools_used": tools_used,
                "sources": [],
                "evidence_status": "insufficient_evidence",
                "session_id": sid,
                "source_indicator": "verified_civiclens_data",
                "source_indicator_label": "✓ Verified CivicLens Data"
            }

        key = item_match["budget_item_key"]
        trend_data = AnalysisService.get_trend(db, key)
        latest_amt = trend_data['trend'][-1]['amount'] if trend_data.get('trend') else 0

        ans = f"Official budget records for **{trend_data.get('budget_item')}** ({trend_data.get('ministry_department') or 'Union Government'}) show latest allocation of {_format_cr(latest_amt)}."

        return {
            "answer": ans,
            "intent": granular_intent,
            "confidence": "high",
            "data": trend_data,
            "tools_used": tools_used,
            "sources": [{"source_type": "budget_record", "statement": "Statement 3"}],
            "evidence_status": "directly_supported",
            "session_id": sid,
            "source_indicator": "verified_civiclens_data",
            "source_indicator_label": "✓ Verified CivicLens Data"
        }

    @staticmethod
    def resolve_budget_item(db: Session, query: str) -> Tuple[Optional[Dict[str, str]], bool, List[Dict[str, str]]]:
        """Resolves natural language text to a real budget_item_key in PostgreSQL."""
        cleaned = re.sub(r'^(how much|what is|show|tell me|the budget for|allocation for|budget of|spending on|why did|compare|did)\s+', '', query, flags=re.IGNORECASE)
        cleaned = re.sub(r'\b(was|is|are|were|allocated|allocation|to|for|in|during|between|and|compared|last|year|the|of)\b', ' ', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\b(20\d{2}[-_]\d{2,4})\b', ' ', cleaned).strip()
        cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', cleaned).strip()

        if len(cleaned) < 2:
            return None, False, []

        slug_key = re.sub(r'[^a-z0-9]+', '_', cleaned.lower()).strip('_')
        stmt_key = select(BudgetRecord.budget_item_key, BudgetRecord.budget_item, BudgetRecord.ministry_department).where(BudgetRecord.budget_item_key == slug_key).limit(1)
        row_key = db.execute(stmt_key).first()
        if row_key:
            return {
                "budget_item_key": row_key.budget_item_key,
                "budget_item": row_key.budget_item,
                "ministry_department": row_key.ministry_department
            }, False, []

        search_pattern = f"%{cleaned}%"
        stmt_search = (
            select(
                BudgetRecord.budget_item_key.label("key"),
                func.min(BudgetRecord.budget_item).label("budget_item"),
                func.min(BudgetRecord.ministry_department).label("ministry_department")
            )
            .where(
                or_(
                    BudgetRecord.budget_item.ilike(search_pattern),
                    BudgetRecord.budget_item_key.ilike(search_pattern),
                    BudgetRecord.ministry_department.ilike(search_pattern)
                )
            )
            .group_by(BudgetRecord.budget_item_key)
            .limit(5)
        )
        matches = db.execute(stmt_search).all()
        if matches:
            top = matches[0]
            return {
                "budget_item_key": top.key,
                "budget_item": top.budget_item,
                "ministry_department": top.ministry_department
            }, False, []

        return None, False, []
