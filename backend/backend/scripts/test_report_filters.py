import sqlite3

def test_queries():
    conn = sqlite3.connect('civiclens.db')
    cursor = conn.cursor()

    fy = '2024-2025'
    dept = 'Department of Agriculture and Farmers Welfare'
    cat = 'Central Sector Schemes/Projects'

    print("=== 1. ALL MINISTRIES & ALL CATEGORIES (2024-2025) ===")
    q1 = cursor.execute(
        "SELECT SUM(total_amount), SUM(capital_amount), SUM(revenue_amount) FROM budget_records WHERE financial_year=? AND amount_stage='Budget Estimates' AND row_type='ministry_total'",
        (fy,)
    ).fetchone()
    print("Macro Totals (All Depts, All Cats):", q1)

    print("\n=== 2. DEPT = Department of Agriculture and Farmers Welfare ===")
    q2 = cursor.execute(
        "SELECT SUM(total_amount), SUM(capital_amount), SUM(revenue_amount) FROM budget_records WHERE financial_year=? AND amount_stage='Budget Estimates' AND ministry_department=? AND (row_type IS NULL OR row_type != 'ministry_total') AND budget_item NOT LIKE '%Grand Total%'",
        (fy, dept)
    ).fetchone()
    print("Dept Totals:", q2)

    print("\n=== 3. CATEGORY = Central Sector Schemes/Projects ===")
    q3 = cursor.execute(
        "SELECT SUM(total_amount), SUM(capital_amount), SUM(revenue_amount) FROM budget_records WHERE financial_year=? AND amount_stage='Budget Estimates' AND expenditure_category=? AND (row_type IS NULL OR row_type != 'ministry_total') AND budget_item NOT LIKE '%Grand Total%'",
        (fy, cat)
    ).fetchone()
    print("Cat Totals:", q3)

    print("\n=== 4. DEPT + CATEGORY ===")
    q4 = cursor.execute(
        "SELECT SUM(total_amount), SUM(capital_amount), SUM(revenue_amount) FROM budget_records WHERE financial_year=? AND amount_stage='Budget Estimates' AND ministry_department=? AND expenditure_category=? AND (row_type IS NULL OR row_type != 'ministry_total') AND budget_item NOT LIKE '%Grand Total%'",
        (fy, dept, cat)
    ).fetchone()
    print("Dept + Cat Totals:", q4)

    conn.close()

if __name__ == "__main__":
    test_queries()
