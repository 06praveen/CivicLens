"""
test_assistant_scenarios.py — Tests 8 specific citizen assistant scenarios against FastAPI backend.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

scenarios = [
    ("TEST A: Budget Lookup", "How much was allocated to Samagra Shiksha in 2024-2025?"),
    ("TEST B: Comparison", "Compare education budget between 2020-2021 and 2024-2025"),
    ("TEST C: Trend", "What is the historical spending trend for MGNREGS?"),
    ("TEST D: Anomaly", "What budget items had significant spending spikes in 2020-2021?"),
    ("TEST E: Investigation", "Why did central expenditure increase significantly in 2020-2021?"),
    ("TEST F: Document Context", "What does the Union Budget document say about infrastructure capital expenditure?"),
    ("TEST G: Unknown Item", "What was the budget for Quantum Hyperdrive System 9000?"),
    ("TEST H: Ambiguous Item", "Show me the health budget"),
]

def run_tests():
    print("==================================================")
    print("RUNNING 8 CITIZEN ASSISTANT END-TO-END SCENARIO TESTS")
    print("==================================================\n")

    for title, q in scenarios:
        res = client.post("/api/assistant/ask", json={"question": q, "financial_year": "2024-2025"})
        status = res.status_code
        data = res.json()
        print(f"[{title}] Query: '{q}'")
        print(f"  -> HTTP Status: {status}")
        print(f"  -> Intent Detected: {data.get('intent')}")
        print(f"  -> Requires Clarification: {data.get('requires_clarification')}")
        print(f"  -> Confidence: {data.get('confidence')}")
        print(f"  -> Sources Count: {len(data.get('sources', []))}")
        print(f"  -> Answer: {data.get('answer', '')[:120].encode('ascii', 'ignore').decode('ascii')}...")
        print("-" * 50)

if __name__ == "__main__":
    run_tests()
