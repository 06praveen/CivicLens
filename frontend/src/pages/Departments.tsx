import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { DEPARTMENTS, formatCr, pctChange } from "@/data/budgetData";
import type { Department } from "@/data/budgetData";

function DeptCard({ dept, onSelect }: { dept: Department; onSelect: (d: Department) => void }) {
  const { t, lang } = useApp();
  const yoy = pctChange(dept.allocation, dept.prevAllocation);
  const positive = yoy >= 0;

  return (
    <div className="flex flex-col rounded-sm border border-rule bg-card shadow-xs hover:shadow-md transition-shadow overflow-hidden">
      {/* Color accent bar */}
      <div className="h-1.5 w-full" style={{ background: dept.color }} />
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none mt-0.5">{dept.icon}</span>
          <div className="min-w-0">
            <h2 className="font-bold text-institutional leading-tight text-sm sm:text-base">
              {lang === "hi" ? dept.nameHi : dept.name}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {lang === "hi" ? dept.shortDescHi : dept.shortDesc}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-rule pt-4">
          <div>
            <p className="label-caps text-muted-foreground">{t("dept_allocation")}</p>
            <p className="mt-1 font-bold text-institutional text-sm">{formatCr(dept.allocation)}</p>
          </div>
          <div>
            <p className="label-caps text-muted-foreground">{t("dept_prev")}</p>
            <p className="mt-1 text-sm text-foreground/80">{formatCr(dept.prevAllocation)}</p>
          </div>
          <div className="col-span-2">
            <p className="label-caps text-muted-foreground">{t("explore_change")}</p>
            <p className={`mt-1 font-bold text-sm ${positive ? "text-positive" : "text-negative"}`}>
              {positive ? "▲ +" : "▼ "}{Math.abs(yoy)}%
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelect(dept)}
          className="mt-4 self-start border border-institutional bg-institutional px-4 py-1.5 text-[0.7rem] font-bold tracking-[0.08em] text-white hover:bg-institutional-dark transition-colors rounded-xs"
        >
          {t("dept_view_budget")}
        </button>
      </div>
    </div>
  );
}

function DeptDetail({ dept, onBack }: { dept: Department; onBack: () => void }) {
  const { t, lang } = useApp();
  const yoy = pctChange(dept.allocation, dept.prevAllocation);
  const positive = yoy >= 0;
  const maxScheme = Math.max(...dept.schemes.map(s => s.amount));

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button type="button" onClick={onBack} className="text-xs font-bold text-institutional hover:text-saffron flex items-center gap-1 mt-4">
        {t("dept_back")}
      </button>

      {/* Header card */}
      <div className="rounded-sm border border-rule bg-card overflow-hidden shadow-xs">
        <div className="h-2 w-full" style={{ background: dept.color }} />
        <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="text-5xl">{dept.icon}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-institutional tracking-[0.04em]">
              {lang === "hi" ? dept.nameHi : dept.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{lang === "hi" ? dept.shortDescHi : dept.shortDesc}</p>
          </div>
          <div className="flex gap-6 shrink-0 text-center">
            <div>
              <p className="label-caps text-muted-foreground">{t("dept_allocation")}</p>
              <p className="mt-1 text-xl font-black text-institutional">{formatCr(dept.allocation)}</p>
            </div>
            <div>
              <p className="label-caps text-muted-foreground">{t("explore_change")}</p>
              <p className={`mt-1 text-xl font-black ${positive ? "text-positive" : "text-negative"}`}>
                {positive ? "+" : ""}{yoy}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Major Schemes */}
        <div className="rounded-sm border border-rule bg-card p-5 shadow-xs">
          <h2 className="font-bold text-institutional mb-4 flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-saffron" />
            {t("dept_major_schemes")}
          </h2>
          <div className="space-y-3">
            {dept.schemes.map(s => (
              <div key={s.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground/90">{s.name}</span>
                  <span className="text-xs font-bold text-institutional">{formatCr(s.amount)}</span>
                </div>
                <div className="h-2 bg-rule rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(s.amount / maxScheme) * 100}%`, background: dept.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spending Categories */}
        <div className="rounded-sm border border-rule bg-card p-5 shadow-xs">
          <h2 className="font-bold text-institutional mb-4 flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-saffron" />
            {t("dept_spending_cats")}
          </h2>
          <div className="space-y-3">
            {dept.spendingCats.map(c => (
              <div key={c.cat}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground/90">{c.cat}</span>
                  <span className="text-xs font-bold text-institutional">{c.pct}%</span>
                </div>
                <div className="h-2 bg-rule rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: dept.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Link to explore */}
      <div className="flex gap-3">
        <Link to="/explore-budget" className="border border-institutional bg-institutional px-5 py-2.5 text-xs font-bold tracking-[0.08em] text-white hover:bg-institutional-dark transition-colors rounded-xs">
          {t("nav_explore")} →
        </Link>
        <Link to="/ai-insights" className="border border-saffron px-5 py-2.5 text-xs font-bold tracking-[0.08em] text-institutional hover:bg-saffron hover:text-white transition-colors rounded-xs">
          {t("nav_ai")} →
        </Link>
      </div>
    </div>
  );
}

export default function Departments() {
  const { t } = useApp();
  const [selected, setSelected] = useState<Department | null>(null);

  return (
    <PageLayout>
      <div className="portal-container pb-14">
        {selected ? (
          <DeptDetail dept={selected} onBack={() => setSelected(null)} />
        ) : (
          <>
            {/* Page header */}
            <div className="border-b-4 border-saffron py-6">
              <p className="label-caps text-saffron">Ministry-wise</p>
              <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">{t("dept_title")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("dept_subtitle")}</p>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {DEPARTMENTS.map(d => (
                <DeptCard key={d.id} dept={d} onSelect={setSelected} />
              ))}
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
