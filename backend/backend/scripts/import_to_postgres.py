"""
CivicLens Data Pipeline - PostgreSQL Import Script

Imports `master_budget.csv` into PostgreSQL using `DATABASE_URL`
or standard PostgreSQL environment variables (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD).
"""

import os
import sys
from pathlib import Path
import pandas as pd

def find_project_root() -> Path:
    script_path = Path(__file__).resolve()
    current = script_path.parent
    while current != current.parent:
        if current.name == "CivicLens" or (current / "backend").exists():
            return current
        current = current.parent
    return script_path.parent.parent.parent

def main():
    project_root = find_project_root()
    master_path = project_root / "backend" / "data" / "processed" / "master_budget.csv"
    if not master_path.exists():
        master_path = project_root / "data" / "processed" / "master_budget.csv"
        
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        pghost = os.getenv("PGHOST", "localhost")
        pgport = os.getenv("PGPORT", "5432")
        pgdb = os.getenv("PGDATABASE", "civiclens")
        pguser = os.getenv("PGUSER", "postgres")
        pgpassword = os.getenv("PGPASSWORD", "")
        
        if not pgpassword:
            print("INFO: DATABASE_URL or PGPASSWORD environment variables are not set.")
            print("Skipping active database connection test.")
            print("When ready, set DATABASE_URL (or PGPASSWORD) and run this script to load master_budget.csv into PostgreSQL.")
            return
            
        db_url = f"postgresql://{pguser}:{pgpassword}@{pghost}:{pgport}/{pgdb}"
        
    try:
        from sqlalchemy import create_engine
        print(f"Connecting to PostgreSQL database...")
        engine = create_engine(db_url)
        df = pd.read_csv(master_path)
        
        # Load DDL first
        sql_file = project_root / "backend" / "sql" / "create_budget_table.sql"
        if sql_file.exists():
            with open(sql_file, "r", encoding="utf-8") as f:
                sql_script = f.read()
            with engine.connect() as conn:
                conn.execute(sql_script)
                conn.commit()
            print("Table schema created successfully via SQL script.")
            
        print(f"Importing {len(df)} rows into 'budget_records' table...")
        df.to_sql("budget_records", engine, if_exists="append", index=False, method="multi", chunksize=1000)
        print("IMPORT COMPLETE! Successfully loaded master_budget.csv into PostgreSQL.")
    except Exception as e:
        print(f"PostgreSQL connection/import error: {e}")
        print("Please check your PostgreSQL server status and environment configuration.")

if __name__ == "__main__":
    main()
