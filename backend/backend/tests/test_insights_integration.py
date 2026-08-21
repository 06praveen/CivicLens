"""
test_insights_integration.py — Verifies Department AI Insights, Historical Trend Graph & AI Investigation endpoints.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def verify_insights():
    print("==================================================")
    print("VERIFYING DEPARTMENT AI INSIGHTS & HISTORICAL TRENDS")
    print("==================================================\n")

    # 1. Department List Verification
    res_filters = client.get("/api/budgets/filters")
    assert res_filters.status_code == 200
    depts = res_filters.json()["ministries_departments"]
    print(f"CHECK 1: Department Metadata List ({len(depts)} ministries found)")
    print(f"  -> Sample Ministries: {depts[:3]}")
    print("-" * 50)

    # 2. Department Items & Overview Verification (Department of Agriculture and Farmers Welfare)
    target_dept = "Department of Agriculture and Farmers Welfare"
    res_dept = client.get(f"/api/budgets?ministry={target_dept}&financial_year=2024-2025&limit=10")
    assert res_dept.status_code == 200
    d_dept = res_dept.json()
    print(f"CHECK 2: Department Overview & Items for '{target_dept}'")
    print(f"  -> Matching Items Found: {d_dept['total']}")
    sample_item = d_dept['data'][0]
    target_key = sample_item['budget_item_key']
    print(f"  -> Sample Item: '{sample_item['budget_item']}' | Key: '{target_key}' | Outlay: Rs. {sample_item['total_amount']:,.2f} Cr")
    print("-" * 50)

    # 3. Item 1 Historical Trend & YoY Calculation Verification (central_expenditure)
    key1 = "central_expenditure"
    res_t1 = client.get(f"/api/analysis/trends/{key1}")
    assert res_t1.status_code == 200
    dt1 = res_t1.json()
    print(f"CHECK 3: Historical Graph Trend #1 for '{key1}'")
    print(f"  -> Trend Points Count: {len(dt1['trend'])}")
    last_pt1 = dt1['trend'][-1]
    prev1 = last_pt1['previous_amount']
    curr1 = last_pt1['amount']
    abs1 = last_pt1['absolute_change']
    pct1 = last_pt1['percentage_change']
    calc_abs1 = curr1 - prev1
    calc_pct1 = ((curr1 - prev1) / prev1) * 100
    print(f"  -> [{last_pt1['financial_year']}] Prev: Rs. {prev1:,.2f} Cr | Latest: Rs. {curr1:,.2f} Cr")
    print(f"  -> Reported Abs Change: Rs. {abs1:,.2f} Cr | Calculated Abs: Rs. {calc_abs1:,.2f} Cr")
    print(f"  -> Reported YoY %: {pct1:.2f}% | Calculated YoY %: {calc_pct1:.2f}%")
    assert abs(abs1 - calc_abs1) < 0.01
    assert abs(pct1 - calc_pct1) < 0.01
    print("-" * 50)

    # 4. Item 2 Historical Trend & YoY Calculation Verification (central_sector_schemes)
    key2 = "central_sector_schemes"
    res_t2 = client.get(f"/api/analysis/trends/{key2}")
    assert res_t2.status_code == 200
    dt2 = res_t2.json()
    print(f"CHECK 4: Historical Graph Trend #2 for '{key2}'")
    print(f"  -> Trend Points Count: {len(dt2['trend'])}")
    last_pt2 = dt2['trend'][-1]
    prev2 = last_pt2['previous_amount']
    curr2 = last_pt2['amount']
    abs2 = last_pt2['absolute_change']
    pct2 = last_pt2['percentage_change']
    calc_abs2 = curr2 - prev2
    calc_pct2 = ((curr2 - prev2) / prev2) * 100
    print(f"  -> [{last_pt2['financial_year']}] Prev: Rs. {prev2:,.2f} Cr | Latest: Rs. {curr2:,.2f} Cr")
    print(f"  -> Reported Abs Change: Rs. {abs2:,.2f} Cr | Calculated Abs: Rs. {calc_abs2:,.2f} Cr")
    print(f"  -> Reported YoY %: {pct2:.2f}% | Calculated YoY %: {calc_pct2:.2f}%")
    assert abs(abs2 - calc_abs2) < 0.01
    assert abs(pct2 - calc_pct2) < 0.01
    print("-" * 50)

    # 5. Agentic AI Investigation Verification
    res_inv = client.post("/api/investigations", json={"budget_item_key": key1, "financial_year": "2024-2025"})
    assert res_inv.status_code == 200
    d_inv = res_inv.json()
    print("CHECK 5: Grounded Agentic AI Investigation")
    print(f"  -> Investigation ID: {d_inv['investigation_id']}")
    print(f"  -> Confidence: {d_inv['explanation']['confidence']}")
    print(f"  -> Evidence Status: {d_inv['explanation']['evidence_status']}")
    print(f"  -> Verified Sources Count: {len(d_inv['sources'])}")
    print("\n>>> ALL DEPARTMENT AI INSIGHTS VERIFICATIONS PASSED! <<<")

if __name__ == "__main__":
    verify_insights()
