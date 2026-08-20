import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { COMPARISON_DATA } from "@/data/mockData";
import { formatCr } from "@/data/budgetData";

export default function Compare() {
  const { t, lang } = useApp();
  const [selectedCompId, setSelectedCompId] = useState(COMPARISON_DATA[0].id);

  const activeComp = COMPARISON_DATA.find(c => c.id === selectedCompId) || COMPARISON_DATA[0];
  const maxVal = Math.max(...activeComp.data.map(d => d.amountCr));

  return (
    <PageLayout>
      <div className="portal-container pb-14">
        {/* Header */}
        <div className="border-b-4 border-saffron py-6">
          <p className="label-caps text-saffron">Cross-Region & Sector Analysis</p>
          <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">
            {t("compare_title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("compare_subtitle")}</p>
        </div>

        {/* Category Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-rule pb-3">
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
