# CivicLens Data Pipeline Documentation

## 1. Source CSV Location & Discovery
- **Location**: `backend/data/processed/`
- **Discovery Method**: `prepare_budget_data.py` uses `pathlib` and `__file__` resolution to automatically discover the project root (`CivicLens/`) and locate the processed data directory independent of the active terminal CWD.
- **Source Files**:
  1. `2020-2021.csv` (3,071 source rows)
  2. `2021-2022.csv` (3,130 source rows)
  3. `2022-2023.csv` (382 source rows)
  4. `2023-2024.csv` (460 source rows)
  5. `2024-2025.csv` (386 source rows)

Total Raw Input Rows: **7,429 rows** across 5 files.

---

## 2. Source Data Structures & Comparison
Each yearly budget CSV file corresponds to an Indian Union Budget document and contains **12 numerical amount columns** organized into 4 quadruples of `(revenue, capital, total)` corresponding to 3 metric stages (`Actuals`, `Budget Estimates`, `Revised Estimates`) across 4 financial years:

- **`2020-2021.csv`**: Contains `actuals_2018_19`, `BE_2019_20`, `RE_2019_20`, `BE_2020_21`
- **`2021-2022.csv`**: Contains `actuals_2019_20`, `BE_2020_21`, `RE_2020_21`, `BE_2021_22`
- **`2022-2023.csv`**: Contains `actuals_2020_2021`, `BE_2021_2022`, `RE_2021_2022`, `BE_2022_2023`
- **`2023-2024.csv`**: Contains `actuals_2021_2022`, `BE_2022_2023`, `RE_2022_2023`, `BE_2023_2024`
- **`2024-2025.csv`**: Contains `actuals_2022_23`, `BE_2023_24`, `RE_2023_24`, `BE_2024_25`

### Text Column Variation:
- **`2020-2021` & `2021-2022`**: Use `row_label` containing line items, scheme descriptions, and embedded Ministry/Department headings.
- **`2022-2023` to `2024-2025`**: Use structured metadata headers: `statement`, `ministry_department`, `expenditure_category`, `category_number`, `demand_no`, `row_type`.

---

## 3. Standardization & Transformation Rules
The pipeline normalizes the wide yearly matrices into long, canonical observations:

1. **Text Normalization**:
   - Trim whitespace and collapse repeated internal spaces.
   - Strip leading item numbers (e.g. `1. `, `10. `) and arithmetic formulas (e.g. `(2+3+4)`).
   - Infer `ministry_department` in older files when `row_label` matches known Ministry names.
2. **Numeric Normalization**:
   - Strip commas and whitespace from numeric strings.
   - Convert valid numeric strings to floats without coercing invalid strings or empty values into dummy 0.0 values.
3. **Unpivoting (Wide to Long)**:
   - Each wide row is split into distinct metric stage records (`Actuals`, `Budget Estimates`, `Revised Estimates`) for each target `financial_year`.
   - Metric quadruples where all amount components are null are omitted.
4. **Source Traceability**:
   - Each record retains its original `source_file` name and 1-indexed `source_row` index.

---

## 4. Final Canonical Data Schema (`master_budget.csv`)

| Column Name | Data Type | Description |
|---|---|---|
| `record_id` | `BIGINT` | Unique sequential primary key (1, 2, 3, ...) |
| `financial_year` | `VARCHAR(10)` | Target financial year (e.g. `2024-2025`, `2020-2021`) |
| `amount_stage` | `VARCHAR(30)` | Stage: `Actuals`, `Budget Estimates`, or `Revised Estimates` |
| `statement` | `VARCHAR(50)` | Budget Statement (e.g. `Statement 1`, `Statement 3`) |
| `demand_no` | `VARCHAR(20)` | Demand Number if available |
| `ministry_department` | `VARCHAR(255)` | Official Ministry or Department name |
| `expenditure_category` | `VARCHAR(255)` | Expenditure category header |
| `category_number` | `VARCHAR(20)` | Category code/number |
| `budget_item` | `TEXT` | Detailed item description / label |
| `row_type` | `VARCHAR(50)` | Row classification (`ministry_total`, `category`, `other`) |
| `budget_item_key` | `VARCHAR(255)` | Deterministic cross-year matching key |
| `amount` | `NUMERIC(18,2)` | Total budget amount in ₹ Crore |
| `revenue_amount` | `NUMERIC(18,2)` | Revenue expenditure component in ₹ Crore |
| `capital_amount` | `NUMERIC(18,2)` | Capital expenditure component in ₹ Crore |
| `total_amount` | `NUMERIC(18,2)` | Total expenditure component in ₹ Crore |
| `unit` | `VARCHAR(20)` | Standard unit: `₹ Crore` |
| `source_file` | `VARCHAR(100)` | Name of original CSV file |
| `source_row` | `INTEGER` | 1-indexed row number in original source file |

---

## 5. Determination of `financial_year` & `budget_item_key`

- **`financial_year`**: Parsed dynamically from amount column headers (e.g. `actuals_2018_19` -> `2018-2019`, `BE_2024_25` -> `2024-2025`).
- **`budget_item_key`**: Deterministic key generated using:
  ```python
  key = ministry_department__expenditure_category__budget_item
  ```
  Normalized to lowercase, stripping special characters and converting non-alphanumeric characters to underscores.

---

## 6. How to Run & Regenerate Master Data

To run data preparation and validation:

```bash
# 1. Inspect source files
python backend/scripts/inspect_csv.py

# 2. Generate master_budget.csv
python backend/scripts/prepare_budget_data.py

# 3. Validate master_budget.csv
python backend/scripts/validate_master_data.py
```

Generated Master Dataset Location:
`backend/data/processed/master_budget.csv`

---

## 7. PostgreSQL Database Migration
- **DDL Script**: `backend/sql/create_budget_table.sql`
- **Import Script**: `backend/scripts/import_to_postgres.py`
- Sets up table `budget_records` with indexes on `financial_year`, `amount_stage`, `ministry_department`, and `budget_item_key`.
