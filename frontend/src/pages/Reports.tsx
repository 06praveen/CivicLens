import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { formatCr } from "@/data/budgetData";
import { getBudgetFilters } from "@/api/budgets";

interface ReportPreviewData {
  title: string;
  generated_at: string;
  financial_year: string;
  ministry: string;
  total_budget: number;
  capital_expenditure: number;
  revenue_expenditure: number;
  top_items: Array<{
    record_id: number;
    budget_item: string;
    expenditure_category: string;
    amount: number;
    statement: string;
  }>;
  anomalies: Array<{
    budget_item_key: string;
    budget_item: string;
    financial_year: string;
    previous_financial_year: string;
    previous_amount: number;
    current_amount: number;
    percentage_change: number;
  }>;
}

export default function Reports() {
  const { t } = useApp();

  // Filters State
  const [selectedYear, setSelectedYear] = useState<string>("2024-2025");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedCat, setSelectedCat] = useState<string>("All");

  // Dynamic Options State
  const [availableYears, setAvailableYears] = useState<string[]>(["2024-2025", "2023-2024"]);
  const [availableDepts, setAvailableDepts] = useState<string[]>([]);
  const [availableCats, setAvailableCats] = useState<string[]>([]);

  // Preview & Status State
  const [preview, setPreview] = useState<ReportPreviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadingCsv, setDownloadingCsv] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  // Load backend filters on mount
  useEffect(() => {
    getBudgetFilters()
      .then(filters => {
        if (filters.financial_years && filters.financial_years.length > 0) {
          setAvailableYears(filters.financial_years);
        }
        if (filters.ministries_departments && filters.ministries_departments.length > 0) {
          setAvailableDepts(["All", ...filters.ministries_departments]);
        }
        if (filters.expenditure_categories && filters.expenditure_categories.length > 0) {
          setAvailableCats(["All", ...filters.expenditure_categories]);
        }
      })
      .catch(err => console.warn("Backend getBudgetFilters error:", err));
  }, []);

  // Fetch report preview when filters change
  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);

    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const params = new URLSearchParams();
    if (selectedYear && selectedYear !== "All") params.append("financial_year", selectedYear);
    if (selectedDept && selectedDept !== "All") params.append("ministry", selectedDept);
    if (selectedCat && selectedCat !== "All") params.append("expenditure_category", selectedCat);

    fetch(`${backendUrl}/api/reports/preview?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setPreview(data);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Backend report preview error:", err);
        setErrorMsg("Unable to connect to FastAPI backend for report generation. Ensure backend is running on http://localhost:8000.");
        setPreview(null);
        setLoading(false);
      });
  }, [selectedYear, selectedDept, selectedCat]);

  // Handle CSV Download
  const handleDownloadCsv = async () => {
    setDownloadingCsv(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const params = new URLSearchParams();
      if (selectedYear && selectedYear !== "All") params.append("financial_year", selectedYear);
      if (selectedDept && selectedDept !== "All") params.append("ministry", selectedDept);
      if (selectedCat && selectedCat !== "All") params.append("expenditure_category", selectedCat);

      const res = await fetch(`${backendUrl}/api/reports/csv?${params.toString()}`);
      if (!res.ok) throw new Error("CSV generation failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `civiclens_budget_${selectedYear.replace(/\s+/g, "_")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download CSV failed:", err);
      alert("Failed to download CSV dataset. Please verify backend server connection.");
    } finally {
      setDownloadingCsv(false);
    }
  };

  // Handle PDF Download
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const params = new URLSearchParams();
      if (selectedYear && selectedYear !== "All") params.append("financial_year", selectedYear);
      if (selectedDept && selectedDept !== "All") params.append("ministry", selectedDept);
      if (selectedCat && selectedCat !== "All") params.append("expenditure_category", selectedCat);

      const res = await fetch(`${backendUrl}/api/reports/pdf?${params.toString()}`);
      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `civiclens_budget_report_${selectedYear.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download PDF failed:", err);
      alert("Failed to generate PDF report. Please verify backend server connection.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <PageLayout>
      <div className="portal-container pb-14">
        {/* Header */}
        <div className="border-b-4 border-saffron py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="label-caps text-saffron">Open Data & Official Downloads</p>
              <span className="rounded-full bg-positive/10 text-positive px-2 py-0.5 text-[0.65rem] font-bold border border-positive/30">
                ● Live PostgreSQL Data Generator
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">
              Reports & Downloads
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate and download official CSV datasets and PDF budget transparency reports directly from PostgreSQL.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-xs text-xs font-semibold text-destructive">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="mt-6 border border-rule bg-card p-5 rounded-xs shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="report-fy-select" className="label-caps text-muted-foreground block mb-1">Financial Year:</label>
            <select
              id="report-fy-select"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full rounded-xs border border-rule bg-background p-2 text-xs font-bold text-institutional"
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="report-dept-select" className="label-caps text-muted-foreground block mb-1">Ministry / Department:</label>
            <select
              id="report-dept-select"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full rounded-xs border border-rule bg-background p-2 text-xs font-bold text-institutional truncate"
            >
              <option value="All">All Union Ministries & Departments</option>
              {availableDepts.filter(d => d !== "All").map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="report-cat-select" className="label-caps text-muted-foreground block mb-1">Expenditure Category:</label>
            <select
              id="report-cat-select"
              value={selectedCat}
              onChange={e => setSelectedCat(e.target.value)}
              className="w-full rounded-xs border border-rule bg-background p-2 text-xs font-bold text-institutional truncate"
            >
              <option value="All">All Categories</option>
              {availableCats.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Main Action Banner */}
        <div className="mt-6 border-2 border-institutional/30 bg-card p-6 rounded-xs shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-institutional">Download Official CivicLens Budget Outputs</h2>
            <p className="text-xs text-muted-foreground max-w-xl">
              Download complete structured CSV spreadsheets for custom analysis or export a formatted PDF report with executive summaries, major allocations, and verified dataset source traceability.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={downloadingCsv || loading}
              className="px-4 py-2.5 bg-institutional text-white text-xs font-bold rounded-xs hover:bg-institutional-dark transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {downloadingCsv ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating CSV...
                </>
              ) : (
                <>📥 Download CSV Dataset</>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || loading}
              className="px-4 py-2.5 bg-saffron text-institutional-dark text-xs font-black rounded-xs hover:bg-saffron-dark transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {downloadingPdf ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-institutional-dark border-t-transparent" />
                  Generating PDF...
                </>
              ) : (
                <>📄 Download PDF Report</>
              )}
            </button>
          </div>
        </div>

        {/* Report Preview Panel */}
        {loading ? (
          <div className="py-16 text-center text-xs text-muted-foreground">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-institutional border-r-transparent mb-3" />
            <p className="font-semibold">Querying PostgreSQL and compiling real report preview data...</p>
          </div>
        ) : preview ? (
          <div className="mt-8 border border-rule bg-card rounded-xs p-6 shadow-xs space-y-6">
            <div className="border-b border-rule pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="label-caps text-saffron">Live Report Preview</p>
                <h2 className="text-xl font-bold text-institutional mt-0.5">{preview.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  FY {preview.financial_year} • Scope: {preview.ministry}
                </p>
              </div>
              <span className="text-[0.7rem] font-mono text-muted-foreground bg-background px-3 py-1 border border-rule rounded-xs">
                Generated: {preview.generated_at}
              </span>
            </div>

            {/* Metric Cards */}
            {preview.total_budget === 0 && preview.top_items.length === 0 ? (
              <div className="p-8 border border-rule bg-background rounded-xs text-center space-y-2">
                <p className="text-sm font-bold text-institutional">No Matching Budget Records Found</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  No line items match the selected combination (Year: <strong>{selectedYear}</strong>, Scope: <strong>{selectedDept}</strong>, Category: <strong>{selectedCat}</strong>). Try adjusting the department or category filter.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-institutional/5 p-4 rounded-xs border border-rule">
                    <p className="label-caps text-muted-foreground">Total Budget Outlay</p>
                    <p className="text-lg font-black text-institutional font-mono mt-1">{formatCr(preview.total_budget)}</p>
                  </div>
                  <div className="bg-institutional/5 p-4 rounded-xs border border-rule">
                    <p className="label-caps text-muted-foreground">Capital Expenditure</p>
                    <p className="text-lg font-black text-institutional font-mono mt-1">{formatCr(preview.capital_expenditure)}</p>
                  </div>
                  <div className="bg-institutional/5 p-4 rounded-xs border border-rule">
                    <p className="label-caps text-muted-foreground">Revenue Expenditure</p>
                    <p className="text-lg font-black text-institutional font-mono mt-1">{formatCr(preview.revenue_expenditure)}</p>
                  </div>
                </div>

                {/* Top Allocations Table */}
                <div>
                  <h3 className="text-sm font-bold text-institutional mb-3 flex items-center gap-2">
                    <span className="h-3 w-1 bg-saffron" />
                    Top Major Allocations in Preview
                  </h3>
                  <div className="overflow-x-auto border border-rule rounded-xs">
                    <table className="min-w-full divide-y divide-rule text-xs">
                      <thead className="bg-institutional/5">
                        <tr>
                          <th className="px-3 py-2 text-left label-caps text-muted-foreground">#</th>
                          <th className="px-3 py-2 text-left label-caps text-muted-foreground">Budget Item / Scheme</th>
                          <th className="px-3 py-2 text-left label-caps text-muted-foreground">Category</th>
                          <th className="px-3 py-2 text-right label-caps text-muted-foreground">Outlay (Rs. Cr)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rule bg-card">
                        {preview.top_items.map((item, idx) => (
                          <tr key={item.record_id} className="hover:bg-institutional/5">
                            <td className="px-3 py-2 font-mono text-muted-foreground">{idx + 1}</td>
                            <td className="px-3 py-2 font-bold text-institutional">{item.budget_item}</td>
                            <td className="px-3 py-2 text-muted-foreground">{item.expenditure_category || "General"}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-institutional">{formatCr(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
