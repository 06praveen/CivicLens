-- ====================================================================
-- CivicLens PostgreSQL Database Schema Definition
-- Table: budget_records
-- Description: Master table storing standardized Indian Government Budget data
-- ====================================================================

-- Drop table if it exists (for clean migration)
DROP TABLE IF EXISTS budget_records CASCADE;

CREATE TABLE budget_records (
    record_id           BIGSERIAL PRIMARY KEY,
    financial_year      VARCHAR(10) NOT NULL,
    amount_stage        VARCHAR(30) NOT NULL,
    statement           VARCHAR(50),
    demand_no           VARCHAR(20),
    ministry_department VARCHAR(255),
    expenditure_category VARCHAR(255),
    category_number     VARCHAR(20),
    budget_item         TEXT NOT NULL,
    row_type            VARCHAR(50),
    budget_item_key     VARCHAR(255) NOT NULL,
    amount              NUMERIC(18, 2),
    revenue_amount      NUMERIC(18, 2),
    capital_amount      NUMERIC(18, 2),
    total_amount        NUMERIC(18, 2),
    unit                VARCHAR(20) DEFAULT '₹ Crore',
    source_file         VARCHAR(100) NOT NULL,
    source_row          INTEGER NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimal querying, cross-year comparison, and anomaly detection
CREATE INDEX idx_budget_records_fy ON budget_records (financial_year);
CREATE INDEX idx_budget_records_stage ON budget_records (amount_stage);
CREATE INDEX idx_budget_records_ministry ON budget_records (ministry_department);
CREATE INDEX idx_budget_records_item_key ON budget_records (budget_item_key);
CREATE INDEX idx_budget_records_fy_key ON budget_records (financial_year, budget_item_key);
CREATE INDEX idx_budget_records_statement ON budget_records (statement);
CREATE INDEX idx_budget_records_category ON budget_records (expenditure_category);

-- Comment explanations
COMMENT ON TABLE budget_records IS 'Master standardized records of Indian Budget data across financial years.';
COMMENT ON COLUMN budget_records.financial_year IS 'Target financial year (e.g. 2024-2025, 2023-2024).';
COMMENT ON COLUMN budget_records.amount_stage IS 'Metric stage: Actuals, Budget Estimates, or Revised Estimates.';
COMMENT ON COLUMN budget_records.budget_item_key IS 'Normalized deterministic key for cross-year entity tracking & anomaly detection.';
COMMENT ON COLUMN budget_records.unit IS 'Currency unit, default ₹ Crore.';
