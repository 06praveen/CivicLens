import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { getBudgetSummary } from "@/api/budgets";
import type { SectorAllocationItem, YoYTrendItem, BudgetSummaryResponse } from "@/api/types";

/**
 * Key Budget Summary Formatter (Strict Crore Rule):
 * Formats monetary amounts strictly in Crore (Cr) using Indian numbering system.
 * Takes original amount in Crore, formats with toLocaleString("en-IN"), adds "₹ " and " Cr".
 * Example: 4193157 -> "₹ 41,93,157 Cr"
 */
function formatCrore(crAmount: number | null | undefined): string {
  if (crAmount == null || isNaN(crAmount) || crAmount === 0) return "₹ 0 Cr";
  return `₹ ${Math.round(crAmount).toLocaleString("en-IN")} Cr`;
}

/**
 * Formatter for general tables and trend views.
 */
function formatCanonicalUnit(crAmount: number | null | undefined): string {
  if (crAmount == null || isNaN(crAmount) || crAmount === 0) return "N/A";
  const abs = Math.abs(crAmount);
  if (abs >= 100000) {
    return `₹ ${(crAmount / 100000).toFixed(2)} L`;
  }
  return `₹ ${Math.round(crAmount).toLocaleString("en-IN")} Cr`;
}

function SectionDivider() {
  return <div className="my-8 border-t border-rule" />;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2.5">
        <span className="h-5 w-1.5 rounded-full bg-saffron shrink-0" />
        <h2 className="text-lg font-black tracking-wider text-institutional uppercase sm:text-xl">{title}</h2>
      </div>
      {subtitle && <p className="mt-1 pl-4 text-xs font-semibold text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

// Clean Bar Chart with Category / Allocation / Share Table
function WhereAllocatedSection({ sectorAllocations, totalBudget }: { sectorAllocations: SectorAllocationItem[]; totalBudget: number }) {
  if (!sectorAllocations || sectorAllocations.length === 0) {
    return <p className="text-xs text-muted-foreground py-4 text-center">No category allocation data available for selected year.</p>;
  }

  const maxVal = Math.max(...sectorAllocations.map(s => s.amount), 1);

  return (
    <div className="space-y-6">
      {/* Visual Horizontal Bars */}
      <div className="space-y-3.5 bg-card border border-rule p-5 rounded-xs shadow-2xs">
        {sectorAllocations.map(item => (
          <div key={item.sector} className="flex items-center gap-3">
            <span className="w-52 shrink-0 text-right text-xs font-bold text-institutional truncate" title={item.sector}>
              {item.sector}
            </span>
            <div className="flex-1 h-5 bg-rule/60 rounded-xs overflow-hidden">
              <div
                className="h-full rounded-xs transition-all duration-700"
                style={{ width: `${Math.min((item.amount / maxVal) * 100, 100)}%`, background: item.color }}
              />
            </div>
            <span className="text-xs font-extrabold text-institutional w-36 shrink-0 font-mono">
              {formatCrore(item.amount)} ({item.pct.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>

      {/* Tabular Breakdown: Category | Allocation | Share */}
      <div className="border border-rule rounded-xs overflow-hidden bg-card shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-institutional text-white uppercase text-[11px] tracking-wider font-extrabold border-b border-rule">
              <th className="py-2.5 px-4">Expenditure Category</th>
              <th className="py-2.5 px-4 text-right">Recorded Allocation</th>
              <th className="py-2.5 px-4 text-right">Share of Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule font-medium">
            {sectorAllocations.map((item) => (
              <tr key={item.sector} className="hover:bg-institutional/5 transition-colors">
                <td className="py-2.5 px-4 font-bold text-institutional flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                  <span>{item.sector}</span>
                </td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                  {formatCrore(item.amount)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-saffron-dark">
                  {item.pct.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Clean Line / Bar YoY Trend Visualization
function YoYTrendSection({ yoyTrend }: { yoyTrend: YoYTrendItem[] }) {
  if (!yoyTrend || yoyTrend.length === 0) {
    return <p className="text-xs text-muted-foreground py-4 text-center">No trend data available.</p>;
  }

  const maxVal = Math.max(...yoyTrend.map(d => d.budget), 1);

  return (
    <div className="bg-card border border-rule p-5 rounded-xs shadow-2xs space-y-4">
      <div className="space-y-3">
        {yoyTrend.map(item => (
          <div key={item.year} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs font-bold text-institutional font-mono">
              {item.year}
            </span>
            <div className="flex-1 h-6 bg-rule/50 rounded-xs overflow-hidden flex items-center px-1">
              <div
                className="h-4 rounded-2xs bg-institutional transition-all duration-700"
                style={{ width: `${Math.min((item.budget / maxVal) * 100, 100)}%` }}
              />
            </div>
            <span className="w-40 shrink-0 text-right text-xs font-bold font-mono text-institutional">
              → {formatCrore(item.budget)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BudgetAtAGlance() {
  const { t } = useApp();
  const [selectedYear, setSelectedYear] = useState<string>("2024-2025");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [summaryData, setSummaryData] = useState<BudgetSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);

    getBudgetSummary({ financial_year: selectedYear })
      .then(summary => {
        if (summary && summary.total_budget && summary.total_budget > 0) {
          setSummaryData(summary);
          if (summary.available_financial_years && summary.available_financial_years.length > 0) {
            setAvailableYears(summary.available_financial_years);
          }
        } else {
          setErrorMsg("No validated summary data returned from CivicLens backend.");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Backend getBudgetSummary error:", err);
        setErrorMsg("Failed to fetch canonical budget overview from CivicLens backend.");
        setLoading(false);
      });
  }, [selectedYear]);

  // YoY Comparison Calculations
  const yoyList = summaryData?.yoy_trend || [];
  const activeYearIndex = yoyList.findIndex(y => y.year === selectedYear);
  const currentTrend = activeYearIndex >= 0 ? yoyList[activeYearIndex] : yoyList[yoyList.length - 1];
  const prevTrend = activeYearIndex > 0 ? yoyList[activeYearIndex - 1] : null;

  const currentBudget = currentTrend?.budget || summaryData?.total_budget || 0;
  const prevBudget = prevTrend?.budget || 0;
  const hasValidYoY = prevTrend !== null && prevBudget > 0;
  const yoyDiff = currentBudget - prevBudget;
  const yoyPct = hasValidYoY ? (yoyDiff / prevBudget) * 100 : 0;

  return (
    <PageLayout>
      <div className="portal-container pb-14">
        
        {/* ── HEADER SECTION ── */}
        <div className="border-b-4 border-saffron py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-institutional sm:text-3xl uppercase">
              BUDGET AT A GLANCE
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              Official Union Budget overview based on available CivicLens records
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-saffron-dark bg-saffron/10 px-2.5 py-0.5 rounded-xs border border-saffron/30">
                Latest Available Data: {summaryData?.financial_year || selectedYear}
              </span>
              <span className="text-muted-foreground font-medium">
                Source: Official budget records processed in CivicLens
              </span>
            </div>
          </div>

          {/* Financial Year Selector */}
          <div className="flex items-center gap-2 bg-card border border-rule p-3 rounded-xs shadow-2xs shrink-0">
            <label htmlFor="bag-fy-select" className="text-xs font-bold text-institutional uppercase tracking-wider whitespace-nowrap">
              Select Financial Year ▼
            </label>
            <select
              id="bag-fy-select"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="rounded-xs border border-rule bg-background px-3 py-1.5 text-xs font-bold text-institutional focus:outline-none focus:ring-2 focus:ring-institutional cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 p-4 rounded-xs bg-destructive/10 border border-destructive/30 text-xs font-bold text-destructive">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-institutional border-r-transparent" />
            <p className="text-xs font-bold text-muted-foreground">Validating canonical budget records from CivicLens PostgreSQL database...</p>
          </div>
        ) : (
          <>
            {/* ── KEY BUDGET SUMMARY ── */}
            <div className="mt-8">
              <SectionTitle title="KEY BUDGET SUMMARY" subtitle={`Macro spending figures for FY ${selectedYear}`} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                
                {/* Total Recorded Allocation */}
                <div className="bg-card border border-rule p-5 rounded-xs shadow-2xs">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Recorded Allocation</p>
                  <p className="mt-2 text-2xl sm:text-3xl font-black text-institutional font-mono">
                    {formatCrore(currentBudget)}
                  </p>
                </div>

                {/* Revenue Expenditure */}
                <div className="bg-card border border-rule p-5 rounded-xs shadow-2xs">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue Expenditure</p>
                  <p className="mt-2 text-2xl sm:text-3xl font-black text-saffron-dark font-mono">
                    {formatCrore(summaryData?.revenue_expenditure)}
                  </p>
                </div>

                {/* Capital Expenditure */}
                <div className="bg-card border border-rule p-5 rounded-xs shadow-2xs">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capital Expenditure</p>
                  <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                    {formatCrore(summaryData?.capital_expenditure)}
                  </p>
                </div>

                {/* Budget Categories Represented */}
                <div className="bg-card border border-rule p-5 rounded-xs shadow-2xs">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Budget Categories Represented</p>
                  <p className="mt-2 text-2xl sm:text-3xl font-black text-institutional font-mono">
                    {summaryData?.sector_allocations?.length || 0}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                    Canonical Budget Heads
                  </p>
                </div>

              </div>
            </div>

            <SectionDivider />

            {/* ── WHERE THE BUDGET IS ALLOCATED ── */}
            <div>
              <SectionTitle title="WHERE THE BUDGET IS ALLOCATED" subtitle="Expenditure Categories by Recorded Allocation" />
              <WhereAllocatedSection sectorAllocations={summaryData?.sector_allocations || []} totalBudget={currentBudget} />
            </div>

            <SectionDivider />

            {/* ── MAJOR DEPARTMENTS ── */}
            <div>
              <SectionTitle title="MAJOR DEPARTMENTS" subtitle="Top Departments by Recorded Allocation" />
              <div className="bg-card border border-rule rounded-xs p-5 shadow-2xs">
                {summaryData?.top_departments && summaryData.top_departments.length > 0 ? (
                  <ol className="space-y-3 divide-y divide-rule">
                    {summaryData.top_departments.map((dept, i) => (
                      <li key={dept.department} className="pt-3 first:pt-0 flex items-center justify-between gap-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-3 font-bold text-institutional min-w-0">
                          <span className="w-6 h-6 rounded-full bg-institutional text-white text-xs flex items-center justify-center font-black shrink-0">
                            {i + 1}
                          </span>
                          <span className="truncate" title={dept.department}>{dept.department}</span>
                        </div>
                        <span className="font-mono font-black text-institutional shrink-0 text-sm">
                          {formatCrore(dept.amount)}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-muted-foreground py-2 text-center">No department allocation data available for selected year.</p>
                )}
              </div>
            </div>

            <SectionDivider />

            {/* ── BUDGET TREND ── */}
            <div>
              <SectionTitle title="BUDGET TREND" subtitle="Total Recorded Allocation Across Available Financial Years" />
              <YoYTrendSection yoyTrend={yoyList} />
            </div>

            {/* ── YEAR-ON-YEAR CHANGE (Only show when comparison is valid) ── */}
            {hasValidYoY && (
              <>
                <SectionDivider />
                <div>
                  <SectionTitle title="YEAR-ON-YEAR CHANGE" subtitle={`Comparison between FY ${prevTrend.year} and FY ${selectedYear}`} />
                  <div className="bg-card border-2 border-saffron/40 p-6 rounded-xs shadow-2xs space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground font-semibold">Selected Year ({selectedYear}):</span>
                        <p className="text-base font-black text-institutional font-mono mt-0.5">{formatCrore(currentBudget)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold">Previous Available Year ({prevTrend.year}):</span>
                        <p className="text-base font-black text-institutional font-mono mt-0.5">{formatCrore(prevBudget)}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-rule flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-institutional">Net Change:</span>
                      <span className={`text-base sm:text-lg font-black font-mono px-3 py-1 rounded-xs ${
                        yoyDiff >= 0 
                          ? "bg-positive/10 text-positive border border-positive/30" 
                          : "bg-destructive/10 text-destructive border border-destructive/30"
                      }`}>
                        {yoyDiff >= 0 ? "+" : ""}{formatCrore(yoyDiff)} ({yoyDiff >= 0 ? "+" : ""}{yoyPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            <SectionDivider />

            {/* ── DATA NOTE ── */}
            <div className="bg-ivory border border-rule p-5 rounded-xs text-xs space-y-2 text-foreground/80 leading-relaxed">
              <p className="font-extrabold uppercase tracking-wider text-institutional">DATA NOTE</p>
              <p>
                Figures are calculated from official budget records available in the CivicLens database using validated aggregation rules designed to avoid double-counting hierarchical totals and subtotals.
              </p>
            </div>

          </>
        )}

      </div>
    </PageLayout>
  );
}
