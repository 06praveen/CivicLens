import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import {
  getAnomalies,
  getBudgetFilters,
  getBudgets,
  getItemTrend,
  triggerInvestigation,
} from "@/api/budgets";
import type {
  AnomalyRecord,
  BudgetRecordResponse,
  BudgetTrendResponse,
  InvestigationResponse,
} from "@/api/types";

/**
 * Single Currency Formatter (Crore Rule):
 * Formats monetary amounts strictly in Crore (Cr) using Indian numbering system.
 * Takes original amount in Crore, formats with toLocaleString("en-IN"), adds "₹ " and " Cr".
 * Example: 4193157 -> "₹ 41,93,157 Cr"
 */
function formatCrore(crAmount: number | null | undefined): string {
  if (crAmount == null || isNaN(crAmount) || crAmount === 0) return "₹ 0 Cr";
  return `₹ ${Math.round(crAmount).toLocaleString("en-IN")} Cr`;
}

// Year-by-Year Interactive SVG Graph Component (Only plots actual PostgreSQL data)
function HistoricalTrendChart({ trend }: { trend: BudgetTrendResponse["trend"] }) {
  if (!trend || trend.length === 0) {
    return <p className="text-xs text-muted-foreground py-6 text-center font-mono">No historical trend data recorded for this item.</p>;
  }

  const validTrend = trend.filter(t => t.amount != null && !isNaN(t.amount));
  if (validTrend.length === 0) {
    return <p className="text-xs text-muted-foreground py-6 text-center font-mono font-semibold">No valid numerical points available in database for this entity.</p>;
  }

  const maxVal = Math.max(...validTrend.map(t => t.amount ?? 0), 1);
  const chartH = 140;

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[500px]">
        <svg viewBox={`0 0 ${validTrend.length * 85 + 50} ${chartH + 50}`} className="w-full">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map(f => (
            <g key={f}>
              <line
                x1="40" y1={chartH - chartH * f}
                x2={validTrend.length * 85 + 40} y2={chartH - chartH * f}
                stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3"
              />
              <text x="35" y={chartH - chartH * f + 3} fontSize="8" textAnchor="end" fill="#94a3b8" className="font-mono">
                {formatCrore(maxVal * f)}
              </text>
            </g>
          ))}
          {/* Bars & Trend Points */}
          {validTrend.map((d, i) => {
            const amt = d.amount ?? 0;
            const barH = (amt / maxVal) * chartH;
            const x = 45 + i * 85;
            const isIncrease = (d.percentage_change ?? 0) >= 0;
            return (
              <g key={d.financial_year} className="group cursor-pointer">
                <rect
                  x={x}
                  y={chartH - barH}
                  width={34}
                  height={Math.max(barH, 3)}
                  fill={isIncrease ? "#1e3a8a" : "#be123c"}
                  rx="2"
                  className="transition-opacity hover:opacity-85"
                >
                  <title>{`${d.financial_year}: ₹${amt.toLocaleString("en-IN")} Cr (${d.percentage_change !== null && d.percentage_change !== undefined ? (d.percentage_change > 0 ? "+" : "") + d.percentage_change.toFixed(1) + "%" : "Baseline"})`}</title>
                </rect>
                <text x={x + 17} y={chartH + 16} fontSize="9" fontWeight="bold" textAnchor="middle" fill="#475569">
                  {d.financial_year}
                </text>
                <text x={x + 17} y={chartH - barH - 5} fontSize="8" fontWeight="bold" textAnchor="middle" fill="#1e3a8a" className="font-mono">
                  {formatCrore(amt)}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="flex gap-4 mt-2 text-[0.7rem] text-muted-foreground justify-center font-mono">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#1e3a8a] inline-block rounded-xs" />Outlay Increase</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#be123c] inline-block rounded-xs" />Outlay Reduction</span>
        </div>
      </div>
    </div>
  );
}

export default function AIInsights() {
  const { t } = useApp();

  // Department Selection State
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [availableMinistries, setAvailableMinistries] = useState<string[]>([]);
  const [departmentItems, setDepartmentItems] = useState<BudgetRecordResponse[]>([]);
  const [deptAnomalies, setDeptAnomalies] = useState<AnomalyRecord[]>([]);

  // Page Status State
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected Item Trend & AI Investigation Modal State
  const [activeItemKey, setActiveItemKey] = useState<string | null>(null);
  const [activeItemName, setActiveItemName] = useState<string>("");
  const [activeTrendData, setActiveTrendData] = useState<BudgetTrendResponse | null>(null);
  const [investigationData, setInvestigationData] = useState<InvestigationResponse | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  // Fetch available ministries on mount (Strict Canonical List)
  useEffect(() => {
    getBudgetFilters()
      .then(filters => {
        if (filters.ministries_departments && filters.ministries_departments.length > 0) {
          setAvailableMinistries(["All", ...filters.ministries_departments]);
        }
      })
      .catch(err => console.warn("Backend getBudgetFilters error:", err));
  }, []);

  // Fetch department records & high-confidence anomalies whenever department changes
  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);

    const deptParam = selectedDept !== "All" ? selectedDept : undefined;

    Promise.all([
      getBudgets({ ministry: deptParam, financial_year: "2024-2025", limit: 50 }),
      getAnomalies({ ministry_department: deptParam, threshold: 20, limit: 5 })
    ])
      .then(([budgetRes, anomalyRes]) => {
        setDepartmentItems(budgetRes.data);
        setDeptAnomalies(anomalyRes.data.slice(0, 5));
        setLoading(false);
      })
      .catch(err => {
        console.warn("Backend department data query error:", err);
        setErrorMsg("Failed to query department data from backend. Ensure FastAPI server is running.");
        setDepartmentItems([]);
        setDeptAnomalies([]);
        setLoading(false);
      });
  }, [selectedDept]);

  // Open Trend & AI Investigation Modal when item clicked
  const handleItemClick = (budgetItemKey: string, itemName: string, fy?: string) => {
    setActiveItemKey(budgetItemKey);
    setActiveItemName(itemName);
    setActiveTrendData(null);
    setInvestigationData(null);
    setModalLoading(true);

    const deptParam = selectedDept !== "All" ? selectedDept : undefined;

    Promise.all([
      getItemTrend(budgetItemKey, deptParam),
      triggerInvestigation({ budget_item_key: budgetItemKey, ministry_department: deptParam, financial_year: fy || "2024-2025", threshold: 20 })
    ])
      .then(([trendRes, invRes]) => {
        setActiveTrendData(trendRes);
        setInvestigationData(invRes);
        setModalLoading(false);
      })
      .catch(err => {
        console.warn("Item trend/investigation API error:", err);
        setModalLoading(false);
      });
  };

  // Department Overview Metrics
  const totalDeptOutlay = departmentItems.reduce((acc, r) => acc + (r.total_amount ?? r.amount ?? 0), 0);
  const highestItem = departmentItems.length > 0
    ? [...departmentItems].sort((a, b) => (b.total_amount ?? b.amount ?? 0) - (a.total_amount ?? a.amount ?? 0))[0]
    : null;

  return (
    <PageLayout>
      <div className="portal-container pb-14">
        {/* Page header */}
        <div className="border-b-4 border-saffron py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="label-caps text-saffron">Department AI Insights & Historical Analytics</p>
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">{t("ai_title")}</h1>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              AI-powered analysis based on official Union Budget records (FY 2024–2025)
            </p>
          </div>

          {/* Department Selector Dropdown (Canonical List Only) */}
          <div className="flex items-center gap-2 bg-card border border-rule px-3 py-2 rounded-xs shadow-xs">
            <label htmlFor="dept-ai-select" className="label-caps text-muted-foreground whitespace-nowrap">Ministry / Department:</label>
            <select
              id="dept-ai-select"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="rounded-xs border border-rule bg-background px-3 py-1 text-xs font-bold text-institutional focus:outline-none focus:ring-1 focus:ring-institutional max-w-xs truncate cursor-pointer"
            >
              <option value="All">All Ministries & Departments</option>
              {availableMinistries.filter(m => m !== "All").map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-xs text-xs font-semibold text-destructive">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-institutional border-r-transparent" />
            <p className="mt-3 text-xs font-semibold text-muted-foreground">Fetching canonical department records and evaluating spending changes from PostgreSQL...</p>
          </div>
        ) : (
          <>
            {/* Department Overview Banner */}
            <div className="mt-6 border border-rule bg-card p-5 rounded-xs shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="label-caps text-muted-foreground">Target Department</p>
                <p className="mt-1 text-sm font-bold text-institutional truncate">{selectedDept === "All" ? "All Union Ministries" : selectedDept}</p>
              </div>
              <div>
                <p className="label-caps text-muted-foreground">{selectedDept === "All" ? "Validated Departments" : "Department Outlay"}</p>
                <p className="mt-1 text-lg font-black text-institutional font-mono">
                  {selectedDept === "All" ? `${availableMinistries.length - 1} Entities` : formatCrore(totalDeptOutlay)}
                </p>
              </div>
              <div>
                <p className="label-caps text-muted-foreground">Tracked Budget Entities</p>
                <p className="mt-1 text-lg font-black text-institutional font-mono">{departmentItems.length} records</p>
              </div>
              <div>
                <p className="label-caps text-muted-foreground">Highest Recorded Allocation</p>
                <p className="mt-1 text-xs font-bold text-saffron-dark truncate">
                  {highestItem ? `${highestItem.budget_item} (${formatCrore(highestItem.total_amount ?? highestItem.amount ?? 0)})` : "N/A"}
                </p>
              </div>
            </div>

            {/* Significant Year-on-Year Spending Changes Section */}
            {deptAnomalies.length > 0 && (
              <div className="mt-6">
                <h2 className="text-base font-bold text-institutional flex items-center gap-2 mb-3 uppercase tracking-wider">
                  <span className="h-4 w-1.5 rounded-full bg-saffron" />
                  Significant Year-on-Year Spending Changes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deptAnomalies.map((anom, idx) => {
                    const isSpike = anom.anomaly_type === "spending_spike";
                    const isExtremePct = (anom.percentage_change ?? 0) > 500 || (anom.percentage_change ?? 0) < -500;
                    const confidenceLevel = anom.confidence_level || (isExtremePct ? "REQUIRES SOURCE REVIEW" : "HIGH CONFIDENCE");

                    return (
                      <div
                        key={idx}
                        onClick={() => handleItemClick(anom.budget_item_key, anom.budget_item || anom.budget_item_key, anom.financial_year)}
                        className={`rounded-xs bg-card border p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                          isSpike ? "border-l-4 border-l-positive border-rule" : "border-l-4 border-l-negative border-rule"
                        }`}
                      >
                        <div>
                          {/* Card Header & Badges */}
                          <div className="flex items-start justify-between gap-2 border-b border-rule pb-2.5">
                            <div>
                              <span className="label-caps text-muted-foreground text-[0.65rem] block">{anom.ministry_department || "Department"}</span>
                              <h3 className="font-extrabold text-institutional text-sm mt-0.5 leading-snug hover:underline">{anom.budget_item}</h3>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase ${
                                isSpike ? "bg-positive/10 text-positive" : "bg-destructive/10 text-destructive"
                              }`}>
                                {isSpike ? "Large Increase" : "Large Decrease"}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold ${
                                confidenceLevel === "HIGH CONFIDENCE" 
                                  ? "bg-positive/10 text-positive border border-positive/30"
                                  : confidenceLevel === "REQUIRES SOURCE REVIEW"
                                  ? "bg-saffron/15 text-saffron-dark border border-saffron/30"
                                  : "bg-muted text-muted-foreground border border-rule"
                              }`}>
                                {confidenceLevel}
                              </span>
                            </div>
                          </div>

                          {/* Primary Headline Wording */}
                          <p className="mt-3 text-xs font-bold text-foreground leading-relaxed">
                            {anom.status_wording || `Allocation ${isSpike ? "increased" : "decreased"} by ${formatCrore(Math.abs(anom.absolute_change || 0))} from ${formatCrore(anom.previous_amount)} in FY ${anom.previous_financial_year} to ${formatCrore(anom.current_amount)} in FY ${anom.financial_year}.`}
                          </p>

                          {/* Secondary Text (Step 11 Rule) */}
                          <div className="mt-2 text-[0.7rem] font-semibold text-muted-foreground">
                            {isExtremePct ? (
                              <span className="text-saffron-dark font-bold">⚠️ Large change detected — requires source review (YoY: {anom.percentage_change ? `${anom.percentage_change > 0 ? "+" : ""}${anom.percentage_change.toFixed(1)}%` : "N/A"})</span>
                            ) : (
                              <span>YoY Percentage Change: <strong className="font-mono font-bold text-institutional">{anom.percentage_change ? `${anom.percentage_change > 0 ? "+" : ""}${anom.percentage_change.toFixed(1)}%` : "N/A"}</strong></span>
                            )}
                          </div>
                        </div>

                        {/* Card Footer & Source Traceability (Step 15) */}
                        <div className="mt-4 pt-2.5 border-t border-rule space-y-1.5">
                          <div className="flex items-center justify-between text-[0.7rem]">
                            <span className="font-mono text-muted-foreground text-[0.65rem] truncate max-w-[200px]" title={anom.budget_item_key}>
                              Key: {anom.budget_item_key}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemClick(anom.budget_item_key, anom.budget_item || anom.budget_item_key, anom.financial_year);
                              }}
                              className="text-saffron-dark font-extrabold hover:underline flex items-center gap-1 shrink-0"
                            >
                              📊 View Historical Trend →
                            </button>
                          </div>
                          {anom.source_file && (
                            <p className="text-[0.65rem] font-mono text-muted-foreground/80 truncate">
                              📜 Source File: {anom.source_file} {anom.source_record_ids && anom.source_record_ids.length > 0 ? `(Record #${anom.source_record_ids.join(", #")})` : ""}
                            </p>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Department Budget Items Table */}
            <div className="mt-8">
              <h2 className="text-base font-bold text-institutional flex items-center gap-2 mb-3 uppercase tracking-wider">
                <span className="h-4 w-1.5 rounded-full bg-institutional" />
                Department Budget Items (Click item for Historical Graph)
              </h2>
              {departmentItems.length === 0 ? (
                <div className="border border-rule bg-card rounded-xs p-8 text-center text-xs text-muted-foreground font-semibold">
                  No breakdown items are available for this department in the processed records.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xs border border-rule shadow-xs">
                  <table className="min-w-full divide-y divide-rule bg-card text-sm">
                    <thead>
                      <tr className="bg-institutional/5">
                        <th className="px-4 py-3 text-left label-caps text-muted-foreground">Record ID</th>
                        <th className="px-4 py-3 text-left label-caps text-muted-foreground">Budget Item / Scheme</th>
                        <th className="px-4 py-3 text-left label-caps text-muted-foreground hidden sm:table-cell">Expenditure Category</th>
                        <th className="px-4 py-3 text-right label-caps text-muted-foreground">Latest Outlay</th>
                        <th className="px-4 py-3 text-center label-caps text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule">
                      {departmentItems.map(r => {
                        const amt = r.total_amount ?? r.amount ?? 0;
                        return (
                          <tr
                            key={r.record_id}
                            onClick={() => handleRecordClickItem(r)}
                            className="hover:bg-institutional/5 transition-colors cursor-pointer group"
                          >
                            <td className="px-4 py-3 text-xs font-mono text-muted-foreground">#{r.record_id}</td>
                            <td className="px-4 py-3 font-semibold text-institutional group-hover:underline">
                              {r.budget_item}
                            </td>
                            <td className="px-4 py-3 text-xs text-foreground/80 hidden sm:table-cell">
                              <span className="rounded-full bg-institutional/10 px-2 py-0.5 text-[0.65rem] font-semibold text-institutional">
                                {r.expenditure_category || "General"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-institutional font-mono">
                              {formatCrore(amt)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleItemClick(r.budget_item_key, r.budget_item, r.financial_year);
                                }}
                                className="px-2.5 py-1 bg-institutional/10 hover:bg-institutional hover:text-white text-institutional text-xs font-bold rounded-xs transition-colors"
                              >
                                📈 Historical Graph & AI →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal: Year-by-Year Historical Graph & Grounded AI Insight */}
        {activeItemKey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => setActiveItemKey(null)}>
            <div className="bg-card border-2 border-institutional rounded-sm max-w-3xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-5" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-start justify-between border-b border-rule pb-3">
                <div>
                  <span className="label-caps text-saffron font-mono">Item Key: {activeItemKey}</span>
                  <h2 className="text-xl font-bold text-institutional mt-1">{activeItemName}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Year-by-Year Budget Outlays & Grounded Agentic AI Analysis</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveItemKey(null)}
                  className="h-8 w-8 rounded-full border border-rule text-xs font-bold hover:bg-rule"
                >
                  ✕
                </button>
              </div>

              {modalLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground space-y-3">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-institutional border-t-transparent" />
                  <p className="font-semibold">Querying multi-year PostgreSQL historical trends & executing Agentic AI investigation...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Historical YoY Graph Section */}
                  <div>
                    <h3 className="label-caps text-institutional mb-3 flex items-center gap-2">
                      <span className="h-3 w-1 bg-saffron" />
                      Year-by-Year Budget Outlay Graph
                    </h3>
                    <div className="border border-rule bg-background p-4 rounded-xs shadow-xs">
                      {activeTrendData && activeTrendData.trend ? (
                        <HistoricalTrendChart trend={activeTrendData.trend} />
                      ) : (
                        <p className="text-xs text-muted-foreground py-4 text-center">No trend points available.</p>
                      )}
                    </div>
                  </div>

                  {/* Difference & Change Summary */}
                  {activeTrendData && activeTrendData.trend && activeTrendData.trend.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      {(() => {
                        const lastPt = activeTrendData.trend[activeTrendData.trend.length - 1];
                        const prevAmt = lastPt.previous_amount ?? 0;
                        const currAmt = lastPt.amount ?? 0;
                        const absDiff = lastPt.absolute_change ?? (currAmt - prevAmt);
                        const pctDiff = lastPt.percentage_change ?? (prevAmt > 0 ? ((currAmt - prevAmt) / prevAmt) * 100 : 0);

                        return (
                          <>
                            <div className="bg-institutional/5 p-3 rounded-xs border border-rule">
                              <p className="label-caps text-muted-foreground">Previous ({lastPt.previous_financial_year || "Prior Year"})</p>
                              <p className="text-sm font-bold text-foreground mt-0.5">{formatCrore(prevAmt)}</p>
                            </div>
                            <div className="bg-institutional/5 p-3 rounded-xs border border-rule">
                              <p className="label-caps text-muted-foreground">Latest ({lastPt.financial_year})</p>
                              <p className="text-sm font-bold text-institutional mt-0.5">{formatCrore(currAmt)}</p>
                            </div>
                            <div className="bg-institutional/5 p-3 rounded-xs border border-rule">
                              <p className="label-caps text-muted-foreground">Absolute Difference</p>
                              <p className={`text-sm font-bold mt-0.5 ${absDiff >= 0 ? "text-positive" : "text-negative"}`}>
                                {absDiff >= 0 ? "+" : ""}{formatCrore(absDiff)}
                              </p>
                            </div>
                            <div className="bg-institutional/5 p-3 rounded-xs border border-rule">
                              <p className="label-caps text-muted-foreground">YoY Change %</p>
                              <p className={`text-sm font-bold mt-0.5 ${pctDiff >= 0 ? "text-positive" : "text-negative"}`}>
                                {pctDiff >= 0 ? "+" : ""}{pctDiff.toFixed(1)}%
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Grounded Agentic AI Insight Section */}
                  {investigationData && (
                    <div className="space-y-3 border-t border-rule pt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="label-caps text-saffron">Grounded Agentic AI Analysis</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${
                          investigationData.explanation.confidence === "high" ? "bg-positive/10 text-positive" : "bg-saffron/10 text-saffron-dark"
                        }`}>
                          Confidence: {investigationData.explanation.confidence.toUpperCase()}
                        </span>
                      </div>

                      <div className="bg-background p-4 rounded-xs border border-rule text-xs leading-relaxed font-medium">
                        <p>{investigationData.explanation.summary}</p>
                      </div>

                      {/* Source Metadata */}
                      {investigationData.sources.length > 0 && (
                        <div className="bg-saffron/10 border border-saffron/30 p-3 rounded-xs text-[0.7rem] font-mono space-y-1">
                          <p className="font-bold text-institutional-dark label-caps">📜 Verified Source Records</p>
                          {investigationData.sources.map((src, si) => (
                            <p key={si}>Record #{src.record_id} — File: {src.source_file} (Row #{src.source_row})</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 text-right border-t border-rule">
                <button
                  type="button"
                  onClick={() => setActiveItemKey(null)}
                  className="px-4 py-2 bg-institutional text-white text-xs font-bold rounded-xs hover:bg-institutional-dark transition-colors"
                >
                  Close Graph & Insights
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );

  function handleRecordClickItem(record: BudgetRecordResponse) {
    handleItemClick(record.budget_item_key, record.budget_item, record.financial_year);
  }
}
