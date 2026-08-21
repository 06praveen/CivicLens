/**
 * types.ts — Frontend TypeScript interfaces matching CivicLens FastAPI Backend schemas.
 */

export interface ApiHealthResponse {
  status: "ok" | "degraded" | "error";
  service: string;
  database: {
    connected: boolean;
    message: string;
  };
}

export interface BudgetRecordResponse {
  record_id: int;
  financial_year: string;
  amount_stage: string;
  statement?: string | null;
  demand_no?: string | null;
  ministry_department?: string | null;
  expenditure_category?: string | null;
  category_number?: string | null;
  budget_item: string;
  row_type?: string | null;
  budget_item_key: string;
  amount?: number | null;
  revenue_amount?: number | null;
  capital_amount?: number | null;
  total_amount?: number | null;
  unit: string;
  source_file: string;
  source_row: number;
}

export interface PaginatedBudgetResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: BudgetRecordResponse[];
}

export interface SectorAllocationItem {
  sector: string;
  amount: number;
  pct: number;
  color: string;
}

export interface YoYTrendItem {
  year: string;
  budget: number;
  expenditure: number;
  capitalExp: number;
}

export interface BudgetSummaryResponse {
  financial_year?: string;
  total_records: number;
  unique_ministries: number;
  unique_categories: number;
  unique_budget_items: number;
  unique_item_keys: number;
  total_budget?: number | null;
  revenue_expenditure?: number | null;
  capital_expenditure?: number | null;
  department_count?: number | null;
  items_count?: number | null;
  available_financial_years: string[];
  available_amount_stages: string[];
  filtered_amount_stage?: string | null;
  total_amount?: number | null;
  sector_allocations?: SectorAllocationItem[];
  yoy_trend?: YoYTrendItem[];
  top_departments?: Array<{ department: string; amount: number }>;
}

export interface BudgetFiltersResponse {
  financial_years: string[];
  amount_stages: string[];
  ministries_departments: string[];
  expenditure_categories: string[];
  statements: string[];
}

export interface TrendPoint {
  financial_year: string;
  amount?: number | null;
  record_count: number;
  previous_financial_year?: string | null;
  previous_amount?: number | null;
  absolute_change?: number | null;
  percentage_change?: number | null;
}

export interface BudgetTrendResponse {
  budget_item_key: string;
  budget_item?: string | null;
  ministry_department?: string | null;
  amount_stage: string;
  value_type: string;
  unit: string;
  trend: TrendPoint[];
}

export interface BudgetComparisonResponse {
  budget_item_key: string;
  budget_item?: string | null;
  ministry_department?: string | null;
  amount_stage: string;
  value_type: string;
  unit: string;
  year1: string;
  year1_amount?: number | null;
  year2: string;
  year2_amount?: number | null;
  absolute_change?: number | null;
  percentage_change?: number | null;
  direction: "increase" | "decrease" | "no_change" | "unavailable";
}

export interface AnomalyRecord {
  budget_item_key: string;
  budget_item?: string | null;
  ministry_department?: string | null;
  expenditure_category?: string | null;
  statement?: string | null;
  financial_year: string;
  previous_financial_year: string;
  previous_amount?: number | null;
  current_amount?: number | null;
  absolute_change?: number | null;
  percentage_change?: number | null;
  anomaly_type: "spending_spike" | "spending_drop";
  threshold_used: number;
  amount_stage: string;
  value_type: string;
  unit: string;
  confidence_level?: "HIGH CONFIDENCE" | "REQUIRES SOURCE REVIEW" | "LIMITED HISTORICAL DATA";
  status_wording?: string | null;
  observation_years_count?: number;
  source_file?: string | null;
  source_record_ids?: number[];
}

export interface PaginatedAnomalyResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  threshold: number;
  amount_stage: string;
  value_type: string;
  data: AnomalyRecord[];
}

export interface ItemAnomalyHistoryResponse {
  budget_item_key: string;
  budget_item?: string | null;
  ministry_department?: string | null;
  amount_stage: string;
  value_type: string;
  unit: string;
  anomalies: AnomalyRecord[];
  trend: TrendPoint[];
}

export interface InvestigationStep {
  step: number;
  action: string;
  result: string;
  details?: Record<string, any> | null;
}

export interface InvestigationSource {
  record_id: number;
  source_file: string;
  source_row: number;
  statement?: string | null;
  demand_no?: string | null;
  ministry_department?: string | null;
  budget_item: string;
}

export interface InvestigationExplanation {
  summary: string;
  confidence: "high" | "medium" | "low";
  evidence_status: "directly_supported" | "pattern_observed" | "insufficient_evidence";
  key_findings: string[];
  ai_generated: boolean;
}

export interface InvestigationResponse {
  investigation_id: string;
  status: string;
  anomaly: Record<string, any>;
  investigation_steps: InvestigationStep[];
  explanation: InvestigationExplanation;
  sources: InvestigationSource[];
}

export interface DocumentChunk {
  chunk_id: string;
  text: string;
  document_name: string;
  source_file: string;
  document_type: string;
  financial_year: string;
  page_number: number;
  similarity_score?: number | null;
}

export interface RAGSearchResponse {
  query: string;
  total_results: number;
  results: DocumentChunk[];
}

export interface AssistantSource {
  source_type: "budget_record" | "government_document";
  record_id?: number | null;
  source_file?: string | null;
  source_row?: number | null;
  document_name?: string | null;
  page_number?: number | null;
  chunk_id?: string | null;
  statement?: string | null;
}

export interface AssistantOption {
  budget_item_key: string;
  budget_item: string;
  ministry_department?: string | null;
}

export interface AssistantResponse {
  answer: string;
  intent: string;
  confidence: "high" | "medium" | "low";
  budget_items: Record<string, any>[];
  data?: Record<string, any> | null;
  tools_used: string[];
  sources: AssistantSource[];
  evidence_status: "directly_supported" | "pattern_observed" | "insufficient_evidence" | "general_explanation";
  requires_clarification: boolean;
  options?: AssistantOption[] | null;
  ai_available: boolean;
  session_id?: string | null;
  source_indicator?: "verified_civiclens_data" | "budget_explanation" | "general_ai";
  source_indicator_label?: string;
}
