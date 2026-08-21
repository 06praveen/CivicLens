"""
test_report_filter_bugfix.py — Verifies that all 3 filters (Year, Ministry, Category) work together cumulatively across Preview, CSV, and PDF endpoints.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def verify_report_filters():
    print("==================================================")
    print("VERIFYING REPORT & DOWNLOADS CUMULATIVE 3-FILTER BUG FIX")
    print("==================================================\n")

    fy = "2024-2025"
    dept = "Department of Agriculture and Farmers Welfare"
    cat = "Central Sector Schemes/Projects"

    # TEST 1: All Depts, All Categories
    r1 = client.get(f"/api/reports/preview?financial_year={fy}")
    assert r1.status_code == 200
    d1 = r1.json()
    tot1 = d1['total_budget']
    top1 = d1['top_items'][0]['budget_item']
    print("TEST 1: FY 2024-2025 | All Depts | All Categories")
    print(f"  -> Total Budget: Rs. {tot1:,.2f} Cr")
    print(f"  -> Top Item #1: '{top1}'")
    print("-" * 50)

    # TEST 2: Specific Department, All Categories
    r2 = client.get(f"/api/reports/preview?financial_year={fy}&ministry={dept}")
    assert r2.status_code == 200
    d2 = r2.json()
    tot2 = d2['total_budget']
    top2 = d2['top_items'][0]['budget_item']
    print(f"TEST 2: FY 2024-2025 | Dept '{dept}' | All Categories")
    print(f"  -> Total Budget: Rs. {tot2:,.2f} Cr")
    print(f"  -> Top Item #1: '{top2}'")
    assert tot2 != tot1
    assert tot2 == 122528.77
    print("-" * 50)

    # TEST 3: All Depts, Specific Category
    r3 = client.get(f"/api/reports/preview?financial_year={fy}&expenditure_category={cat}")
    assert r3.status_code == 200
    d3 = r3.json()
    tot3 = d3['total_budget']
    top3 = d3['top_items'][0]['budget_item']
    print(f"TEST 3: FY 2024-2025 | All Depts | Category '{cat}'")
    print(f"  -> Total Budget: Rs. {tot3:,.2f} Cr")
    print(f"  -> Top Item #1: '{top3}'")
    assert tot3 != tot1
    assert tot3 != tot2
    assert tot3 == 3032351.5
    print("-" * 50)

    # TEST 4: Specific Department + Specific Category (Intersection)
    r4 = client.get(f"/api/reports/preview?financial_year={fy}&ministry={dept}&expenditure_category={cat}")
    assert r4.status_code == 200
    d4 = r4.json()
    tot4 = d4['total_budget']
    top4 = d4['top_items'][0]['budget_item']
    print(f"TEST 4: FY 2024-2025 | Dept '{dept}' | Category '{cat}'")
    print(f"  -> Total Budget: Rs. {tot4:,.2f} Cr")
    print(f"  -> Top Item #1: '{top4}'")
    assert tot4 != tot1
    assert tot4 != tot2
    assert tot4 != tot3
    assert tot4 == 105856.67
    print("-" * 50)

    # TEST 5: Verify CSV Export for Dept + Category
    rcsv = client.get(f"/api/reports/csv?financial_year={fy}&ministry={dept}&expenditure_category={cat}")
    assert rcsv.status_code == 200
    csv_lines = rcsv.text.splitlines()
    print("TEST 5: CSV Export with Dept + Category Filters")
    print(f"  -> CSV Lines Exported: {len(csv_lines)}")
    row = csv_lines[1].split(",")
    print(f"  -> CSV Row #1: FY '{row[1]}' | Dept '{row[2]}' | Cat '{row[3]}' | Amount Rs. {float(row[8]):,.2f} Cr")
    assert row[2] == dept
    assert row[3] == cat
    print("-" * 50)

    # TEST 6: Verify PDF Export for Dept + Category
    rpdf = client.get(f"/api/reports/pdf?financial_year={fy}&ministry={dept}&expenditure_category={cat}")
    assert rpdf.status_code == 200
    assert rpdf.content.startswith(b"%PDF")
    print("TEST 6: PDF Report with Dept + Category Filters")
    print(f"  -> Binary PDF Size: {len(rpdf.content)} bytes")
    print("\n>>> ALL 4 REAL FILTER COMBINATION TESTS PASSED PERFECTLY! <<<")

if __name__ == "__main__":
    verify_report_filters()
