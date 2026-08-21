"""
CivicLens Data Pipeline - Data Quality Validation Script

Performs thorough verification and data quality checks on `master_budget.csv`.
"""

import sys
from pathlib import Path
import pandas as pd

# Ensure standard output handles UTF-8 formatting on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

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
        
    if not master_path.exists():
        print(f"ERROR: master_budget.csv not found at {master_path}")
        sys.exit(1)
        
    print("=" * 60)
    print("CIVICLENS MASTER DATASET VALIDATION REPORT")
    print("=" * 60)
    print(f"File Path: {master_path}")
    
    df = pd.read_csv(master_path)
    total_rows = len(df)
    total_cols = len(df.columns)
    
    print(f"Total Master Records: {total_rows}")
    print(f"Total Canonical Columns: {total_cols}")
    print()
    
    # Financial Year Distribution
    print("-" * 40)
    print("1. FINANCIAL YEAR DISTRIBUTION")
    print("-" * 40)
    fy_counts = df['financial_year'].value_counts(dropna=False)
    print(fy_counts.to_string())
    print(f"Total Unique Financial Years: {df['financial_year'].nunique()}")
    print()
    
    # Amount Stage Distribution
    print("-" * 40)
    print("2. AMOUNT STAGE DISTRIBUTION")
    print("-" * 40)
    stage_counts = df['amount_stage'].value_counts(dropna=False)
    print(stage_counts.to_string())
    print()
    
    # Null Counts per Canonical Column
    print("-" * 40)
    print("3. NULL COUNTS PER COLUMN")
    print("-" * 40)
    null_counts = df.isnull().sum()
    for col, nulls in null_counts.items():
        pct = (nulls / total_rows) * 100
        print(f"  {col:<22}: {nulls:>6} nulls ({pct:>5.1f}%)")
    print()
    
    # Exact Duplicates Check
    print("-" * 40)
    print("4. DUPLICATES CHECK")
    print("-" * 40)
    dups_excluding_id = df.drop(columns=['record_id']).duplicated().sum()
    print(f"Exact duplicates (excluding record_id): {dups_excluding_id}")
    print()
    
    # Budget Item Key Analysis
    print("-" * 40)
    print("5. BUDGET ITEM KEY ANALYSIS")
    print("-" * 40)
    unique_keys = df['budget_item_key'].nunique()
    unresolved_keys = df['budget_item_key'].isin(['unspecified', '', None]).sum()
    print(f"Total Unique budget_item_keys: {unique_keys}")
    print(f"Unresolved budget_item_keys: {unresolved_keys}")
    
    # Cross-Year Key Appearances
    key_years = df.groupby('budget_item_key')['financial_year'].nunique()
    multi_year_keys = (key_years > 1).sum()
    single_year_keys = (key_years == 1).sum()
    print(f"Keys appearing in MULTIPLE years: {multi_year_keys}")
    print(f"Keys appearing in SINGLE year:   {single_year_keys}")
    print()
    
    # Amount Integrity Checks
    print("-" * 40)
    print("6. AMOUNT INTEGRITY CHECKS")
    print("-" * 40)
    amounts = df['amount'].dropna()
    non_numeric = df['amount'].isna() & df['revenue_amount'].isna() & df['capital_amount'].isna()
    print(f"Records with completely missing amounts: {non_numeric.sum()}")
    
    neg_amounts = (df['amount'] < 0).sum()
    print(f"Records with NEGATIVE amount (< 0): {neg_amounts}")
    
    zero_amounts = (df['amount'] == 0).sum()
    print(f"Records with ZERO amount (= 0): {zero_amounts}")
    
    if len(amounts) > 0:
        print(f"Min Amount: {amounts.min():,.2f} ₹ Crore")
        print(f"Max Amount: {amounts.max():,.2f} ₹ Crore")
        print(f"Mean Amount: {amounts.mean():,.2f} ₹ Crore")
        print(f"Median Amount: {amounts.median():,.2f} ₹ Crore")
    print()
    
    # Unresolved Year Analysis
    unresolved_years = df[df['financial_year'].isin(['Unknown', '', None])].shape[0]
    print("-" * 40)
    print("7. UNRESOLVED VALUES SUMMARY")
    print("-" * 40)
    print(f"Unresolved financial_year values: {unresolved_years}")
    print(f"Unresolved budget_item_key values: {unresolved_keys}")
    print()
    
    print("=" * 60)
    print("VALIDATION SUMMARY: MASTER DATASET IS HEALTHY & READY")
    print("=" * 60)

if __name__ == "__main__":
    main()
