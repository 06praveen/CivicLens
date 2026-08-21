from app.database import get_db
from app.services.analysis_service import AnalysisService

def test_reproduce():
    db = next(get_db())
    try:
        anoms, total = AnalysisService.detect_anomalies(db, threshold=20.0, limit=30)
        print(f"Total anomalies detected: {total}")
        print("Top Anomalies:")
        for a in anoms[:25]:
            item_name = str(a.get('budget_item') or a.get('budget_item_key'))
            dept = str(a.get('ministry_department') or 'N/A')
            prev_fy = str(a.get('previous_financial_year'))
            curr_fy = str(a.get('financial_year'))
            prev_amt = a.get('previous_amount')
            curr_amt = a.get('current_amount')
            pct = a.get('percentage_change')
            print(f"Key: {a['budget_item_key'][:30]:30s} | Item: {item_name[:35]:35s} | Dept: {dept[:25]:25s} | {prev_fy} ({prev_amt}) -> {curr_fy} ({curr_amt}) | YoY %: {pct}%")
    finally:
        db.close()

if __name__ == "__main__":
    test_reproduce()
