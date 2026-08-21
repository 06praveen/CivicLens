import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { COMPARISON_DATA } from "@/data/mockData";
import { FINANCIAL_YEARS, formatCr } from "@/data/budgetData";
import { compareBudgetYears, getBudgets } from "@/api/budgets";
import type { BudgetComparisonResponse } from "@/api/types";

export default function Compare() {
  const { t, lang } = useApp();
  const [selectedCompId, setSelectedCompId] = useState(COMPARISON_DATA[0].id);

  // Dynamic API comparison state
  const [budgetItemKey, setBudgetItemKey] = useState<string>("samagra_shiksha_abhiyan");
  const [itemInput, setItemInput] = useState<string>("samagra_shiksha_abhiyan");
  const [year1, setYear1] = useState<string>("2020-2021");
  const [year2, setYear2] = useState<string>("2024-2025");
  const [comparisonResult, setComparisonResult] = useState<BudgetComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Suggested budget item keys for quick selection
  const suggestedKeys = [
    { key: "samagra_shiksha_abhiyan", label: "Samagra Shiksha Abhiyan" },
    { key: "ayushman_bharat", label: "Ayushman Bharat" },
    { key: "national_health_mission", label: "National Health Mission" },
    { key: "pmgsy", label: "PMGSY Rural Roads" },
    { key: "mgnregs", label: "MGNREGS Employment" },
  ];

  // Execute comparison call
  const runComparison = (keyToUse = budgetItemKey) => {
    setLoading(true);
    setErrorMsg(null);
    compareBudgetYears({
      budget_item_key: keyToUse,
      year1,
      year2,
      amount_stage: "Budget Estimates",
      value_type: "amount",
    })
      .then(res => {
        setComparisonResult(res);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Backend comparison unavailable:", err);
        setErrorMsg(`Unable to load comparison for '${keyToUse}' between ${year1} and ${year2}. Ensure backend database is populated.`);
        setLoading(false);
      });
  };

  useEffect(() => {
    runComparison(budgetItemKey);
  }, [budgetItemKey, year1, year2]);

  const activeComp = COMPARISON_DATA.find(c => c.id === selectedCompId) || COMPARISON_DATA[0];
  const maxVal = Math.max(...activeComp.data.map(d => d.amountCr));

  return (
    <PageLayout>
      <div className="portal-container pb-14">
        {/* Header */}
        <div className="border-b-4 border-saffron py-6">
          <p className="label-caps text-saffron">Cross-Year & Sector Analysis</p>
          <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">
            {t("compare_title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("compare_subtitle")}</p>
        </div>

        {/* Live Backend YoY Item Comparison Tool */}
        <div className="mt-6 border-2 border-institutional/30 bg-card p-6 rounded-xs shadow-sm">
          <h2 className="text-base font-bold text-institutional mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-positive animate-pulse" />
            Live Budget Item YoY Comparison (FastAPI Backend)
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Select or enter a `budget_item_key` to calculate deterministic year-over-year percentage and absolute change across financial years.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="label-caps text-muted-foreground block mb-1">Budget Item Key</label>
              <input
                type="text"
                value={itemInput}
                onChange={e => setItemInput(e.target.value)}
                onBlur={() => setBudgetItemKey(itemInput)}
                placeholder="e.g. samagra_shiksha_abhiyan"
                className="w-full rounded-xs border border-rule bg-background p-2 text-xs font-mono text-institutional"
              />
            </div>
            <div>
              <label className="label-caps text-muted-foreground block mb-1">Year 1 (Baseline)</label>
              <select
                value={year1}
                onChange={e => setYear1(e.target.value)}
                className="w-full rounded-xs border border-rule bg-background p-2 text-xs font-semibold text-institutional"
              >
                {["2020-2021", "2021-2022", "2022-2023", "2023-2024", "2024-2025"].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-caps text-muted-foreground block mb-1">Year 2 (Comparison)</label>
              <select
                value={year2}
                onChange={e => setYear2(e.target.value)}
                className="w-full rounded-xs border border-rule bg-background p-2 text-xs font-semibold text-institutional"
              >
                {["2021-2022", "2022-2023", "2023-2024", "2024-2025"].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Keys */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <span className="text-[0.65rem] label-caps text-muted-foreground">Quick select:</span>
            {suggestedKeys.map(k => (
              <button
                key={k.key}
                type="button"
                onClick={() => {
                  setItemInput(k.key);
                  setBudgetItemKey(k.key);
                }}
                className={`px-2 py-0.5 text-[0.68rem] rounded-xs font-mono transition-colors border ${
                  budgetItemKey === k.key
                    ? "bg-institutional text-white border-institutional font-bold"
                    : "bg-background border-rule text-foreground hover:bg-institutional/10"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          {/* Comparison Output */}
          {loading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-institutional border-t-transparent mb-1" />
              <p>Computing deterministic YoY comparison...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-3 bg-saffron/10 border border-saffron/30 rounded-xs text-xs text-institutional-dark">
              {errorMsg}
            </div>
          ) : comparisonResult ? (
            <div className="bg-institutional/5 border border-rule p-4 rounded-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-rule pb-3 gap-2">
                <div>
                  <h3 className="font-bold text-institutional text-sm">
                    {comparisonResult.budget_item || comparisonResult.budget_item_key}
                  </h3>
                  <p className="text-xs text-muted-foreground">{comparisonResult.ministry_department || "Government of India"}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-xs text-xs font-bold ${
                    comparisonResult.direction === "increase" ? "bg-positive/10 text-positive" :
                    comparisonResult.direction === "decrease" ? "bg-negative/10 text-negative" :
                    "bg-rule text-muted-foreground"
                  }`}>
                    {comparisonResult.direction.toUpperCase()} ({comparisonResult.percentage_change !== null ? `${comparisonResult.percentage_change > 0 ? "+" : ""}${comparisonResult.percentage_change.toFixed(1)}%` : "N/A"})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-center">
                <div className="border-r border-rule pr-2">
                  <p className="text-[0.65rem] label-caps text-muted-foreground">{comparisonResult.year1}</p>
                  <p className="text-sm font-bold text-institutional">
                    {comparisonResult.year1_amount !== null ? formatCr(comparisonResult.year1_amount) : "N/A"}
                  </p>
                </div>
                <div className="border-r border-rule pr-2">
                  <p className="text-[0.65rem] label-caps text-muted-foreground">{comparisonResult.year2}</p>
                  <p className="text-sm font-bold text-institutional">
                    {comparisonResult.year2_amount !== null ? formatCr(comparisonResult.year2_amount) : "N/A"}
                  </p>
                </div>
                <div className="border-r border-rule pr-2">
                  <p className="text-[0.65rem] label-caps text-muted-foreground">Absolute Change</p>
                  <p className={`text-sm font-bold ${(comparisonResult.absolute_change || 0) >= 0 ? "text-positive" : "text-negative"}`}>
                    {comparisonResult.absolute_change !== null ? formatCr(Math.abs(comparisonResult.absolute_change)) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[0.65rem] label-caps text-muted-foreground">Percentage Change</p>
                  <p className={`text-sm font-bold ${(comparisonResult.percentage_change || 0) >= 0 ? "text-positive" : "text-negative"}`}>
                    {comparisonResult.percentage_change !== null ? `${comparisonResult.percentage_change.toFixed(1)}%` : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Category Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-rule pb-3">
          {COMPARISON_DATA.map(comp => (
            <button
              key={comp.id}
              onClick={() => setSelectedCompId(comp.id)}
              className={`px-4 py-2 text-xs font-bold tracking-wide rounded-xs transition-colors ${
                selectedCompId === comp.id
                  ? "bg-institutional text-white shadow-xs"
                  : "bg-card text-institutional hover:bg-institutional/10 border border-rule"
              }`}
            >
              {lang === "hi" ? comp.categoryHi : comp.category}
            </button>
          ))}
        </div>

        {/* Comparison Visual Chart */}
        <div className="mt-6 border border-rule bg-card p-6 rounded-xs shadow-xs">
          <h2 className="text-base font-bold text-institutional mb-4">
            {lang === "hi" ? activeComp.categoryHi : activeComp.category}
          </h2>

          <div className="space-y-4">
            {activeComp.data.map((d, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-institutional">
                  <span>{d.region}</span>
                  <span className="font-mono">{formatCr(d.amountCr)} ({d.pctShare}% of State Budget)</span>
                </div>
                <div className="h-6 w-full bg-rule/50 rounded-xs overflow-hidden flex">
                  <div
                    className="h-full bg-saffron transition-all duration-700 rounded-xs flex items-center justify-end pr-2 text-[0.65rem] font-bold text-institutional-dark"
                    style={{ width: `${(d.amountCr / maxVal) * 100}%` }}
                  >
                    {d.pctShare}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Plain Language Summary */}
          <div className="mt-6 rounded-xs bg-institutional/5 border border-rule p-4">
            <p className="label-caps text-saffron mb-1">What does this mean?</p>
            <p className="text-sm text-foreground/90 leading-relaxed font-medium">
              {lang === "hi" ? activeComp.explanationHi : activeComp.explanation}
            </p>
          </div>

          {/* Source Transparency */}
          <div className="mt-4 flex items-center justify-between border-t border-rule pt-3 text-xs text-muted-foreground">
            <span>Source: <strong>{activeComp.officialSource}</strong></span>
            <span className="rounded-full bg-white px-2 py-0.5 border border-rule font-mono text-[0.65rem]">
              Official Data
            </span>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

