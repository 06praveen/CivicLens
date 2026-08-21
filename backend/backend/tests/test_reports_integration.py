"""
test_reports_integration.py — Verifies Report & Downloads CSV export, PDF report generation, and cross-feature consistency.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def verify_reports():
    print("==================================================")
    print("VERIFYING REPORT & DOWNLOADS REAL DATABASE GENERATION")
    print("==================================================\n")

    # CSV Check 1: FY 2024-2025 CSV Download
    res_csv1 = client.get("/api/reports/csv?financial_year=2024-2025")
    assert res_csv1.status_code == 200
    assert "text/csv" in res_csv1.headers["content-type"]
    lines1 = res_csv1.text.splitlines()
    print("CSV CHECK 1: FY 2024-2025 CSV Download")
    print(f"  -> Total Exported CSV Lines: {len(lines1)}")
    print(f"  -> Header Columns ({len(lines1[0].split(','))} cols): {lines1[0]}")
    row1 = lines1[1].split(",")
    print(f"  -> Record #1: ID #{row1[0]} | FY: {row1[1]} | Item: '{row1[4]}' | Total Amount: Rs. {float(row1[11]):,.2f} Cr")
    assert float(row1[11]) == 4820512.08
    print("-" * 50)

    # CSV Check 2: FY 2023-2024 CSV Download
    res_csv2 = client.get("/api/reports/csv?financial_year=2023-2024")
    assert res_csv2.status_code == 200
    lines2 = res_csv2.text.splitlines()
    print("CSV CHECK 2: FY 2023-2024 CSV Download")
    print(f"  -> Total Exported CSV Lines: {len(lines2)}")
    row2 = lines2[1].split(",")
    print(f"  -> Record #1: ID #{row2[0]} | FY: {row2[1]} | Item: '{row2[4]}' | Total Amount: Rs. {float(row2[11]):,.2f} Cr")
    print("-" * 50)

    # CSV Check 3: Department Filter CSV Download
    dept = "Department of Agriculture and Farmers Welfare"
    res_csv3 = client.get(f"/api/reports/csv?ministry={dept}")
    assert res_csv3.status_code == 200
    lines3 = res_csv3.text.splitlines()
    print(f"CSV CHECK 3: Department '{dept}' CSV Download")
    print(f"  -> Total Matching Department Lines: {len(lines3)}")
    row3 = lines3[1].split(",")
    print(f"  -> Sample Row: ID #{row3[0]} | Dept: '{row3[2]}' | Outlay: Rs. {float(row3[11]):,.2f} Cr")
    print("-" * 50)

    # CSV Check 4: FY + Department Filter CSV Download
    res_csv4 = client.get(f"/api/reports/csv?financial_year=2024-2025&ministry={dept}")
    assert res_csv4.status_code == 200
    lines4 = res_csv4.text.splitlines()
    print(f"CSV CHECK 4: FY 2024-2025 + Department '{dept}' CSV Download")
    print(f"  -> Total Filtered Lines: {len(lines4)}")
    print("-" * 50)

    # CSV Check 5: Category Filter CSV Download
    cat = "Central Sector Schemes"
    res_csv5 = client.get(f"/api/reports/csv?expenditure_category={cat}")
    assert res_csv5.status_code == 200
    lines5 = res_csv5.text.splitlines()
    print(f"CSV CHECK 5: Category '{cat}' CSV Download")
    print(f"  -> Total Matching Category Lines: {len(lines5)}")
    print("-" * 50)

    # PDF Check 1: FY 2024-2025 PDF Transparency Report
    res_pdf1 = client.get("/api/reports/pdf?financial_year=2024-2025")
    assert res_pdf1.status_code == 200
    assert "application/pdf" in res_pdf1.headers["content-type"]
    assert res_pdf1.content.startswith(b"%PDF")
    print("PDF CHECK 1: FY 2024-2025 PDF Transparency Report")
    print(f"  -> Content-Type: {res_pdf1.headers['content-type']}")
    print(f"  -> Binary PDF Size: {len(res_pdf1.content)} bytes")
    print(f"  -> Valid PDF Signature: {res_pdf1.content[:8]}")
    print("-" * 50)

    # PDF Check 2: FY 2023-2024 PDF Transparency Report
    res_pdf2 = client.get("/api/reports/pdf?financial_year=2023-2024")
    assert res_pdf2.status_code == 200
    assert res_pdf2.content.startswith(b"%PDF")
    print("PDF CHECK 2: FY 2023-2024 PDF Transparency Report")
    print(f"  -> Binary PDF Size: {len(res_pdf2.content)} bytes")
    print("-" * 50)

    # PDF Check 3: Department PDF Report
    res_pdf3 = client.get(f"/api/reports/pdf?financial_year=2024-2025&ministry={dept}")
    assert res_pdf3.status_code == 200
    assert res_pdf3.content.startswith(b"%PDF")
    print(f"PDF CHECK 3: Department '{dept}' PDF Transparency Report")
    print(f"  -> Binary PDF Size: {len(res_pdf3.content)} bytes")
    print("-" * 50)

    # Cross-Feature Consistency Check
    res_prev = client.get("/api/reports/preview?financial_year=2024-2025")
    res_sum = client.get("/api/budgets/summary?financial_year=2024-2025")
    assert res_prev.status_code == 200
    assert res_sum.status_code == 200
    p_tot = res_prev.json()["total_budget"]
    s_tot = res_sum.json()["total_budget"]
    print("CROSS-FEATURE CONSISTENCY CHECK:")
    print(f"  -> Budget at a Glance Summary Total: Rs. {s_tot:,.2f} Cr")
    print(f"  -> Report Preview Total Outlay:      Rs. {p_tot:,.2f} Cr")
    assert abs(p_tot - s_tot) < 0.01
    print("  -> EXACT MATCH VERIFIED!")

    print("\n>>> ALL REPORT & DOWNLOADS VERIFICATIONS PASSED! <<<")

if __name__ == "__main__":
    verify_reports()
