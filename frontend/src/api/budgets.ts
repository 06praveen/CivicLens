/**
 * budgets.ts — CivicLens API Service module connecting frontend components to FastAPI backend.
 */

import { fetchApi } from "./client";
import type {
  ApiHealthResponse,
  PaginatedBudgetResponse,
  BudgetRecordResponse,
  BudgetSummaryResponse,
  BudgetFiltersResponse,
  BudgetTrendResponse,
  BudgetComparisonResponse,
  PaginatedAnomalyResponse,
  ItemAnomalyHistoryResponse,
  InvestigationResponse,
  RAGSearchResponse,
  AssistantResponse,
} from "./types";

export async function checkHealth(): Promise<ApiHealthResponse> {
  return fetchApi<ApiHealthResponse>("/health");
}

export async function getBudgets(params: {
  financial_year?: string;
  ministry?: string;
  expenditure_category?: string;
  amount_stage?: string;
  statement?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedBudgetResponse> {
  const query = new URLSearchParams();
  if (params.financial_year) query.append("financial_year", params.financial_year);
  if (params.ministry) query.append("ministry", params.ministry);
  if (params.expenditure_category) query.append("expenditure_category", params.expenditure_category);
  if (params.amount_stage) query.append("amount_stage", params.amount_stage);
  if (params.statement) query.append("statement", params.statement);
  if (params.search) query.append("search", params.search);
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());

  const qs = query.toString();
  return fetchApi<PaginatedBudgetResponse>(`/api/budgets${qs ? "?" + qs : ""}`);
}

export async function getBudgetSummary(params: {
  financial_year?: string;
  amount_stage?: string;
} = {}): Promise<BudgetSummaryResponse> {
  const query = new URLSearchParams();
  if (params.financial_year && params.financial_year !== "All") query.append("financial_year", params.financial_year);
  if (params.amount_stage) query.append("amount_stage", params.amount_stage);
  const qs = query.toString();
  return fetchApi<BudgetSummaryResponse>(`/api/budgets/summary${qs ? "?" + qs : ""}`);
}

export async function getBudgetFilters(): Promise<BudgetFiltersResponse> {
  return fetchApi<BudgetFiltersResponse>("/api/budgets/filters");
}

export async function getBudgetDetail(recordId: number): Promise<BudgetRecordResponse> {
  return fetchApi<BudgetRecordResponse>(`/api/budgets/${recordId}`);
}

export async function getItemTrend(
  budgetItemKey: string,
  ministryDepartment?: string,
  amount_stage = "Budget Estimates",
  value_type = "amount"
): Promise<BudgetTrendResponse> {
  const params = new URLSearchParams({
    amount_stage,
    value_type,
  });
  if (ministryDepartment && ministryDepartment !== "All") {
    params.append("ministry_department", ministryDepartment);
  }
  return fetchApi<BudgetTrendResponse>(`/api/analysis/trends/${encodeURIComponent(budgetItemKey)}?${params.toString()}`);
}

export async function compareBudgetYears(params: {
  budget_item_key: string;
  year1: string;
  year2: string;
  amount_stage?: string;
  value_type?: string;
}): Promise<BudgetComparisonResponse> {
  const query = new URLSearchParams({
    budget_item_key: params.budget_item_key,
    year1: params.year1,
    year2: params.year2,
    amount_stage: params.amount_stage || "Budget Estimates",
    value_type: params.value_type || "amount",
  });
  return fetchApi<BudgetComparisonResponse>(`/api/analysis/compare?${query.toString()}`);
}

export async function getAnomalies(params: {
  threshold?: number;
  financial_year?: string;
  ministry_department?: string;
  expenditure_category?: string;
  amount_stage?: string;
  value_type?: string;
  anomaly_type?: "spending_spike" | "spending_drop";
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedAnomalyResponse> {
  const query = new URLSearchParams();
  if (params.threshold !== undefined) query.append("threshold", params.threshold.toString());
  if (params.financial_year) query.append("financial_year", params.financial_year);
  if (params.ministry_department) query.append("ministry_department", params.ministry_department);
  if (params.expenditure_category) query.append("expenditure_category", params.expenditure_category);
  if (params.amount_stage) query.append("amount_stage", params.amount_stage);
  if (params.value_type) query.append("value_type", params.value_type);
  if (params.anomaly_type) query.append("anomaly_type", params.anomaly_type);
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());

  const qs = query.toString();
  return fetchApi<PaginatedAnomalyResponse>(`/api/anomalies${qs ? "?" + qs : ""}`);
}

export async function getItemAnomalies(
  budgetItemKey: string,
  params: {
    amount_stage?: string;
    value_type?: string;
    threshold?: number;
  } = {}
): Promise<ItemAnomalyHistoryResponse> {
  const query = new URLSearchParams();
  if (params.amount_stage) query.append("amount_stage", params.amount_stage);
  if (params.value_type) query.append("value_type", params.value_type);
  if (params.threshold !== undefined) query.append("threshold", params.threshold.toString());

  const qs = query.toString();
  return fetchApi<ItemAnomalyHistoryResponse>(`/api/anomalies/${encodeURIComponent(budgetItemKey)}${qs ? "?" + qs : ""}`);
}

export async function triggerInvestigation(payload: {
  budget_item_key: string;
  ministry_department?: string;
  financial_year?: string;
  previous_financial_year?: string;
  amount_stage?: string;
  value_type?: string;
  threshold?: number;
}): Promise<InvestigationResponse> {
  return fetchApi<InvestigationResponse>("/api/investigations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getInvestigationByKey(
  budgetItemKey: string,
  params: {
    financial_year?: string;
    previous_financial_year?: string;
    amount_stage?: string;
    value_type?: string;
    threshold?: number;
  } = {}
): Promise<InvestigationResponse> {
  const query = new URLSearchParams();
  if (params.financial_year) query.append("financial_year", params.financial_year);
  if (params.previous_financial_year) query.append("previous_financial_year", params.previous_financial_year);
  if (params.amount_stage) query.append("amount_stage", params.amount_stage);
  if (params.value_type) query.append("value_type", params.value_type);
  if (params.threshold !== undefined) query.append("threshold", params.threshold.toString());

  const qs = query.toString();
  return fetchApi<InvestigationResponse>(`/api/investigations/${encodeURIComponent(budgetItemKey)}${qs ? "?" + qs : ""}`);
}

export async function searchRAG(
  queryStr: string,
  top_k = 5,
  financial_year?: string,
  document_type?: string
): Promise<RAGSearchResponse> {
  const query = new URLSearchParams({
    query: queryStr,
    top_k: top_k.toString(),
  });
  if (financial_year) query.append("financial_year", financial_year);
  if (document_type) query.append("document_type", document_type);

  return fetchApi<RAGSearchResponse>(`/api/rag/search?${query.toString()}`);
}

export async function askAssistant(payload: {
  question: string;
  financial_year?: string;
  top_k?: number;
  session_id?: string;
}): Promise<AssistantResponse> {
  const token = localStorage.getItem("civiclens_auth_token");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetchApi<AssistantResponse>("/api/assistant/ask", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function getAssistantHealth(): Promise<any> {
  return fetchApi<any>("/api/assistant/health");
}

export async function transcribeAudio(audioBlob: Blob, language: string = "en-IN"): Promise<{ transcript: string; provider?: string; error?: string }> {
  const ext = audioBlob.type.includes("mp4") ? "mp4" : audioBlob.type.includes("ogg") ? "ogg" : "webm";
  const formData = new FormData();
  formData.append("file", audioBlob, `speech.${ext}`);
  formData.append("language", language);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  const url = `${API_BASE}/api/voice/transcribe`;

  const token = localStorage.getItem("civiclens_auth_token");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: `Voice transcription failed (${res.status})` }));
    throw new Error(errorData.detail || `Voice transcription failed (${res.status})`);
  }

  return await res.json();
}

export async function getReportOptions(): Promise<{ financial_years: string[]; ministries_departments: string[]; categories: string[] }> {
  return fetchApi<{ financial_years: string[]; ministries_departments: string[]; categories: string[] }>("/api/reports/options");
}

export async function createIssueReport(payload: {
  issue_category: string;
  financial_year?: string;
  ministry_department?: string;
  budget_item?: string;
  issue_title: string;
  description: string;
  evidence_reference?: string;
  is_anonymous: boolean;
  declaration: boolean;
}): Promise<any> {
  const token = localStorage.getItem("civiclens_auth_token");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetchApi<any>("/api/reports", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function getMyReports(): Promise<any[]> {
  const token = localStorage.getItem("civiclens_auth_token");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetchApi<any[]>("/api/reports/my-reports", {
    headers,
  });
}

export async function getAdminReports(params: {
  status?: string;
  category?: string;
  financial_year?: string;
  priority?: string;
} = {}): Promise<any[]> {
  const token = localStorage.getItem("civiclens_auth_token");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.append("status", params.status);
  if (params.category) query.append("category", params.category);
  if (params.financial_year) query.append("financial_year", params.financial_year);
  if (params.priority) query.append("priority", params.priority);

  const qs = query.toString();
  return fetchApi<any[]>(`/api/admin/reports${qs ? "?" + qs : ""}`, {
    headers,
  });
}

export async function updateAdminReport(reportId: number, payload: {
  status?: string;
  priority?: string;
  admin_notes?: string;
}): Promise<any> {
  const token = localStorage.getItem("civiclens_auth_token");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetchApi<any>(`/api/admin/reports/${reportId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
}
