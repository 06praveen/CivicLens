import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { formatCr } from "@/data/budgetData";
import { getBudgets, getBudgetFilters, getBudgetDetail } from "@/api/budgets";
import type { BudgetRecordResponse } from "@/api/types";

export default function ExploreBudget() {
  const { t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read search term from URL query parameter (supports 'search' or 'q')
  const urlSearch = searchParams.get("search") || searchParams.get("q") || "";
  const urlCategory = searchParams.get("category") || "All";

  const [search, setSearch] = useState(urlSearch);
  const [selectedFY, setSelectedFY] = useState("2024-2025");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [page, setPage] = useState(1);

  // Dynamic filter choices from backend
  const [availableYears, setAvailableYears] = useState<string[]>(["2024-2025", "2023-2024", "2022-2023", "2021-2022", "2020-2021", "2019-2020", "2018-2019"]);
  const [availableMinistries, setAvailableMinistries] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // API Data State
  const [records, setRecords] = useState<BudgetRecordResponse[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Selected Record for Detail Modal
  const [selectedRecord, setSelectedRecord] = useState<BudgetRecordResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Synchronize state when URL query params change (e.g. from Home search redirect or direct link)
  useEffect(() => {
    setSearch(urlSearch);
    if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [urlSearch, urlCategory]);

  const handleClearSearch = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedDept("All");
    setSearchParams({});
  };

  // Fetch filter options from backend
  useEffect(() => {
    getBudgetFilters()
      .then(filters => {
        if (filters.financial_years && filters.financial_years.length > 0) {
          setAvailableYears(filters.financial_years);
          if (!filters.financial_years.includes(selectedFY)) {
            setSelectedFY(filters.financial_years[filters.financial_years.length - 1]);
          }
        }
        if (filters.ministries_departments && filters.ministries_departments.length > 0) {
          setAvailableMinistries(["All", ...filters.ministries_departments]);
        }
        if (filters.expenditure_categories && filters.expenditure_categories.length > 0) {
          setAvailableCategories(["All", ...filters.expenditure_categories]);
        }
      })
      .catch(err => {
        console.warn("Backend getBudgetFilters error:", err);
      });
  }, []);

  // Reset page to 1 when filters change
  const handleFilterChange = (setter: (v: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  // Fetch budget records from backend
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);

    getBudgets({
      financial_year: selectedFY,
      ministry: selectedDept !== "All" ? selectedDept : undefined,
      expenditure_category: selectedCategory !== "All" ? selectedCategory : undefined,
      search: search.trim() || undefined,
      page,
      limit: 20,
    })
      .then(res => {
        if (!isMounted) return;
        setRecords(res.data);
        setTotalRecords(res.total);
        setTotalPages(res.total_pages || 1);
        setIsLiveApi(true);
        setLoading(false);
      })
      .catch(err => {
        if (!isMounted) return;
        console.warn("Backend API query error:", err);
        setIsLiveApi(false);
        setErrorMsg("Failed to query backend. Ensure FastAPI server is running on http://localhost:8000.");
        setRecords([]);
        setTotalRecords(0);
        setTotalPages(1);
        setLoading(false);
      });

    return () => { isMounted = false; };
  }, [search, selectedFY, selectedDept, selectedCategory, page]);

  // Open detail modal for a specific record
  const handleRecordClick = (record: BudgetRecordResponse) => {
    setDetailLoading(true);
    setSelectedRecord(record);
    getBudgetDetail(record.record_id)
      .then(detail => {
        setSelectedRecord(detail);
        setDetailLoading(false);
      })
      .catch(() => {
        setDetailLoading(false);
      });
  };

  return (
    <PageLayout>
      <div className="portal-container pb-14">
        {/* Page header */}
        <div className="border-b-4 border-saffron py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="label-caps text-saffron">{selectedFY}</p>
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">{t("explore_title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("explore_subtitle")}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-xs text-xs font-semibold text-destructive">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ── Active Search Results Status Banner ── */}
        {search.trim() && (
          <div className="mt-4 p-4 bg-institutional/10 border-2 border-institutional/30 rounded-xs flex items-center justify-between flex-wrap gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-institutional text-white flex items-center justify-center text-xs font-bold shrink-0">
                🔍
              </div>
              <div>
                <h2 className="text-xs font-bold text-institutional uppercase tracking-wider">
                  Search Results Active
                </h2>
                <p className="text-xs text-foreground font-semibold">
                  Showing matching official records for: <span className="bg-saffron/20 px-2 py-0.5 rounded text-institutional font-extrabold">"{search}"</span>
                  {selectedCategory !== "All" && <span className="text-muted-foreground ml-1">in category ({selectedCategory})</span>}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearSearch}
              className="px-3.5 py-1.5 bg-institutional text-white font-bold text-xs uppercase tracking-wider rounded-xs hover:bg-institutional-dark transition-colors shadow-xs cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <label htmlFor="explore-search" className="label-caps block text-muted-foreground mb-1">{t("search_placeholder")}</label>
            <input
              id="explore-search"
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
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
              onChange={e => handleFilterChange(setSelectedFY, e.target.value)}
              className="w-full rounded-xs border border-rule bg-background px-3 py-2 text-sm font-semibold text-institutional focus:outline-none focus:ring-1 focus:ring-institutional"
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Ministry / Department */}
          <div>
            <label htmlFor="explore-dept" className="label-caps block text-muted-foreground mb-1">{t("explore_dept")}</label>
            <select
              id="explore-dept"
              value={selectedDept}
              onChange={e => handleFilterChange(setSelectedDept, e.target.value)}
              className="w-full rounded-xs border border-rule bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-institutional"
            >
              <option value="All">{t("explore_all_dept")}</option>
              {availableMinistries.filter(d => d !== "All").map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Expenditure Category */}
          <div className="lg:col-span-2">
            <label htmlFor="explore-sector" className="label-caps block text-muted-foreground mb-1">{t("explore_sector")}</label>
            <select
              id="explore-sector"
              value={selectedCategory}
              onChange={e => handleFilterChange(setSelectedCategory, e.target.value)}
              className="w-full rounded-xs border border-rule bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-institutional"
            >
              <option value="All">{t("explore_all_sectors")}</option>
              {availableCategories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Results count & status */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground font-mono">
          <p>
            Showing <strong>{records.length}</strong> of <strong>{totalRecords}</strong> budget records
            {search.trim() && <> — {t("search_results_for")} "<strong>{search}</strong>"</>}
          </p>
          {totalPages > 1 && (
            <p>Page {page} of {totalPages}</p>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="mt-6 border border-rule bg-card rounded-xs p-12 text-center text-muted-foreground">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-institutional border-t-transparent mb-2" />
            <p className="text-xs font-semibold">Querying PostgreSQL Budget Database...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="mt-6 border-2 border-rule bg-card rounded-xs p-10 text-center space-y-3">
            <div className="text-3xl">📂</div>
            <p className="text-sm font-bold text-institutional">
              No matching official budget records found for "{search || "selected filters"}"
            </p>
            <p className="text-xs text-muted-foreground">
              Try searching with a broader keyword such as "Education", "Healthcare", "Agriculture", or "MGNREGS".
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-4 py-2 bg-saffron text-institutional-dark font-bold text-xs uppercase tracking-wider rounded-xs hover:bg-saffron/90 transition-colors shadow-xs cursor-pointer"
              >
                Clear Search & Browse All Records
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xs border border-rule shadow-xs">
            <table className="min-w-full divide-y divide-rule bg-card text-sm">
              <thead>
                <tr className="bg-institutional/5">
                  <th className="px-4 py-3 text-left label-caps text-muted-foreground">Record ID</th>
                  <th className="px-4 py-3 text-left label-caps text-muted-foreground">Budget Item / Scheme</th>
                  <th className="px-4 py-3 text-left label-caps text-muted-foreground hidden md:table-cell">{t("explore_dept")}</th>
                  <th className="px-4 py-3 text-left label-caps text-muted-foreground hidden sm:table-cell">{t("explore_sector")}</th>
                  <th className="px-4 py-3 text-right label-caps text-muted-foreground">{t("explore_allocated")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {records.map(r => {
                  const amt = r.total_amount ?? r.amount ?? 0;
                  return (
                    <tr
                      key={r.record_id}
                      onClick={() => handleRecordClick(r)}
                      className="hover:bg-institutional/5 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">#{r.record_id}</td>
                      <td className="px-4 py-3 font-semibold text-institutional group-hover:underline">{r.budget_item}</td>
                      <td className="px-4 py-3 text-xs text-foreground/80 hidden md:table-cell max-w-[240px] truncate">
                        {r.ministry_department || "General"}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="rounded-full bg-institutional/10 px-2 py-0.5 text-[0.65rem] font-semibold text-institutional">
                          {r.expenditure_category || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-institutional font-mono">
                        {formatCr(amt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-rule pt-4">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 border border-rule rounded-xs text-xs font-bold text-institutional hover:bg-institutional/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Previous Page
            </button>
            <span className="text-xs font-mono text-muted-foreground">Page {page} of {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-4 py-2 border border-rule rounded-xs text-xs font-bold text-institutional hover:bg-institutional/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next Page →
            </button>
          </div>
        )}

        {/* Record Detail Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-card border-2 border-institutional rounded-sm max-w-2xl w-full p-6 shadow-lg max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-start justify-between border-b border-rule pb-3">
                <div>
                  <span className="label-caps text-saffron font-mono">Record ID #{selectedRecord.record_id}</span>
                  <h2 className="text-xl font-bold text-institutional mt-1">{selectedRecord.budget_item}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedRecord.ministry_department || "Unclassified Department"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="h-8 w-8 rounded-full border border-rule text-xs font-bold hover:bg-rule cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {detailLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-institutional border-t-transparent mb-1" />
                  <p>Loading full record metadata...</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  {/* Financial Metrics */}
                  <div className="grid grid-cols-3 gap-3 bg-institutional/5 p-3 rounded-xs border border-rule font-mono">
                    <div>
                      <p className="label-caps text-muted-foreground">Total Outlay</p>
                      <p className="text-sm font-bold text-institutional mt-0.5">
                        {formatCr(selectedRecord.total_amount ?? selectedRecord.amount ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="label-caps text-muted-foreground">Revenue Exp.</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">
                        {selectedRecord.revenue_amount !== null && selectedRecord.revenue_amount !== undefined ? formatCr(selectedRecord.revenue_amount) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="label-caps text-muted-foreground">Capital Exp.</p>
                      <p className="text-sm font-bold text-positive mt-0.5">
                        {selectedRecord.capital_amount !== null && selectedRecord.capital_amount !== undefined ? formatCr(selectedRecord.capital_amount) : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Table */}
                  <div className="border border-rule rounded-xs overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-rule font-mono text-[0.72rem]">
                        <tr>
                          <td className="px-3 py-2 font-bold bg-institutional/5 text-institutional w-1/3">Financial Year</td>
                          <td className="px-3 py-2">{selectedRecord.financial_year}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-bold bg-institutional/5 text-institutional">Amount Stage</td>
                          <td className="px-3 py-2">{selectedRecord.amount_stage}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-bold bg-institutional/5 text-institutional">Statement</td>
                          <td className="px-3 py-2">{selectedRecord.statement || "N/A"}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-bold bg-institutional/5 text-institutional">Demand No.</td>
                          <td className="px-3 py-2">{selectedRecord.demand_no || "N/A"}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-bold bg-institutional/5 text-institutional">Expenditure Category</td>
                          <td className="px-3 py-2">{selectedRecord.expenditure_category || "N/A"}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-bold bg-institutional/5 text-institutional">Normalized Item Key</td>
                          <td className="px-3 py-2 text-saffron-dark font-semibold">{selectedRecord.budget_item_key}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Source Transparency Box */}
                  <div className="bg-saffron/10 border border-saffron/30 p-3 rounded-xs text-[0.7rem] space-y-1 font-mono">
                    <p className="font-bold text-institutional-dark label-caps">📜 Grounded Source Metadata</p>
                    <p>Source CSV File: <strong>{selectedRecord.source_file}</strong></p>
                    <p>Source Data Row: <strong>Row #{selectedRecord.source_row}</strong></p>
                    <p>Database Table: <strong>budget_records</strong> (Primary Key #{selectedRecord.record_id})</p>
                  </div>
                </div>
              )}

              <div className="pt-2 text-right border-t border-rule">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 bg-institutional text-white text-xs font-bold rounded-xs hover:bg-institutional-dark transition-colors cursor-pointer"
                >
                  Close Record Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
