"""
CivicLens Data Pipeline - Budget Data Preparation & Normalization Script

Transforms raw/processed yearly Indian Budget CSV files into a clean,
validated, canonical dataset (`master_budget.csv`) ready for PostgreSQL.
"""

import os
import re
import numpy as np
import pandas as pd
from pathlib import Path

def find_project_root() -> Path:
    script_path = Path(__file__).resolve()
    current = script_path.parent
    while current != current.parent:
        if current.name == "CivicLens" or (current / "backend").exists():
            return current
        current = current.parent
    return script_path.parent.parent.parent

def locate_source_csvs(project_root: Path):
    candidates = [
        project_root / "backend" / "data" / "processed",
        project_root / "data" / "processed",
    ]
    for cand in candidates:
        if cand.exists() and cand.is_dir():
            csvs = [f for f in cand.glob("*.csv") if f.name != "master_budget.csv"]
            if csvs:
                return sorted(csvs), cand
                
    # Fallback recursive search
    exclude = {"venv", ".venv", "env", "node_modules", ".git", "__pycache__"}
    csvs = []
    found_dir = project_root / "backend" / "data" / "processed"
    for root, dirs, files in os.walk(project_root):
        dirs[:] = [d for d in dirs if d not in exclude]
        for f in files:
            if f.endswith(".csv") and f != "master_budget.csv":
                csvs.append(Path(root) / f)
    return sorted(csvs), found_dir

def clean_text(val):
    if pd.isna(val) or val is None:
        return None
    s = str(val).strip()
    s = re.sub(r'\s+', ' ', s)
    return s if s else None

def parse_num(val):
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val) if not np.isnan(val) else None
    s = str(val).strip().replace(',', '')
    if s == '' or s == '-' or s.lower() == 'nan' or s.lower() == 'null':
        return None
    try:
        return float(s)
    except ValueError:
        return None

def clean_label(text):
    if not isinstance(text, str):
        return ''
    # Remove leading numbers like "1. ", "10. ", "1) "
    text = re.sub(r'^\d+[\.\)]\s*', '', text.strip())
    # Remove trailing arithmetic formulas like "(2+3+4)"
    text = re.sub(r'\s*\(\d+[\+\d+]*\)', '', text)
    return text.strip()

def make_budget_item_key(ministry: str, category: str, item: str) -> str:
    parts = []
    for p in [ministry, category, item]:
        if p:
            c = clean_label(p).lower()
            c = re.sub(r'[^a-z0-9]+', '_', c).strip('_')
            if c and c not in parts:
                parts.append(c)
    return '__'.join(parts) if parts else 'unspecified'

def parse_col_year_stage(col_name: str):
    col_lower = col_name.lower()
    stage = None
    if 'actual' in col_lower:
        stage = 'Actuals'
    elif col_name.startswith('BE_') or 'be_' in col_lower:
        stage = 'Budget Estimates'
    elif col_name.startswith('RE_') or 're_' in col_lower:
        stage = 'Revised Estimates'
    else:
        return None, None, None

    head = None
    if 'revenue' in col_lower:
        head = 'revenue'
    elif 'capital' in col_lower:
        head = 'capital'
    elif 'total' in col_lower:
        head = 'total'
    else:
        return None, None, None
        
    m = re.search(r'(\d{2,4})_(\d{2,4})', col_name)
    if m:
        y1, y2 = m.group(1), m.group(2)
        if len(y1) == 2: y1 = '20' + y1
        if len(y2) == 2: y2 = '20' + y2
        fy = f'{y1}-{y2}'
    else:
        fy = 'Unknown'
        
    return fy, stage, head

def main():
    project_root = find_project_root()
    source_csvs, target_dir = locate_source_csvs(project_root)
    
    print("=" * 60)
    print("CIVICLENS BUDGET DATA PREPARATION PIPELINE")
    print("=" * 60)
    print(f"Project root: {project_root}")
    print(f"Source files directory: {target_dir}")
    print(f"Source files found ({len(source_csvs)}):")
    for f in source_csvs:
        print(f"  - {f.name}")
    print()

    # Pre-pass: Discover reference Ministries from newer statements (2022-2025)
    known_ministries = set()
    for year_file in source_csvs:
        if year_file.name in ['2022-2023.csv', '2023-2024.csv', '2024-2025.csv']:
            df_temp = pd.read_csv(year_file)
            if 'ministry_department' in df_temp.columns:
                for m in df_temp['ministry_department'].dropna():
                    cl = clean_text(m)
                    if cl:
                        known_ministries.add(cl)
                        
    records = []
    total_source_rows = 0
    
    for file_path in source_csvs:
        df = pd.read_csv(file_path)
        total_source_rows += len(df)
        print(f"Processing {file_path.name}: {len(df)} rows...")
        
        # Map metric columns
        metric_groups = {}
        for col in df.columns:
            fy, stage, head = parse_col_year_stage(col)
            if fy:
                metric_groups.setdefault((fy, stage), {})[head] = col
                
        for row_idx, row in df.iterrows():
            source_row = row_idx + 1
            statement = clean_text(row.get('statement'))
            demand_no = clean_text(row.get('demand_no'))
            category_number = clean_text(row.get('category_number'))
            row_type = clean_text(row.get('row_type'))
            expenditure_category = clean_text(row.get('expenditure_category'))
            ministry_department = clean_text(row.get('ministry_department'))
            row_label = clean_text(row.get('row_label'))
            
            # Infer Ministry in older files if label matches or contains ministry/dept keywords
            if not ministry_department and row_label:
                cleaned_lbl = clean_label(row_label)
                if (cleaned_lbl in known_ministries or 
                    'department' in cleaned_lbl.lower() or 
                    'ministry' in cleaned_lbl.lower()):
                    ministry_department = cleaned_lbl
                budget_item = row_label
            else:
                budget_item = expenditure_category or ministry_department or row_label or 'Unspecified Item'
                
            item_key = make_budget_item_key(ministry_department, expenditure_category, budget_item)
            
            # Unpivot metric quadruples
            for (fy, stage), heads in metric_groups.items():
                rev_val = parse_num(row.get(heads.get('revenue')))
                cap_val = parse_num(row.get(heads.get('capital')))
                tot_val = parse_num(row.get(heads.get('total')))
                
                # Skip metric tuples that have no amount values
                if rev_val is None and cap_val is None and tot_val is None:
                    continue
                    
                amount = tot_val if tot_val is not None else (
                    (rev_val or 0.0) + (cap_val or 0.0) if (rev_val is not None or cap_val is not None) else None
                )
                
                records.append({
                    'financial_year': fy,
                    'amount_stage': stage,
                    'statement': statement,
                    'demand_no': demand_no,
                    'ministry_department': ministry_department,
                    'expenditure_category': expenditure_category,
                    'category_number': category_number,
                    'budget_item': budget_item,
                    'row_type': row_type,
                    'budget_item_key': item_key,
                    'amount': amount,
                    'revenue_amount': rev_val,
                    'capital_amount': cap_val,
                    'total_amount': tot_val,
                    'unit': '₹ Crore',
                    'source_file': file_path.name,
                    'source_row': source_row
                })
                
    master_df = pd.DataFrame(records)
    
    # Deduplicate exact duplicate rows
    initial_count = len(master_df)
    dedup_cols = [c for c in master_df.columns if c != 'record_id']
    master_df.drop_duplicates(subset=dedup_cols, inplace=True)
    master_df.reset_index(drop=True, inplace=True)
    master_df.insert(0, 'record_id', master_df.index + 1)
    
    deduped_count = len(master_df)
    print()
    print(f"Source Rows Processed: {total_source_rows}")
    print(f"Canonical Records Generated: {initial_count}")
    print(f"Duplicates Removed: {initial_count - deduped_count}")
    print(f"Final Master Dataset Records: {deduped_count}")
    
    # Save master dataset
    output_path = target_dir / "master_budget.csv"
    master_df.to_csv(output_path, index=False, encoding='utf-8')
    print(f"\nSUCCESS: Master budget dataset written to:")
    print(f"  {output_path}")
    print("=" * 60)

if __name__ == "__main__":
    main()
