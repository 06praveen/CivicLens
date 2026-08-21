"""
test_all_endpoints.py — End-to-end FastAPI backend testing suite.
Tests every API endpoint against real database records and services.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoints():
    print("\n--- 1. Testing Health Endpoint ---")
    res = client.get("/health")
    print("Health Status:", res.status_code, res.json())
    assert res.status_code == 200

    print("\n--- 2. Testing Budgets Listing Endpoint ---")
    res = client.get("/api/budgets?limit=5")
    print("Budgets List Status:", res.status_code)
    data = res.json()
    print(f"Total Records: {data.get('total')}, Page Items: {len(data.get('data', []))}")
    assert res.status_code == 200
    assert len(data.get("data", [])) > 0

    print("\n--- 3. Testing Budgets Summary Endpoint ---")
    res = client.get("/api/budgets/summary")
    print("Budgets Summary Status:", res.status_code, res.json())
    assert res.status_code == 200

    print("\n--- 4. Testing Budgets Filters Endpoint ---")
    res = client.get("/api/budgets/filters")
    print("Budgets Filters Status:", res.status_code)
    filters = res.json()
    print("Years:", filters.get("financial_years"))
    print("Ministries count:", len(filters.get("ministries_departments", [])))
    assert res.status_code == 200

    print("\n--- 5. Testing Analysis Trend Endpoint ---")
    item_key = data["data"][0]["budget_item_key"]
    print(f"Testing trend for key: {item_key}")
    res = client.get(f"/api/analysis/trends/{item_key}")
    print("Trend Status:", res.status_code)
    assert res.status_code == 200

    print("\n--- 6. Testing Analysis Compare Endpoint ---")
    res = client.get(f"/api/analysis/compare?budget_item_key={item_key}&year1=2020-2021&year2=2024-2025")
    print("Compare Status:", res.status_code)
    assert res.status_code == 200

    print("\n--- 7. Testing Anomalies Endpoint ---")
    res = client.get("/api/anomalies?threshold=10&limit=5")
    print("Anomalies Status:", res.status_code)
    anom_data = res.json()
    print(f"Total Anomalies: {anom_data.get('total')}, Count: {len(anom_data.get('data', []))}")
    assert res.status_code == 200

    print("\n--- 8. Testing Agentic Investigation Endpoint ---")
    res = client.post("/api/investigations", json={
        "budget_item_key": item_key,
        "financial_year": "2024-2025",
        "threshold": 10.0
    })
    print("Investigation Status:", res.status_code)
    inv = res.json()
    print("Investigation ID:", inv.get("investigation_id"))
    print("Explanation Summary:", inv.get("explanation", {}).get("summary", "").encode('ascii', 'ignore').decode('ascii'))
    print("Sources Count:", len(inv.get("sources", [])))
    assert res.status_code == 200

    print("\n--- 9. Testing RAG Document Search Endpoint ---")
    res = client.get("/api/rag/search?query=education")
    print("RAG Search Status:", res.status_code)
    rag_data = res.json()
    print(f"RAG Results Total: {rag_data.get('total_results')}")
    assert res.status_code == 200

    print("\n--- 10. Testing Citizen Assistant Ask Endpoint ---")
    res = client.post("/api/assistant/ask", json={
        "question": "How much was allocated to education in 2024-2025?",
        "financial_year": "2024-2025"
    })
    print("Assistant Ask Status:", res.status_code)
    ast = res.json()
    print("Intent:", ast.get("intent"))
    print("Answer snippet:", ast.get("answer", "")[:100].encode('ascii', 'ignore').decode('ascii'))
    print("Sources count:", len(ast.get("sources", [])))
    assert res.status_code == 200


    print("\n>>> ALL BACKEND ENDPOINTS PASSED VERIFICATION! <<<")

if __name__ == "__main__":
    test_endpoints()
