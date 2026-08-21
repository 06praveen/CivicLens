"""
CivicLens Backend Integration and Verification Test Suite
Tests Phases 1 through 6 against real PostgreSQL database and data structures.
"""

import os
import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.services.analysis_service import _compute_change
from app.services.rag_service import RAGService

class TestCivicLensBackend(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    # ---------------------------------------------------------
    # STEP 2: ENVIRONMENT AND STARTUP TESTS
    # ---------------------------------------------------------
    def test_root_endpoint(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("service", data)
        self.assertIn("docs", data)

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertTrue(data["database"]["connected"])

    def test_assistant_health_check(self):
        response = self.client.get("/api/assistant/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("dependencies", data)
        self.assertTrue(data["dependencies"]["database"]["connected"])

    def test_swagger_docs(self):
        response = self.client.get("/docs")
        self.assertEqual(response.status_code, 200)

    # ---------------------------------------------------------
    # STEP 4: PHASE 2 DATABASE & CORE API TESTS
    # ---------------------------------------------------------
    def test_list_budgets_default(self):
        response = self.client.get("/api/budgets?limit=10")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["total"], 0)
        self.assertEqual(len(data["data"]), 10)
        first = data["data"][0]
        self.assertIn("record_id", first)
        self.assertIn("budget_item_key", first)
        self.assertIn("source_file", first)
        self.assertIn("source_row", first)

    def test_list_budgets_filter_year(self):
        response = self.client.get("/api/budgets?financial_year=2024-2025&limit=5")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        for item in data["data"]:
            self.assertEqual(item["financial_year"], "2024-2025")

    def test_list_budgets_search(self):
        response = self.client.get("/api/budgets?search=atomic&limit=5")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["total"], 0)

    def test_budget_summary(self):
        response = self.client.get("/api/budgets/summary")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["total_records"], 0)
        self.assertIn("2024-2025", data["available_financial_years"])

    def test_budget_filters(self):
        response = self.client.get("/api/budgets/filters")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("financial_years", data)
        self.assertIn("amount_stages", data)

    def test_budget_detail_found_and_not_found(self):
        # Retrieve record #1
        resp_found = self.client.get("/api/budgets/1")
        self.assertEqual(resp_found.status_code, 200)
        self.assertEqual(resp_found.json()["record_id"], 1)

        # Retrieve invalid record
        resp_not_found = self.client.get("/api/budgets/999999999")
        self.assertEqual(resp_not_found.status_code, 404)

    # ---------------------------------------------------------
    # STEP 5: PHASE 3 ANALYSIS & ANOMALY TESTS
    # ---------------------------------------------------------
    def test_compute_change_math(self):
        # 1. Normal increase
        abs_c, pct_c = _compute_change(120.0, 100.0)
        self.assertEqual(abs_c, 20.0)
        self.assertEqual(pct_c, 20.0)

        # 2. Normal decrease
        abs_c, pct_c = _compute_change(80.0, 100.0)
        self.assertEqual(abs_c, -20.0)
        self.assertEqual(pct_c, -20.0)

        # 3. Zero previous amount
        abs_c, pct_c = _compute_change(50.0, 0.0)
        self.assertEqual(abs_c, 50.0)
        self.assertIsNone(pct_c)

        # 4. None input
        abs_c, pct_c = _compute_change(None, 100.0)
        self.assertIsNone(abs_c)
        self.assertIsNone(pct_c)

    def test_detect_anomalies(self):
        response = self.client.get("/api/anomalies?threshold=20&limit=10")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["total"], 0)
        first = data["data"][0]
        self.assertIn("percentage_change", first)
        self.assertIn("anomaly_type", first)
        self.assertGreaterEqual(abs(first["percentage_change"]), 20.0)

    def test_item_trend_and_compare(self):
        # First get an anomaly item key
        anom_resp = self.client.get("/api/anomalies?limit=1")
        item_key = anom_resp.json()["data"][0]["budget_item_key"]

        # Test trend endpoint
        trend_resp = self.client.get(f"/api/analysis/trends/{item_key}")
        self.assertEqual(trend_resp.status_code, 200)
        trend_data = trend_resp.json()
        self.assertEqual(trend_data["budget_item_key"], item_key)
        self.assertGreater(len(trend_data["trend"]), 0)

        # Test compare endpoint
        y1 = trend_data["trend"][0]["financial_year"]
        y2 = trend_data["trend"][-1]["financial_year"]
        if y1 != y2:
            comp_resp = self.client.get(f"/api/analysis/compare?budget_item_key={item_key}&year1={y1}&year2={y2}")
            self.assertEqual(comp_resp.status_code, 200)
            comp_data = comp_resp.json()
            self.assertEqual(comp_data["year1"], y1)
            self.assertEqual(comp_data["year2"], y2)

    # ---------------------------------------------------------
    # STEP 6: PHASE 4 AGENTIC INVESTIGATION TESTS
    # ---------------------------------------------------------
    def test_agent_investigation_flow(self):
        # Fetch an anomaly key
        anom_resp = self.client.get("/api/anomalies?limit=1")
        item_key = anom_resp.json()["data"][0]["budget_item_key"]

        inv_resp = self.client.get(f"/api/investigations/{item_key}")
        self.assertEqual(inv_resp.status_code, 200)
        data = inv_resp.json()
        self.assertIn("investigation_id", data)
        self.assertIn("investigation_steps", data)
        self.assertIn("explanation", data)
        self.assertIn("sources", data)
        self.assertGreater(len(data["investigation_steps"]), 0)

    # ---------------------------------------------------------
    # STEP 7: PHASE 5 RAG RETRIEVAL TESTS
    # ---------------------------------------------------------
    def test_rag_ingestion_and_search(self):
        # Test ingestion trigger
        ingest_resp = self.client.post("/api/rag/ingest?max_pages=10")
        self.assertEqual(ingest_resp.status_code, 200)
        ingest_data = ingest_resp.json()
        self.assertIn("total_chunks_in_store", ingest_data)

        # Test search endpoint
        search_resp = self.client.get("/api/rag/search?query=budget&top_k=3")
        self.assertEqual(search_resp.status_code, 200)
        search_data = search_resp.json()
        self.assertIn("results", search_data)
        if search_data["total_results"] > 0:
            first_chunk = search_data["results"][0]
            self.assertIn("document_name", first_chunk)
            self.assertIn("page_number", first_chunk)

    # ---------------------------------------------------------
    # STEP 8: PHASE 6 CITIZEN ASSISTANT TESTS
    # ---------------------------------------------------------
    def test_assistant_lookup_intent(self):
        payload = {"question": "How much was allocated to defense in 2024-2025?"}
        response = self.client.post("/api/assistant/ask", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("answer", data)
        self.assertIn("sources", data)

    def test_assistant_comparison_intent(self):
        payload = {"question": "Did atomic energy budget increase between 2022-2023 and 2023-2024?"}
        response = self.client.post("/api/assistant/ask", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("answer", data)
        self.assertEqual(data["intent"], "budget_comparison")

    def test_assistant_trend_intent(self):
        payload = {"question": "Show the trend for atomic energy"}
        response = self.client.post("/api/assistant/ask", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["intent"], "trend_analysis")

    def test_assistant_anomaly_intent(self):
        payload = {"question": "Which items had significant spending changes?"}
        response = self.client.post("/api/assistant/ask", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["intent"], "anomaly_question")

    def test_assistant_investigation_intent(self):
        payload = {"question": "Why did atomic energy budget change?"}
        response = self.client.post("/api/assistant/ask", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["intent"], "investigation_question")
        self.assertIn("evidence_status", data)

    def test_assistant_document_context_intent(self):
        payload = {"question": "What does the budget document say about expenditure?"}
        response = self.client.post("/api/assistant/ask", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["intent"], "document_context")

    def test_assistant_unknown_item(self):
        payload = {"question": "How much was allocated to Quantum Hyperdrive in 3099?"}
        response = self.client.post("/api/assistant/ask", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("could not find a matching official budget item", data["answer"])

    def test_assistant_ambiguous_item(self):
        payload = {"question": "education"}
        response = self.client.post("/api/assistant/ask", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Should flag clarification or list options
        self.assertTrue(data.get("requires_clarification") or len(data.get("options") or []) > 0 or "education" in data["answer"].lower())

if __name__ == "__main__":
    unittest.main()
