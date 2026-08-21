import os
import re
from pathlib import Path
import pandas as pd

def find_project_root() -> Path:
    # Resolve from current script location
    script_path = Path(__file__).resolve()
    current = script_path.parent
    
    # Traverse up looking for CivicLens root or backend directory
    while current != current.parent:
        if current.name == "CivicLens" or (current / "backend").exists():
            return current
        current = current.parent
        
    # Fallback to 2 levels up from script (backend/scripts -> CivicLens)
    return script_path.parent.parent.parent

def locate_csv_files(project_root: Path):
    searched_folders = []
    
    # Priority candidate directories
    candidates = [
        project_root / "backend" / "data" / "processed",
        project_root / "data" / "processed",
        project_root / "backend" / "data",
        project_root / "data",
    ]
    
    for candidate in candidates:
        if candidate.exists() and candidate.is_dir():
            searched_folders.append(str(candidate))
            csvs = sorted(list(candidate.glob("*.csv")))
            if csvs:
                return csvs, searched_folders

    # Fallback: recursive search excluding virtual environments and build dirs
    exclude_dirs = {"venv", ".venv", "env", "node_modules", ".git", "__pycache__", ".pytest_cache"}
    csvs = []
    
    for root, dirs, files in os.walk(project_root):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        searched_folders.append(root)
        for file in files:
            if file.endswith(".csv"):
                csvs.append(Path(root) / file)
                
    csvs = sorted(csvs)
    return csvs, searched_folders

def main():
    project_root = find_project_root()
    csv_files, searched_folders = locate_csv_files(project_root)
    
    print("=" * 50)
    print("CIVICLENS DATA INSPECTION")
    print("=" * 50)
    print()
    print(f"Project root: {project_root}")
    print(f"CSV files found: {len(csv_files)}")
    print()
    
    if csv_files:
        for idx, path in enumerate(csv_files, 1):
            print(f"{idx}. {path}")
    else:
        print("No CSV files found. Folders searched:")
        for folder in searched_folders:
            print(f" - {folder}")
    print()
    
    inspect_results = []
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
    
    for file_path in csv_files:
        print("=" * 50)
        print(f"FILE: {file_path.name}")
        print(f"PATH: {file_path}")
        print("=" * 50)
        print()
        
        df = None
        read_error = None
        used_encoding = None
        
        for enc in encodings:
            try:
                df = pd.read_csv(file_path, encoding=enc)
                used_encoding = enc
                break
            except Exception as e:
                read_error = e
                
        if df is None:
            print(f"Failed to read file with tested encodings ({', '.join(encodings)}). Error: {read_error}")
            print()
            continue
            
        print("SHAPE:")
        print(f"({df.shape[0]}, {df.shape[1]})")
        print()
        
        print("COLUMNS:")
        print(list(df.columns))
        print()
        
        print("FIRST 5 ROWS:")
        print(df.head())
        print()
        
        print("DATA TYPES:")
        print(df.dtypes)
        print()
        
        print("MISSING VALUES:")
        print(df.isnull().sum())
        print()
        
        inspect_results.append({
            "filename": file_path.name,
            "path": file_path,
            "df": df,
            "rows": df.shape[0],
            "cols": df.shape[1],
            "columns": list(df.columns),
            "encoding": used_encoding
        })
        
    # Dataset Comparison Summary
    print("=" * 50)
    print("DATASET COMPARISON SUMMARY")
    print("=" * 50)
    print()
    
    if not inspect_results:
        print("No dataset comparison possible as no files were successfully read.")
        return
        
    for res in inspect_results:
        print(f"File: {res['filename']}")
        print(f"  - Row count: {res['rows']}")
        print(f"  - Column count: {res['cols']}")
        print(f"  - Exact column names: {res['columns']}")
        print()
        
    all_col_sets = [set(res["columns"]) for res in inspect_results]
    
    common_columns = set.intersection(*all_col_sets) if all_col_sets else set()
    all_columns = set.union(*all_col_sets) if all_col_sets else set()
    different_columns = all_columns - common_columns
    
    print("COLUMN COMPARISON:")
    print(f"Common columns across all {len(inspect_results)} files ({len(common_columns)}):")
    print(sorted(list(common_columns)))
    print()
    
    print(f"Columns that differ across files ({len(different_columns)}):")
    print(sorted(list(different_columns)))
    print()
    
    # Check if schemas are identical
    identical_schema = all(res["columns"] == inspect_results[0]["columns"] for res in inspect_results)
    print("CAN DATASETS BE DIRECTLY MERGED?:")
    if identical_schema:
        print("YES. All files have identical column names and ordering.")
    elif common_columns:
        print("PARTIALLY. Files share common columns, but column names or counts vary across files.")
    else:
        print("NO. Files do not share common columns.")
    print()
    
    # Year analysis
    year_in_data_analysis = []
    for res in inspect_results:
        df = res["df"]
        # Check column names for year keywords
        year_cols = [c for c in df.columns if re.search(r'year|fy|period|date|budget', str(c), re.IGNORECASE)]
        
        # Check cell values for year patterns like 2020, 2021, 2020-21, 2020-2021
        year_values_found = False
        sample_str = df.astype(str).head(100).to_string()
        if re.search(r'\b(201\d|202\d)(-\d{2,4})?\b', sample_str):
            year_values_found = True
            
        year_in_data_analysis.append({
            "filename": res["filename"],
            "year_cols": year_cols,
            "year_values_found": year_values_found
        })
        
    print("YEAR LOCATION ANALYSIS:")
    for yr_info in year_in_data_analysis:
        status_col = f"Columns matching year keywords: {yr_info['year_cols']}" if yr_info['year_cols'] else "No explicit year column name."
        val_status = "Year-like numeric/string patterns detected in data values." if yr_info['year_values_found'] else "No explicit year patterns detected in sample data values."
        print(f"- {yr_info['filename']}:")
        print(f"    {status_col}")
        print(f"    {val_status}")
    print()
    
    print("SUMMARY CONCLUSION ON YEAR:")
    all_has_year_col = all(yr['year_cols'] for yr in year_in_data_analysis)
    if all_has_year_col:
        print("Year information is explicitly present inside the data column(s).")
    else:
        print("Year is primarily represented by the filename (e.g. 2020-2021.csv). A year/financial_year column should be added during ingestion/merging.")

if __name__ == "__main__":
    main()