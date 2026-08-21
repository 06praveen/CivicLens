import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { formatCr } from "@/data/budgetData";
import { getBudgetFilters, getReportOptions, createIssueReport, getMyReports } from "@/api/budgets";

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

interface IssueReportItem {
  id: number;
  issue_category: string;
  financial_year?: string;
  ministry_department?: string;
  budget_item?: string;
  issue_title: string;
  description: string;
  evidence_reference?: string;
  status: string;
  priority: string;
  is_anonymous: boolean;
  created_at: string;
  reporter_name: string;
}

export default function Reports() {
  const { t, user, setAuthModalOpen } = useApp();

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

  // Issue Reporting State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [dbYears, setDbYears] = useState<string[]>([]);
  const [dbDepts, setDbDepts] = useState<string[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([
    "Possible Data Discrepancy",
    "Suspicious Budget Allocation",
    "Possible Misuse of Funds",
    "Unusual Budget Change",
    "Missing or Incorrect Information",
    "Possible Scam / Fraud Concern",
    "Other"
  ]);

  // Form Fields
  const [formCategory, setFormCategory] = useState<string>("Possible Data Discrepancy");
  const [formYear, setFormYear] = useState<string>("");
  const [formDept, setFormDept] = useState<string>("");
  const [formItem, setFormItem] = useState<string>("");
  const [formTitle, setFormTitle] = useState<string>("");
  const [formDesc, setFormDesc] = useState<string>("");
  const [formEvidence, setFormEvidence] = useState<string>("");
  const [formAnonymous, setFormAnonymous] = useState<boolean>(false);
  const [formDeclaration, setFormDeclaration] = useState<boolean>(false);

  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccessMsg, setFormSuccessMsg] = useState<string | null>(null);

  // User's Submitted Reports
  const [myReports, setMyReports] = useState<IssueReportItem[]>([]);

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

    getReportOptions()
      .then(opts => {
        if (opts.financial_years) setDbYears(opts.financial_years);
        if (opts.ministries_departments) setDbDepts(opts.ministries_departments);
        if (opts.categories) setDbCategories(opts.categories);
      })
      .catch(err => console.warn("Backend getReportOptions error:", err));
  }, []);

  // Load user's submitted reports if authenticated
  useEffect(() => {
    if (user) {
      getMyReports()
        .then(data => setMyReports(data))
        .catch(err => console.warn("Backend getMyReports error:", err));
    }
  }, [user, formSuccessMsg]);

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

  const openReportModal = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setFormError(null);
    setFormSuccessMsg(null);
    setIsReportModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccessMsg(null);

    if (!formTitle.trim() || formTitle.trim().length < 3) {
      setFormError("Please enter an issue title (at least 3 characters).");
      return;
    }

    if (!formDesc.trim() || formDesc.trim().length < 20) {
      setFormError("Please provide a detailed description (at least 20 characters).");
      return;
    }

    if (!formDeclaration) {
      setFormError("You must check the declaration before submitting your concern.");
      return;
    }

    setFormSubmitting(true);
    try {
      await createIssueReport({
        issue_category: formCategory,
        financial_year: formYear || undefined,
        ministry_department: formDept || undefined,
        budget_item: formItem || undefined,
        issue_title: formTitle,
        description: formDesc,
        evidence_reference: formEvidence || undefined,
        is_anonymous: formAnonymous,
        declaration: formDeclaration,
      });

      setFormSuccessMsg("Your concern has been submitted successfully for review.");
      setFormTitle("");
      setFormDesc("");
      setFormEvidence("");
      setFormDeclaration(false);
      setIsReportModalOpen(false);
    } catch (err: any) {
      console.error("Submit issue report error:", err);
      setFormError(err.message || "Failed to submit concern. Please try again.");
    } finally {
      setFormSubmitting(false);
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

        {formSuccessMsg && (
          <div className="mt-4 p-4 bg-positive/10 border border-positive/30 rounded-xs text-xs font-semibold text-positive flex items-start gap-2">
            <span>✅</span>
            <div>
              <p className="font-bold">{formSuccessMsg}</p>
              <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                CivicLens records submitted concerns for review. A submitted report represents a user's concern and does not by itself establish fraud, corruption, or wrongdoing.
              </p>
            </div>
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

        {/* Download Action Buttons */}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={downloadingCsv}
            className="rounded-xs bg-institutional px-5 py-2.5 text-xs font-bold tracking-[0.08em] text-white hover:bg-institutional-dark transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <span>📥</span> {downloadingCsv ? "Generating CSV..." : "Download Filtered Dataset (CSV)"}
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="rounded-xs bg-saffron px-5 py-2.5 text-xs font-bold tracking-[0.08em] text-white hover:bg-saffron-dark transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <span>📄</span> {downloadingPdf ? "Generating PDF..." : "Download Official Report (PDF)"}
          </button>
        </div>

        {/* Report Preview Section */}
        <div className="mt-8 border border-rule bg-card p-6 rounded-xs shadow-xs">
          <div className="flex items-center justify-between border-b border-rule pb-3 mb-4">
            <h2 className="text-base font-bold text-institutional">Live Report Summary Preview</h2>
            {loading && <span className="text-xs text-muted-foreground font-mono">Loading data from PostgreSQL...</span>}
          </div>

          {preview ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-background border border-rule p-4 rounded-xs">
                <div>
                  <p className="label-caps text-muted-foreground">Scope Year</p>
                  <p className="text-sm font-bold text-institutional mt-0.5">{preview.financial_year}</p>
                </div>
                <div>
                  <p className="label-caps text-muted-foreground">Scope Department</p>
                  <p className="text-sm font-bold text-institutional mt-0.5 truncate">{preview.ministry}</p>
                </div>
                <div>
                  <p className="label-caps text-muted-foreground">Total Budget Allocation</p>
                  <p className="text-sm font-black text-institutional mt-0.5 font-mono">{formatCr(preview.total_budget)}</p>
                </div>
              </div>

              {/* Top Budget Items Table */}
              <div>
                <h3 className="label-caps text-saffron mb-2">Top Record Allocations</h3>
                <div className="overflow-x-auto border border-rule rounded-xs">
                  <table className="min-w-full text-xs divide-y divide-rule bg-background">
                    <thead className="bg-institutional/5">
                      <tr>
                        <th className="px-3 py-2 text-left label-caps text-muted-foreground">Record ID</th>
                        <th className="px-3 py-2 text-left label-caps text-muted-foreground">Budget Item / Description</th>
                        <th className="px-3 py-2 text-left label-caps text-muted-foreground">Expenditure Category</th>
                        <th className="px-3 py-2 text-right label-caps text-muted-foreground">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule font-mono">
                      {preview.top_items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 text-muted-foreground">#{item.record_id}</td>
                          <td className="px-3 py-2 font-semibold text-foreground max-w-xs truncate">{item.budget_item}</td>
                          <td className="px-3 py-2 text-muted-foreground">{item.expenditure_category}</td>
                          <td className="px-3 py-2 text-right font-bold text-institutional">{formatCr(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : !loading && (
            <p className="text-xs text-muted-foreground">Select filters above to generate a report preview.</p>
          )}
        </div>

        {/* SECTION 2 & 3: RAISE A BUDGET CONCERN */}
        <div className="mt-10 border-2 border-saffron/40 bg-card p-6 rounded-xs shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-4 mb-4">
            <div>
              <p className="label-caps text-saffron">Citizen Transparency & Accountability</p>
              <h2 className="text-xl font-black text-institutional tracking-[0.04em] mt-0.5">
                Raise a Budget Concern
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Found a suspicious allocation, possible discrepancy, or other budget-related issue? Submit your concern for review.
              </p>
            </div>
            <button
              type="button"
              onClick={openReportModal}
              className="rounded-xs bg-destructive px-5 py-2.5 text-xs font-bold tracking-[0.08em] text-white hover:bg-destructive/90 transition-colors shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <span>🚩</span> Report an Issue
            </button>
          </div>

          <p className="text-[0.72rem] text-muted-foreground leading-relaxed">
            CivicLens provides a structured platform for citizens to highlight questionable financial figures, missing records, or unexplained spikes. Submitted reports are processed by the transparency review team and do not establish wrongdoing as a fact.
          </p>

          {/* User's Submitted Concerns List */}
          {user && myReports.length > 0 && (
            <div className="mt-6 border-t border-rule pt-4">
              <h3 className="label-caps text-institutional mb-3">My Submitted Concerns ({myReports.length})</h3>
              <div className="space-y-2">
                {myReports.map((rep) => (
                  <div key={rep.id} className="border border-rule bg-background p-3 rounded-xs text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-institutional">#{rep.id}</span>
                        <span className="font-semibold text-foreground">{rep.issue_title}</span>
                      </div>
                      <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                        Category: <strong>{rep.issue_category}</strong> | FY: {rep.financial_year || "All"} | Submitted: {new Date(rep.created_at).toLocaleDateString()} {rep.is_anonymous ? "(Anonymous)" : ""}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase shrink-0 ${
                      rep.status === "resolved"
                        ? "bg-positive/10 text-positive border border-positive/30"
                        : rep.status === "under_review"
                        ? "bg-saffron/15 text-saffron-dark border border-saffron/30"
                        : rep.status === "dismissed"
                        ? "bg-muted text-muted-foreground border border-rule"
                        : "bg-institutional/10 text-institutional border border-institutional/30"
                    }`}>
                      {rep.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* REPORT CONCERN MODAL */}
        {isReportModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-card border-2 border-institutional p-6 rounded-xs shadow-lg max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-rule pb-3">
                <div>
                  <p className="label-caps text-saffron">Citizen Transparency System</p>
                  <h3 className="text-lg font-black text-institutional">Report a Budget Concern</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xs text-xs font-semibold text-destructive">
                  ⚠️ {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                {/* 1. Category */}
                <div>
                  <label htmlFor="issue-category" className="label-caps text-muted-foreground block mb-1">Issue Category <span className="text-destructive">*</span></label>
                  <select
                    id="issue-category"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full rounded-xs border border-rule bg-background p-2 font-bold text-foreground"
                    required
                  >
                    {dbCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* 2 & 3. Year & Ministry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="issue-fy" className="label-caps text-muted-foreground block mb-1">Related Financial Year (Optional):</label>
                    <select
                      id="issue-fy"
                      value={formYear}
                      onChange={e => setFormYear(e.target.value)}
                      className="w-full rounded-xs border border-rule bg-background p-2 text-foreground"
                    >
                      <option value="">Select Financial Year</option>
                      {dbYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="issue-dept" className="label-caps text-muted-foreground block mb-1">Ministry / Department (Optional):</label>
                    <select
                      id="issue-dept"
                      value={formDept}
                      onChange={e => setFormDept(e.target.value)}
                      className="w-full rounded-xs border border-rule bg-background p-2 text-foreground truncate"
                    >
                      <option value="">Select Ministry / Department</option>
                      {dbDepts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* 4. Budget Item */}
                <div>
                  <label htmlFor="issue-item" className="label-caps text-muted-foreground block mb-1">Related Budget Item / Scheme (Optional):</label>
                  <input
                    id="issue-item"
                    type="text"
                    value={formItem}
                    onChange={e => setFormItem(e.target.value)}
                    placeholder="e.g. Samagra Shiksha, Defence Pensions, Fertilizer Subsidy"
                    className="w-full rounded-xs border border-rule bg-background p-2 text-foreground"
                  />
                </div>

                {/* 5. Issue Title */}
                <div>
                  <label htmlFor="issue-title" className="label-caps text-muted-foreground block mb-1">Issue Title <span className="text-destructive">*</span> (Max 150 chars)</label>
                  <input
                    id="issue-title"
                    type="text"
                    maxLength={150}
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="e.g. Unusual increase in allocation compared with previous year"
                    className="w-full rounded-xs border border-rule bg-background p-2 font-semibold text-foreground"
                    required
                  />
                </div>

                {/* 6. Detailed Description */}
                <div>
                  <label htmlFor="issue-desc" className="label-caps text-muted-foreground block mb-1">Detailed Description <span className="text-destructive">*</span> (Min 20 chars)</label>
                  <textarea
                    id="issue-desc"
                    rows={4}
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="Provide details about the suspicious allocation, discrepancy, or concern..."
                    className="w-full rounded-xs border border-rule bg-background p-2 text-foreground"
                    required
                  />
                </div>

                {/* 7. Evidence Reference */}
                <div>
                  <label htmlFor="issue-evidence" className="label-caps text-muted-foreground block mb-1">Evidence / Source Reference (Optional):</label>
                  <textarea
                    id="issue-evidence"
                    rows={2}
                    value={formEvidence}
                    onChange={e => setFormEvidence(e.target.value)}
                    placeholder="e.g. Official Document Page 42, Statement 3 Record ID #4059, Public URL"
                    className="w-full rounded-xs border border-rule bg-background p-2 text-foreground"
                  />
                </div>

                {/* 8. Anonymous Toggle */}
                <div className="flex items-center gap-2 border border-rule bg-background p-2.5 rounded-xs">
                  <input
                    type="checkbox"
                    id="issue-anonymous"
                    checked={formAnonymous}
                    onChange={e => setFormAnonymous(e.target.checked)}
                    className="rounded-xs text-institutional focus:ring-institutional cursor-pointer"
                  />
                  <label htmlFor="issue-anonymous" className="font-semibold text-foreground cursor-pointer">
                    Submit anonymously (Hides your identity from public admin listings)
                  </label>
                </div>

                {/* 9. Declaration Checkbox */}
                <div className="flex items-start gap-2 bg-saffron/10 border border-saffron/30 p-3 rounded-xs">
                  <input
                    type="checkbox"
                    id="issue-declaration"
                    checked={formDeclaration}
                    onChange={e => setFormDeclaration(e.target.checked)}
                    className="mt-0.5 rounded-xs text-saffron focus:ring-saffron cursor-pointer"
                    required
                  />
                  <label htmlFor="issue-declaration" className="text-[0.7rem] font-semibold text-foreground leading-snug cursor-pointer">
                    I understand that this submission is a concern for review and does not establish wrongdoing as fact. <span className="text-destructive">*</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 rounded-xs border border-rule bg-background text-foreground hover:bg-muted font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 rounded-xs bg-institutional text-white hover:bg-institutional-dark font-bold disabled:opacity-50 cursor-pointer"
                  >
                    {formSubmitting ? "Submitting..." : "Submit Concern"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
