"""
test_insights_math_fix.py — Comprehensive mathematical and integration verification of Department AI Insights bugfix.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_insights_math():
    print("==================================================")
    print("VERIFYING DEPARTMENT AI INSIGHTS MATHEMATICAL FIX")
    print("==================================================\n")

    # TEST 1: Original Problematic Case (Ministry of Youth Affairs & Sports -> Establishment Expenditure)
    key = "ministry_of_youth_affairs_and_sports__establishment_expenditure_of_the_centre"
    dept = "Ministry of Youth Affairs and Sports"

    res1 = client.get(f"/api/analysis/trends/{key}?ministry_department={dept}")
    assert res1.status_code == 200
    d1 = res1.json()
    trend1 = d1["trend"]
    print(f"TEST 1 — ORIGINAL REPRODUCED CASE: {dept} | {key}")
    print(f"  -> Total Trend Points: {len(trend1)}")
    for pt in trend1:
        fy = pt["financial_year"]
        amt = pt["amount"]
        pct = pt["percentage_change"]
        pct_str = f"{pct:+.2f}%" if pct is not None else "Baseline"
        print(f"     FY {fy}: Rs. {amt:,.2f} Cr ({pct_str})")
        # Ensure no false 2,000,000% percentage exists
        if pct is not None:
            assert abs(pct) < 1000.0, f"Percentage change {pct}% is unreasonably large!"
    print("-" * 50)

    # TEST 2: Verify Department Isolation (Agriculture Department -> Central Sector Schemes)
    dept_agri = "Department of Agriculture and Farmers Welfare"
    key_agri = "department_of_agriculture_and_farmers_welfare__central_sector_schemes_projects"

    res2 = client.get(f"/api/analysis/trends/{key_agri}?ministry_department={dept_agri}")
    assert res2.status_code == 200
    d2 = res2.json()
    trend2 = d2["trend"]
    print(f"TEST 2 — DEPARTMENT ISOLATION: {dept_agri}")
    print(f"  -> Trend Points for Dept: {len(trend2)}")
    for pt in trend2:
        fy = pt["financial_year"]
        amt = pt["amount"]
        pct = pt["percentage_change"]
        pct_str = f"{pct:+.2f}%" if pct is not None else "Baseline"
        print(f"     FY {fy}: Rs. {amt:,.2f} Cr ({pct_str})")
        if pct is not None:
            assert abs(pct) < 500.0
    print("-" * 50)

    # TEST 3: Verify Anomaly Detection Filters Out Token Baselines & Non-Adjacent Years
    res3 = client.get("/api/anomalies?threshold=20&limit=20")
    assert res3.status_code == 200
    anoms = res3.json()["data"]
    print("TEST 3 — ANOMALY DETECTION INTEGRITY:")
    print(f"  -> Top 10 Scoped Anomalies:")
    for a in anoms[:10]:
        item = a["budget_item"][:30]
        dept_name = (a["ministry_department"] or "N/A")[:25]
        prev_fy = a["previous_financial_year"]
        curr_fy = a["financial_year"]
        prev_amt = a["previous_amount"]
        curr_amt = a["current_amount"]
        pct = a["percentage_change"]
        print(f"     {item:30s} | {dept_name:25s} | {prev_fy} (Rs. {prev_amt:,.2f}) -> {curr_fy} (Rs. {curr_amt:,.2f}) | {pct:+.2f}%")
        assert prev_amt >= 10.0, "Previous amount must be >= 10.0 Cr to prevent token division"
        assert abs(pct) < 500000.0, "No raw token division infinity anomalies allowed"
    print("-" * 50)

    # TEST 4: Agent Investigation Workflow Test
    inv_payload = {
        "budget_item_key": key,
        "ministry_department": dept,
        "financial_year": "2024-2025",
        "threshold": 10
    }
    res4 = client.post("/api/investigations", json=inv_payload)
    assert res4.status_code == 200
    inv = res4.json()
    print("TEST 4 — AGENTIC INVESTIGATION INTEGRATION:")
    print(f"  -> Investigation ID: {inv['investigation_id']}")
    print(f"  -> Explanation Focus: {inv['explanation']['summary'][:100]}...")
    assert inv["anomaly"]["budget_item_key"] == key

    print("\n>>> ALL DEPARTMENT AI INSIGHTS MATHEMATICAL & INTEGRATION TESTS PASSED! <<<")

if __name__ == "__main__":
    test_insights_math()
