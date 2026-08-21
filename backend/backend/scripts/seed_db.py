"""
seed_db.py — CivicLens Database Seeder Script

Seeds budget data from master_budget.csv into SQLite (or PostgreSQL) so that
the backend database is 100% functional with real Indian Union Budget records.
"""

import os
import csv
import sqlite3
from pathlib import Path

def find_project_root() -> Path:
    script_path = Path(__file__).resolve()
    current = script_path.parent
    while current != current.parent:
        if current.name == "CivicLens" or (current / "backend").exists():
            return current
        current = current.parent
    return script_path.parent.parent.parent

def seed_sqlite():
    script_dir = Path(__file__).resolve().parent
    backend_dir = script_dir.parent
    csv_path = backend_dir / "data" / "processed" / "master_budget.csv"
    if not csv_path.exists():
        csv_path = backend_dir.parent / "data" / "processed" / "master_budget.csv"

    if not csv_path.exists():
        print(f"Error: master_budget.csv not found at {csv_path}")
        return

    db_path = backend_dir / "civiclens.db"
    print(f"Seeding database at: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Drop existing table for clean seed
    cursor.execute("DROP TABLE IF EXISTS budget_records;")

    # Create table schema matching app.models.budget.BudgetRecord
    cursor.execute("""
    CREATE TABLE budget_records (
        record_id INTEGER PRIMARY KEY AUTOINCREMENT,
        financial_year TEXT NOT NULL,
        amount_stage TEXT NOT NULL,
        statement TEXT,
        demand_no TEXT,
        ministry_department TEXT,
        expenditure_category TEXT,
        category_number TEXT,
        budget_item TEXT NOT NULL,
        row_type TEXT,
        budget_item_key TEXT NOT NULL,
        amount REAL,
        revenue_amount REAL,
        capital_amount REAL,
        total_amount REAL,
        unit TEXT DEFAULT '₹ Crore',
        source_file TEXT NOT NULL,
        source_row INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Create indexes for optimal querying & performance
    cursor.execute("CREATE INDEX idx_budget_records_fy ON budget_records (financial_year);")
    cursor.execute("CREATE INDEX idx_budget_records_stage ON budget_records (amount_stage);")
    cursor.execute("CREATE INDEX idx_budget_records_ministry ON budget_records (ministry_department);")
    cursor.execute("CREATE INDEX idx_budget_records_item_key ON budget_records (budget_item_key);")
    cursor.execute("CREATE INDEX idx_budget_records_category ON budget_records (expenditure_category);")

    rows = []
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            def parse_float(val):
                if not val or val.strip() == "":
                    return None
                try:
                    return float(val)
                except ValueError:
                    return None

            def parse_int(val, default=0):
                if not val or val.strip() == "":
                    return default
                try:
                    return int(float(val))
                except ValueError:
                    return default

            rows.append((
                row.get("financial_year", ""),
                row.get("amount_stage", "Budget Estimates"),
                row.get("statement"),
                row.get("demand_no"),
                row.get("ministry_department"),
                row.get("expenditure_category"),
                row.get("category_number"),
                row.get("budget_item", ""),
                row.get("row_type"),
                row.get("budget_item_key", ""),
                parse_float(row.get("amount")),
                parse_float(row.get("revenue_amount")),
                parse_float(row.get("capital_amount")),
                parse_float(row.get("total_amount")),
                row.get("unit", "₹ Crore"),
                row.get("source_file", "master_budget.csv"),
                parse_int(row.get("source_row"), 0)
            ))

    print(f"Inserting {len(rows)} records into SQLite database...")
    cursor.executemany("""
    INSERT INTO budget_records (
        financial_year, amount_stage, statement, demand_no, ministry_department,
        expenditure_category, category_number, budget_item, row_type, budget_item_key,
        amount, revenue_amount, capital_amount, total_amount, unit, source_file, source_row
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, rows)

    conn.commit()
    count = cursor.execute("SELECT count(*) FROM budget_records;").fetchone()[0]
    conn.close()

    print(f"DATABASE SEED COMPLETE! Successfully loaded {count} budget records into SQLite database {db_path}.")

if __name__ == "__main__":
    seed_sqlite()
