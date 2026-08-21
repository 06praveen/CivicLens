/**
 * adapters.ts — Safe data adapter functions mapping FastAPI backend schemas
 * to existing frontend component prop structures.
 */

import type {
  BudgetRecordResponse,
  AnomalyRecord,
  BudgetSummaryResponse,
} from "./types";
import type { BudgetRecord, BudgetKPI } from "@/data/budgetData";
import type { Insight } from "@/data/insightsData";

/**
 * Maps backend BudgetRecordResponse to frontend BudgetRecord structure.
 */
export function adaptBudgetRecord(record: BudgetRecordResponse): BudgetRecord {
  const amount = record.total_amount ?? record.amount ?? 0;
  return {
    id: `R${record.record_id}`,
    department: record.ministry_department || "General / Unclassified",
    sector: record.expenditure_category || "Other Sector",
    scheme: record.budget_item,
    allocated: amount,
    prevYear: 0, // Calculated dynamically when comparison data available
    changePct: 0,
  };
}

/**
 * Maps backend AnomalyRecord to frontend Insight card structure for AI Insights page.
 */
export function adaptAnomalyToInsight(anomaly: AnomalyRecord, index: number): Insight {
  const isSpike = anomaly.anomaly_type === "spending_spike";
  const pctStr = anomaly.percentage_change !== null && anomaly.percentage_change !== undefined
    ? `${anomaly.percentage_change > 0 ? "+" : ""}${anomaly.percentage_change.toFixed(1)}%`
    : "N/A";

  const title = isSpike
    ? `${anomaly.budget_item} spending increased by ${pctStr}`
    : `${anomaly.budget_item} allocation fell by ${pctStr}`;

  const titleHi = isSpike
    ? `${anomaly.budget_item} खर्च में ${pctStr} की वृद्धि`
    : `${anomaly.budget_item} आवंटन में ${pctStr} की गिरावट`;

  const currAmtStr = anomaly.current_amount ? `₹${anomaly.current_amount.toLocaleString("en-IN")} Cr` : "N/A";
  const prevAmtStr = anomaly.previous_amount ? `₹${anomaly.previous_amount.toLocaleString("en-IN")} Cr` : "N/A";

  const body = `In ${anomaly.financial_year}, allocation for ${anomaly.budget_item} under ${anomaly.ministry_department || "Ministry"} changed from ${prevAmtStr} (${anomaly.previous_financial_year}) to ${currAmtStr} (${anomaly.financial_year}). Key threshold used: ${anomaly.threshold_used}%.`;

  const bodyHi = `${anomaly.financial_year} में, ${anomaly.ministry_department || "मंत्रालय"} के तहत ${anomaly.budget_item} का आवंटन ${prevAmtStr} (${anomaly.previous_financial_year}) से बदलकर ${currAmtStr} (${anomaly.financial_year}) हो गया।`;

  const evidence = `${anomaly.statement || "Union Budget Statement"} — ${anomaly.ministry_department || "Ministry"} (Key: ${anomaly.budget_item_key})`;

  return {
    id: `ANOM-${index}-${anomaly.budget_item_key}`,
    type: isSpike ? "increase" : "decrease",
    title,
    titleHi,
    body,
    bodyHi,
    stat: pctStr,
    statPositive: isSpike,
    sector: anomaly.expenditure_category || anomaly.ministry_department || "Budget Allocation",
    evidence,
    evidenceHi: evidence,
  };
}

/**
 * Formats backend BudgetSummaryResponse into frontend BudgetKPI cards.
 */
export function adaptSummaryToKPIs(summary: BudgetSummaryResponse): BudgetKPI[] {
  const tot = summary.total_budget || summary.total_amount || 0;
  const rev = summary.revenue_expenditure || 0;
  const cap = summary.capital_expenditure || 0;

  const fmtLakhCr = (val: number) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh Cr`;
    }
    return `₹${val.toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
  };

  return [
    {
      key: "total_budget",
      labelKey: "bag_total_budget",
      value: fmtLakhCr(tot),
      raw: tot,
      prevRaw: tot,
      unit: "₹ Crore",
    },
    {
      key: "revenue_expenditure",
      labelKey: "bag_revenue_exp",
      value: fmtLakhCr(rev),
      raw: rev,
      prevRaw: rev,
      unit: "₹ Crore",
    },
    {
      key: "capital_expenditure",
      labelKey: "bag_capital_exp",
      value: fmtLakhCr(cap),
      raw: cap,
      prevRaw: cap,
      unit: "₹ Crore",
    },
    {
      key: "department_count",
      labelKey: "Tracked Departments & Ministries",
      value: `${(summary.department_count || summary.unique_ministries).toLocaleString("en-IN")}`,
      raw: summary.department_count || summary.unique_ministries,
      prevRaw: summary.department_count || summary.unique_ministries,
      unit: "Ministries",
    },
    {
      key: "items_count",
      labelKey: "Tracked Schemes & Budget Items",
      value: `${(summary.items_count || summary.unique_budget_items).toLocaleString("en-IN")}`,
      raw: summary.items_count || summary.unique_budget_items,
      prevRaw: summary.items_count || summary.unique_budget_items,
      unit: "Items",
    },
    {
      key: "total_records",
      labelKey: "Total Database Records",
      value: `${summary.total_records.toLocaleString("en-IN")}`,
      raw: summary.total_records,
      prevRaw: summary.total_records,
      unit: "Records",
    },
  ];
}
