"""
test_glance_integration.py — Verifies Budget at a Glance API responses & database values.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def verify_glance():
    print("==================================================")
    print("VERIFYING BUDGET AT A GLANCE REAL DATA AGGREGATION")
    print("==================================================\n")

    # Check 1: FY 2024-2025 Summary
    res1 = client.get("/api/budgets/summary?financial_year=2024-2025")
    assert res1.status_code == 200
    d1 = res1.json()
    print("CHECK 1: FY 2024-2025 Summary")
    print(f"  -> Total Budget: Rs. {d1['total_budget']:,.2f} Cr")
    print(f"  -> Revenue Exp:  Rs. {d1['revenue_expenditure']:,.2f} Cr")
    print(f"  -> Capital Exp:  Rs. {d1['capital_expenditure']:,.2f} Cr")
    print(f"  -> Departments:  {d1['department_count']}")
    print(f"  -> Top Sector:   {d1['sector_allocations'][0]['sector']} = Rs. {d1['sector_allocations'][0]['amount']:,.2f} Cr ({d1['sector_allocations'][0]['pct']}%)")
    print("-" * 50)

    # Check 2: FY 2023-2024 Summary
    res2 = client.get("/api/budgets/summary?financial_year=2023-2024")
    assert res2.status_code == 200
    d2 = res2.json()
    print("CHECK 2: FY 2023-2024 Summary")
    print(f"  -> Total Budget: Rs. {d2['total_budget']:,.2f} Cr")
    print(f"  -> Revenue Exp:  Rs. {d2['revenue_expenditure']:,.2f} Cr")
    print(f"  -> Capital Exp:  Rs. {d2['capital_expenditure']:,.2f} Cr")
    print(f"  -> Departments:  {d2['department_count']}")
    print("-" * 50)

    # Check 3: YoY Trend Array Length & Last Entry
    res3 = client.get("/api/budgets/summary")
    assert res3.status_code == 200
    d3 = res3.json()
    print("CHECK 3: Multi-Year YoY Trend Summary")
    print(f"  -> Total Recorded Years: {len(d3['available_financial_years'])} ({d3['available_financial_years']})")
    print(f"  -> YoY Trend Points Count: {len(d3['yoy_trend'])}")
    last_trend = d3['yoy_trend'][-1]
    print(f"  -> Latest Trend Point ({last_trend['year']}): Budget=Rs. {last_trend['budget']:,.2f} Cr, Rev=Rs. {last_trend['expenditure']:,.2f} Cr, Capex=Rs. {last_trend['capitalExp']:,.2f} Cr")
    print("\n>>> ALL BUDGET AT A GLANCE VERIFICATIONS PASSED! <<<")

if __name__ == "__main__":
    verify_glance()
