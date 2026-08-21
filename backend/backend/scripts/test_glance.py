"""
test_glance.py — Tests Budget at a Glance aggregation logic against SQLite database.
"""

import sqlite3

def get_glance_data(target_fy='2024-2025'):
    conn = sqlite3.connect('civiclens.db')
    cursor = conn.cursor()

    years = [r[0] for r in cursor.execute('SELECT DISTINCT financial_year FROM budget_records WHERE financial_year IS NOT NULL ORDER BY financial_year ASC').fetchall()]

    stmt1 = cursor.execute('''
        SELECT total_amount, revenue_amount, capital_amount 
        FROM budget_records 
        WHERE financial_year = ? AND statement = 'Statement 1' AND budget_item_key = 'total_expenditure_through_budget'
        LIMIT 1
    ''', (target_fy,)).fetchone()

    if stmt1 and stmt1[0]:
        total_budget, revenue_exp, capital_exp = stmt1[0], stmt1[1] or 0.0, stmt1[2] or 0.0
    else:
        mt = cursor.execute('''
            SELECT SUM(total_amount), SUM(revenue_amount), SUM(capital_amount)
            FROM budget_records
            WHERE financial_year = ? AND row_type = 'ministry_total'
        ''', (target_fy,)).fetchone()
        if mt and mt[0]:
            total_budget, revenue_exp, capital_exp = mt[0], mt[1] or 0.0, mt[2] or 0.0
        else:
            mt2 = cursor.execute('''
                SELECT SUM(COALESCE(total_amount, amount, 0)) / 4.0, SUM(COALESCE(revenue_amount, 0)) / 4.0, SUM(COALESCE(capital_amount, 0)) / 4.0
                FROM budget_records
                WHERE financial_year = ? AND amount_stage = 'Budget Estimates'
            ''', (target_fy,)).fetchone()
            total_budget, revenue_exp, capital_exp = mt2[0] or 0.0, mt2[1] or 0.0, mt2[2] or 0.0

    dept_count = cursor.execute("SELECT COUNT(DISTINCT ministry_department) FROM budget_records WHERE financial_year = ? AND ministry_department IS NOT NULL AND ministry_department != ''", (target_fy,)).fetchone()[0]
    items_count = cursor.execute("SELECT COUNT(DISTINCT budget_item) FROM budget_records WHERE financial_year = ?", (target_fy,)).fetchone()[0]

    sectors_raw = cursor.execute("""
        SELECT expenditure_category, SUM(COALESCE(total_amount, amount, 0)) as total
        FROM budget_records
        WHERE financial_year = ? AND expenditure_category IS NOT NULL AND expenditure_category != '' AND expenditure_category NOT LIKE 'Grand Total%'
        GROUP BY expenditure_category
        ORDER BY total DESC
        LIMIT 8
    """, (target_fy,)).fetchall()

    sec_sum = sum(s[1] for s in sectors_raw) or 1.0
    palette = ['#1e3a8a', '#FF9933', '#138808', '#7c3aed', '#be123c', '#b45309', '#0891b2', '#6b7280']
    sectors = [
        {
            'sector': s[0],
            'amount': round(s[1], 2),
            'pct': round((s[1] / sec_sum) * 100, 1),
            'color': palette[i % len(palette)]
        }
        for i, s in enumerate(sectors_raw)
    ]

    yoy_trend = []
    for y in years:
        st1 = cursor.execute('''
            SELECT total_amount, revenue_amount, capital_amount 
            FROM budget_records 
            WHERE financial_year = ? AND statement = 'Statement 1' AND budget_item_key = 'total_expenditure_through_budget'
            LIMIT 1
        ''', (y,)).fetchone()
        
        if st1 and st1[0]:
            tot, rev, cap = st1[0], st1[1] or 0.0, st1[2] or 0.0
        else:
            mt = cursor.execute('''
                SELECT SUM(total_amount), SUM(revenue_amount), SUM(capital_amount)
                FROM budget_records
                WHERE financial_year = ? AND row_type = 'ministry_total'
            ''', (y,)).fetchone()
            if mt and mt[0]:
                tot, rev, cap = mt[0], mt[1] or 0.0, mt[2] or 0.0
            else:
                mt2 = cursor.execute('''
                    SELECT SUM(COALESCE(total_amount, amount, 0)) / 4.0, SUM(COALESCE(revenue_amount, 0)) / 4.0, SUM(COALESCE(capital_amount, 0)) / 4.0
                    FROM budget_records
                    WHERE financial_year = ? AND amount_stage = 'Budget Estimates'
                ''', (y,)).fetchone()
                tot, rev, cap = mt2[0] or 0.0, mt2[1] or 0.0, mt2[2] or 0.0
        
        yoy_trend.append({
            'year': y,
            'budget': round(tot, 2),
            'expenditure': round(rev, 2),
            'capitalExp': round(cap, 2)
        })

    conn.close()

    return {
        'financial_year': target_fy,
        'available_years': years,
        'kpis': {
            'total_budget': round(total_budget, 2),
            'revenue_expenditure': round(revenue_exp, 2),
            'capital_expenditure': round(capital_exp, 2),
            'department_count': dept_count,
            'items_count': items_count,
        },
        'sector_allocations': sectors,
        'yoy_trend': yoy_trend
    }

if __name__ == '__main__':
    data = get_glance_data('2024-2025')
    print('=== GLANCE DATA RESULTS FOR 2024-2025 ===')
    print('KPIs:', data['kpis'])
    print('Sectors count:', len(data['sector_allocations']))
    for s in data['sector_allocations']:
        print('  Sector:', s)
    print('YoY Trend:')
    for y in data['yoy_trend']:
        print('  Year:', y)
