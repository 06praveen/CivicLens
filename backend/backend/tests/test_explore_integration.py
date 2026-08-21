"""
test_explore_integration.py — Verifies Explore Budget API responses & database records.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def verify_explore():
    print("==================================================")
    print("VERIFYING EXPLORE BUDGET REAL DATABASE INTEGRATION")
    print("==================================================\n")

    # Check 1: FY 2024-2025 Records Listing & Pagination
    res1 = client.get("/api/budgets?financial_year=2024-2025&page=1&limit=5")
    assert res1.status_code == 200
    d1 = res1.json()
    print("CHECK 1: FY 2024-2025 Records Listing")
    print(f"  -> Total Matching Records: {d1['total']}")
    print(f"  -> Total Pages: {d1['total_pages']}")
    rec1 = d1['data'][0]
    print(f"  -> Record #1: ID #{rec1['record_id']} | Item: '{rec1['budget_item']}' | Dept: '{rec1['ministry_department']}' | Outlay: Rs. {rec1['total_amount']:,.2f} Cr")
    print("-" * 50)

    # Check 2: FY 2023-2024 Records Listing
    res2 = client.get("/api/budgets?financial_year=2023-2024&page=1&limit=5")
    assert res2.status_code == 200
    d2 = res2.json()
    print("CHECK 2: FY 2023-2024 Records Listing")
    print(f"  -> Total Matching Records: {d2['total']}")
    rec2 = d2['data'][0]
    print(f"  -> Record #2: ID #{rec2['record_id']} | Item: '{rec2['budget_item']}' | Dept: '{rec2['ministry_department']}' | Outlay: Rs. {rec2['total_amount']:,.2f} Cr")
    print("-" * 50)

    # Check 3: Ministry & Search Filtering (Agriculture)
    res3 = client.get("/api/budgets?search=Agriculture&page=1&limit=5")
    assert res3.status_code == 200
    d3 = res3.json()
    print("CHECK 3: Search Query 'Agriculture'")
    print(f"  -> Total Found: {d3['total']}")
    rec3 = d3['data'][0]
    print(f"  -> Record #3: ID #{rec3['record_id']} | Item: '{rec3['budget_item']}' | Dept: '{rec3['ministry_department']}' | Outlay: Rs. {rec3['total_amount']:,.2f} Cr")
    print("-" * 50)

    # Check 4: Specific Scheme Search (Samagra Shiksha)
    res4 = client.get("/api/budgets?search=Samagra%20Shiksha&page=1&limit=5")
    assert res4.status_code == 200
    d4 = res4.json()
    print("CHECK 4: Search Query 'Samagra Shiksha'")
    print(f"  -> Total Found: {d4['total']}")
    rec4 = d4['data'][0]
    print(f"  -> Record #4: ID #{rec4['record_id']} | Item: '{rec4['budget_item']}' | FY: {rec4['financial_year']} | Outlay: Rs. {rec4['total_amount']:,.2f} Cr")
    print("-" * 50)

    # Check 5: Detail View by Record ID
    target_id = rec1['record_id']
    res5 = client.get(f"/api/budgets/{target_id}")
    assert res5.status_code == 200
    rec5 = res5.json()
    print(f"CHECK 5: Record Detail View for ID #{target_id}")
    print(f"  -> Item Name: '{rec5['budget_item']}'")
    print(f"  -> Normalized Key: '{rec5['budget_item_key']}'")
    print(f"  -> Amount Stage: '{rec5['amount_stage']}' | Statement: '{rec5['statement']}'")
    print(f"  -> Source Metadata: File='{rec5['source_file']}' | Row #{rec5['source_row']}")
    print("\n>>> ALL 5 EXPLORE BUDGET REAL RECORD CHECKS PASSED! <<<")

if __name__ == "__main__":
    verify_explore()
