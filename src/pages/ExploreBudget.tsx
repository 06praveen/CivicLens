import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { BUDGET_RECORDS, DEPARTMENTS, FINANCIAL_YEARS, formatCr } from "@/data/budgetData";

export default function ExploreBudget() {
  const { t, lang } = useApp();
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(initialQ);
  const [selectedFY, setSelectedFY] = useState("2026-27");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedSector, setSelectedSector] = useState("All");

  // Sync with URL param on mount
  useEffect(() => { setSearch(initialQ); }, [initialQ]);

  const sectors = useMemo(() => ["All", ...Array.from(new Set(BUDGET_RECORDS.map(r => r.sector)))], []);
  const depts   = useMemo(() => ["All", ...DEPARTMENTS.map(d => lang === "hi" ? d.nameHi : d.name)], [lang]);

  const filtered = useMemo(() => {
    return BUDGET_RECORDS.filter(r => {
      const matchSearch   = !search.trim() || r.scheme.toLowerCase().includes(search.toLowerCase()) || r.department.toLowerCase().includes(search.toLowerCase()) || r.sector.toLowerCase().includes(search.toLowerCase());
      const matchDept     = selectedDept === "All" || r.department === selectedDept || DEPARTMENTS.find(d => (lang === "hi" ? d.nameHi : d.name) === selectedDept)?.name === r.department;
      const matchSector   = selectedSector === "All" || r.sector === selectedSector;
      return matchSearch && matchDept && matchSector;
    });
  }, [search, selectedDept, selectedSector, lang]);

  return (
    <PageLayout>
      <div className="portal-container pb-14">
        {/* Page header */}
        <div className="border-b-4 border-saffron py-6">
          <p className="label-caps text-saffron">{selectedFY}</p>
          <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">{t("explore_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("explore_subtitle")}</p>
        </div>

        {/* Filters */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <label htmlFor="explore-search" className="label-caps block text-muted-foreground mb-1">{t("search_placeholder")}</label>
            <input
              id="explore-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("explore_search")}
              className="w-full rounded-xs border border-rule bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-institutional"
            />
          </div>

          {/* Financial Year */}
          <div>
            <label htmlFor="explore-fy" className="label-caps block text-muted-foreground mb-1">{t("explore_fy")}</label>
            <select
              id="explore-fy"
              value={selectedFY}
              onChange={e => setSelectedFY(e.target.value)}
              className="w-full rounded-xs border border-rule bg-background px-3 py-2 text-sm font-semibold text-institutional focus:outline-none focus:ring-1 focus:ring-institutional"
            >
              {FINANCIAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Department */}
          <div>
            <label htmlFor="explore-dept" className="label-caps block text-muted-foreground mb-1">{t("explore_dept")}</label>
            <select
              id="explore-dept"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full rounded-xs border border-rule bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-institutional"
            >
              {depts.map(d => <option key={d} value={d}>{d === "All" ? t("explore_all_dept") : d}</option>)}
            </select>
          </div>

          {/* Sector */}
          <div>
            <label htmlFor="explore-sector" className="label-caps block text-muted-foreground mb-1">{t("explore_sector")}</label>
            <select
              id="explore-sector"
              value={selectedSector}
              onChange={e => setSelectedSector(e.target.value)}
              className="w-full rounded-xs border border-rule bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-institutional"
            >
              {sectors.map(s => <option key={s} value={s}>{s === "All" ? t("explore_all_sectors") : s}</option>)}
            </select>
          </div>
        </div>

        {/* Results count */}
        <p className="mt-4 text-xs text-muted-foreground">
          {filtered.length} {t("search_result_count")}
          {search.trim() && <> — {t("search_results_for")} "<strong>{search}</strong>"</>}
        </p>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="mt-8 border border-rule bg-card rounded-xs p-10 text-center text-muted-foreground">
            {t("explore_no_results")}
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xs border border-rule shadow-xs">
            <table className="min-w-full divide-y divide-rule bg-card text-sm">
              <thead>
                <tr className="bg-institutional/5">
                  <th className="px-4 py-3 text-left label-caps text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left label-caps text-muted-foreground">Scheme / Programme</th>
                  <th className="px-4 py-3 text-left label-caps text-muted-foreground hidden md:table-cell">{t("explore_dept")}</th>
                  <th className="px-4 py-3 text-left label-caps text-muted-foreground hidden sm:table-cell">{t("explore_sector")}</th>
                  <th className="px-4 py-3 text-right label-caps text-muted-foreground">{t("explore_allocated")}</th>
                  <th className="px-4 py-3 text-right label-caps text-muted-foreground hidden sm:table-cell">{t("explore_prev_year")}</th>
                  <th className="px-4 py-3 text-right label-caps text-muted-foreground">{t("explore_change")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {filtered.map(r => {
                  const pos = r.changePct >= 0;
                  return (
                    <tr key={r.id} className="hover:bg-institutional/5 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{r.id}</td>
                      <td className="px-4 py-3 font-semibold text-institutional">{r.scheme}</td>
                      <td className="px-4 py-3 text-xs text-foreground/80 hidden md:table-cell max-w-[200px] truncate">{r.department}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="rounded-full bg-institutional/10 px-2 py-0.5 text-[0.65rem] font-semibold text-institutional">{r.sector}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-institutional">{formatCr(r.allocated)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{formatCr(r.prevYear)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${pos ? "text-positive" : "text-negative"}`}>
                        {pos ? "+" : ""}{r.changePct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
