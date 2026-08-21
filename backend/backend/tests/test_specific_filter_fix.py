"""
test_specific_filter_fix.py — Comprehensive end-to-end verification of specific department and category filter bugfix.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def verify_all_filters():
    print("==================================================")
    print("VERIFYING SPECIFIC REPORT FILTERS NON-ZERO BUG FIX")
    print("==================================================\n")

    fy = "2024-2025"
    dept_a = "Department of Agriculture and Farmers Welfare"
    dept_b = "Department of Higher Education"
    cat_a = "Central Sector Schemes/Projects"
    cat_b = "Centrally Sponsored Schemes"

    # TEST 1: ALL
    r1 = client.get(f"/api/reports/preview?financial_year={fy}")
    assert r1.status_code == 200
    tot1 = r1.json()['total_budget']
    print(f"TEST 1 — ALL: FY={fy} | Dept=All | Cat=All")
    print(f"  -> Total Budget: Rs. {tot1:,.2f} Cr")
    assert tot1 == 4820512.08
    print("-" * 50)

    # TEST 2: SPECIFIC DEPARTMENT
    r2 = client.get(f"/api/reports/preview?financial_year={fy}&ministry={dept_a}")
    assert r2.status_code == 200
    tot2 = r2.json()['total_budget']
    print(f"TEST 2 — DEPARTMENT: FY={fy} | Dept='{dept_a}' | Cat=All")
    print(f"  -> Total Budget: Rs. {tot2:,.2f} Cr (NON-ZERO!)")
    assert tot2 > 0
    assert tot2 == 122528.77
    print("-" * 50)

    # TEST 3: SPECIFIC CATEGORY
    r3 = client.get(f"/api/reports/preview?financial_year={fy}&expenditure_category={cat_a}")
    assert r3.status_code == 200
    tot3 = r3.json()['total_budget']
    print(f"TEST 3 — CATEGORY: FY={fy} | Dept=All | Cat='{cat_a}'")
    print(f"  -> Total Budget: Rs. {tot3:,.2f} Cr (NON-ZERO!)")
    assert tot3 > 0
    assert tot3 == 3032351.5
    print("-" * 50)

    # TEST 4: BOTH (INTERSECTION)
    r4 = client.get(f"/api/reports/preview?financial_year={fy}&ministry={dept_a}&expenditure_category={cat_a}")
    assert r4.status_code == 200
    tot4 = r4.json()['total_budget']
    print(f"TEST 4 — BOTH: FY={fy} | Dept='{dept_a}' | Cat='{cat_a}'")
    print(f"  -> Total Budget: Rs. {tot4:,.2f} Cr (NON-ZERO!)")
    assert tot4 > 0
    assert tot4 == 105856.67
    print("-" * 50)

    # TEST 5: CHANGE DEPARTMENT (Dept A -> Dept B)
    r5 = client.get(f"/api/reports/preview?financial_year={fy}&ministry={dept_b}")
    assert r5.status_code == 200
    tot5 = r5.json()['total_budget']
    print(f"TEST 5 — CHANGE DEPARTMENT: Dept A ({dept_a}: Rs. {tot2:,.2f} Cr) -> Dept B ({dept_b}: Rs. {tot5:,.2f} Cr)")
    assert tot5 > 0
    assert tot5 != tot2
    print("-" * 50)

    # TEST 6: CHANGE CATEGORY (Cat A -> Cat B)
    r6 = client.get(f"/api/reports/preview?financial_year={fy}&expenditure_category={cat_b}")
    assert r6.status_code == 200
    tot6 = r6.json()['total_budget']
    print(f"TEST 6 — CHANGE CATEGORY: Cat A ({cat_a}: Rs. {tot3:,.2f} Cr) -> Cat B ({cat_b}: Rs. {tot6:,.2f} Cr)")
    assert tot6 > 0
    assert tot6 != tot3
    print("-" * 50)

    # TEST 7: CSV EXPORT
    rcsv = client.get(f"/api/reports/csv?financial_year={fy}&ministry={dept_a}&expenditure_category={cat_a}")
    assert rcsv.status_code == 200
    lines = rcsv.text.splitlines()
    print("TEST 7 — CSV EXPORT:")
    print(f"  -> Exported Lines: {len(lines)}")
    row = lines[1].split(",")
    print(f"  -> Sample Line: FY='{row[1]}' | Dept='{row[2]}' | Cat='{row[3]}' | Amount=Rs. {float(row[8]):,.2f} Cr")
    assert row[2] == dept_a
    assert row[3] == cat_a
    print("-" * 50)

    # TEST 8: PDF EXPORT
    rpdf = client.get(f"/api/reports/pdf?financial_year={fy}&ministry={dept_a}&expenditure_category={cat_a}")
    assert rpdf.status_code == 200
    assert rpdf.content.startswith(b"%PDF")
    print("TEST 8 — PDF EXPORT:")
    print(f"  -> Binary PDF Size: {len(rpdf.content)} bytes")
    print(f"  -> Valid PDF Header: {rpdf.content[:8]}")

    print("\n>>> ALL 8 MANDATORY SPECIFIC FILTER FIX TESTS PASSED PERFECTLY! <<<")

if __name__ == "__main__":
    verify_all_filters()
