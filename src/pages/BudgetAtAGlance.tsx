import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import {
  BUDGET_KPIS,
  SECTOR_ALLOCATIONS,
  YOY_DATA,
  FINANCIAL_YEARS,
  formatCr,
  pctChange,
} from "@/data/budgetData";

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b-2 border-institutional/20 pb-3 pt-4">
      <div className="flex items-center gap-2.5">
        <span className="h-5 w-1.5 rounded-full bg-saffron" />
        <h2 className="text-lg font-bold tracking-[0.12em] text-institutional sm:text-xl">{title}</h2>
      </div>
      {subtitle && <p className="mt-1 pl-4 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

// Simple responsive bar chart using divs
function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="space-y-2.5">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-right text-[0.7rem] text-muted-foreground truncate">{d.label}</span>
          <div className="flex-1 h-5 bg-rule rounded-xs overflow-hidden">
            <div
              className="h-full rounded-xs transition-all duration-700"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color }}
            />
          </div>
          <span className="text-[0.7rem] font-bold text-institutional w-16 shrink-0">{formatCr(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

// Simple line-ish YoY chart
function YoYChart({ data, selectedYear }: { data: typeof YOY_DATA; selectedYear: string }) {
  const filtered = selectedYear === "All" ? data : data.filter(d => d.year <= selectedYear);
  const maxVal = Math.max(...filtered.flatMap(d => [d.budget, d.expenditure, d.capitalExp]));
  const chartH = 140;

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[480px]">
        <svg viewBox={`0 0 ${filtered.length * 80 + 40} ${chartH + 50}`} className="w-full">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line
              key={f}
              x1="40" y1={chartH - chartH * f}
              x2={filtered.length * 80 + 40} y2={chartH - chartH * f}
              stroke="#e2e8f0" strokeWidth="1"
            />
          ))}
          {/* Bars */}
          {filtered.map((d, i) => {
            const x = 40 + i * 80;
            const bH  = (d.budget      / maxVal) * chartH;
            const eH  = (d.expenditure / maxVal) * chartH;
            const cH  = (d.capitalExp  / maxVal) * chartH;
            return (
              <g key={d.year}>
                <rect x={x}      y={chartH - bH} width={18} height={bH} fill="#1e3a8a" rx="1" />
                <rect x={x + 20} y={chartH - eH} width={18} height={eH} fill="#FF9933" rx="1" />
                <rect x={x + 40} y={chartH - cH} width={18} height={cH} fill="#138808" rx="1" />
                <text x={x + 27} y={chartH + 14} fontSize="8" textAnchor="middle" fill="#6b7280">{d.year.slice(-2)}</text>
              </g>
            );
          })}
        </svg>
        <div className="flex gap-4 mt-1 text-[0.65rem] text-muted-foreground justify-center">
          <span className="flex items-center gap-1"><span className="w-3 h-2 bg-[#1e3a8a] inline-block rounded-xs" />Budget</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 bg-saffron inline-block rounded-xs" />Expenditure</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 bg-[#138808] inline-block rounded-xs" />Capital Exp.</span>
        </div>
      </div>
    </div>
  );
}

export default function BudgetAtAGlance() {
  const { t } = useApp();
  const [selectedYear, setSelectedYear] = useState("All");

  return (
    <PageLayout>
      <div className="portal-container pb-14">
        {/* Page header */}
        <div className="border-b-4 border-saffron py-6">
          <p className="label-caps text-saffron">{t("section_glance_sub")}</p>
          <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">{t("bag_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("bag_subtitle")}</p>
        </div>

        {/* KPI Cards */}
        <SectionHeading title={t("bag_total_budget")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {BUDGET_KPIS.map(kpi => {
            const yoy = pctChange(kpi.raw, kpi.prevRaw);
            const positive = yoy >= 0;
            return (
              <div key={kpi.key} className="rounded-sm border border-rule bg-card px-5 py-5 shadow-xs hover:shadow-sm transition-shadow">
                <p className="label-caps text-muted-foreground">{t(kpi.labelKey as any)}</p>
                <p className="mt-2 text-2xl font-bold text-institutional">{kpi.value}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className={`text-xs font-bold ${positive ? "text-positive" : "text-negative"}`}>
                    {positive ? "▲" : "▼"} {Math.abs(yoy)}% {t("bag_yoy")}
                  </span>
                  {kpi.gdpPct && (
                    <span className="text-xs text-muted-foreground">{t("bag_gdp")}: {kpi.gdpPct}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sector-wise Allocation */}
        <SectionHeading title={t("bag_sector_alloc")} />
        <div className="border border-rule bg-card p-5 rounded-xs shadow-xs mt-4">
          <BarChart
            data={SECTOR_ALLOCATIONS.map(s => ({ label: s.sector, value: s.amount, color: s.color }))}
          />
        </div>

        {/* Pie-like breakdown */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SECTOR_ALLOCATIONS.map(s => (
            <div key={s.sector} className="flex items-center gap-2 rounded-xs border border-rule bg-card px-3 py-2 shadow-xs">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ background: s.color }} />
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold text-institutional truncate">{s.sector}</p>
                <p className="text-[0.65rem] text-muted-foreground">{s.pct}%</p>
              </div>
            </div>
          ))}
        </div>

        {/* YoY Chart */}
        <SectionHeading title={t("bag_yoy_comparison")} />
        <div className="border border-rule bg-card p-5 rounded-xs shadow-xs mt-4">
          <div className="mb-4 flex items-center gap-3">
            <label htmlFor="yoy-year-select" className="label-caps text-muted-foreground">{t("bag_select_year")}:</label>
            <select
              id="yoy-year-select"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="rounded-xs border border-rule bg-background px-2 py-1 text-xs font-semibold text-institutional focus:outline-none focus:ring-1 focus:ring-institutional"
            >
              <option value="All">All Years</option>
              {FINANCIAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <YoYChart data={YOY_DATA} selectedYear={selectedYear} />
        </div>

        {/* Disclaimer */}
        <p className="mt-4 text-xs text-muted-foreground">{t("bag_disclaimer")}</p>
      </div>
    </PageLayout>
  );
}
