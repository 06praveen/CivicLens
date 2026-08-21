import { useState, useEffect } from "react";
import { ADMIN_METRICS, AGENT_ACTIVITY_LOGS } from "@/data/mockData";
import { getAdminReports, updateAdminReport } from "@/api/budgets";

interface IssueReportItem {
  id: number;
  user_id?: number;
  is_anonymous: boolean;
  issue_category: string;
  financial_year?: string;
  ministry_department?: string;
  budget_item?: string;
  issue_title: string;
  description: string;
  evidence_reference?: string;
  status: string;
  priority: string;
  admin_notes?: string;
  created_at: string;
  reporter_name: string;
}

export default function AdminDashboard() {
  const [reports, setReports] = useState<IssueReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<IssueReportItem | null>(null);

  // Edit Admin Form State
  const [editStatus, setEditStatus] = useState<string>("submitted");
  const [editPriority, setEditPriority] = useState<string>("normal");
  const [editAdminNotes, setEditAdminNotes] = useState<string>("");
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const fetchReports = () => {
    setLoadingReports(true);
    getAdminReports({ status: statusFilter })
      .then(data => {
        setReports(data);
        setLoadingReports(false);
      })
      .catch(err => {
        console.warn("Failed to fetch admin issue reports:", err);
        setLoadingReports(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const openDetailModal = (r: IssueReportItem) => {
    setSelectedReport(r);
    setEditStatus(r.status);
    setEditPriority(r.priority);
    setEditAdminNotes(r.admin_notes || "");
    setUpdateMsg(null);
  };

  const handleUpdateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setUpdating(true);
    setUpdateMsg(null);
    try {
      const updated = await updateAdminReport(selectedReport.id, {
        status: editStatus,
        priority: editPriority,
        admin_notes: editAdminNotes,
      });

      setUpdateMsg("Report updated successfully.");
      setSelectedReport(updated);
      fetchReports();
    } catch (err: any) {
      console.error("Failed to update report:", err);
      setUpdateMsg("Failed to update report: " + (err.message || "Error"));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="portal-container pb-14">
      <div className="border-b-2 border-rule pb-4 mb-6">
        <h1 className="text-xl font-bold text-institutional">System Metrics & Admin Overview</h1>
        <p className="text-xs text-muted-foreground">Monitored datasets, citizen budget concern reports, and RAG agent activity.</p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {ADMIN_METRICS.map((m, idx) => (
          <div key={idx} className="border border-rule bg-card p-5 rounded-xs shadow-xs">
            <p className="label-caps text-muted-foreground">{m.title}</p>
            <p className="text-2xl font-black text-institutional mt-2">{m.count}</p>
            <p className={`text-xs font-semibold mt-1 ${m.positive ? "text-positive" : "text-negative"}`}>
              {m.change}
            </p>
          </div>
        ))}
      </div>

      {/* ADMIN SECTION: CITIZEN BUDGET ISSUE REPORTS MANAGEMENT */}
      <div className="border-2 border-institutional/30 bg-card p-6 rounded-xs shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-4 mb-4">
          <div>
            <p className="label-caps text-saffron">Citizen Accountability System</p>
            <h2 className="text-lg font-black text-institutional">Citizen Budget Concern Reports ({reports.length})</h2>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="admin-status-filter" className="text-xs font-bold text-muted-foreground">Status Filter:</label>
            <select
              id="admin-status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-xs border border-rule bg-background p-1.5 text-xs font-bold text-institutional"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="needs_information">Needs Information</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        {loadingReports ? (
          <p className="text-xs text-muted-foreground font-mono">Loading issue reports from PostgreSQL...</p>
        ) : reports.length === 0 ? (
          <p className="text-xs text-muted-foreground">No citizen budget concern reports found matching selected filter.</p>
        ) : (
          <div className="overflow-x-auto border border-rule rounded-xs">
            <table className="min-w-full text-xs divide-y divide-rule bg-background">
              <thead className="bg-institutional/5">
                <tr>
                  <th className="px-3 py-2 text-left label-caps text-muted-foreground">ID</th>
                  <th className="px-3 py-2 text-left label-caps text-muted-foreground">Category</th>
                  <th className="px-3 py-2 text-left label-caps text-muted-foreground">Issue Title</th>
                  <th className="px-3 py-2 text-left label-caps text-muted-foreground">FY / Ministry</th>
                  <th className="px-3 py-2 text-left label-caps text-muted-foreground">Reporter</th>
                  <th className="px-3 py-2 text-left label-caps text-muted-foreground">Priority</th>
                  <th className="px-3 py-2 text-left label-caps text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-right label-caps text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-institutional/5 transition-colors">
                    <td className="px-3 py-2 font-mono font-bold text-institutional">#{r.id}</td>
                    <td className="px-3 py-2 text-foreground font-semibold max-w-[140px] truncate">{r.issue_category}</td>
                    <td className="px-3 py-2 font-bold text-foreground max-w-[200px] truncate">{r.issue_title}</td>
                    <td className="px-3 py-2 text-muted-foreground text-[0.7rem]">
                      {r.financial_year || "All"} | {r.ministry_department || "General"}
                    </td>
                    <td className="px-3 py-2 text-foreground font-semibold">
                      {r.is_anonymous ? (
                        <span className="text-muted-foreground italic font-mono text-[0.7rem]">Anonymous Citizen</span>
                      ) : (
                        r.reporter_name
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase ${
                        r.priority === "urgent" || r.priority === "high"
                          ? "bg-destructive/10 text-destructive border border-destructive/30"
                          : "bg-muted text-muted-foreground border border-rule"
                      }`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase ${
                        r.status === "resolved"
                          ? "bg-positive/10 text-positive border border-positive/30"
                          : r.status === "under_review"
                          ? "bg-saffron/15 text-saffron-dark border border-saffron/30"
                          : r.status === "dismissed"
                          ? "bg-muted text-muted-foreground border border-rule"
                          : "bg-institutional/10 text-institutional border border-institutional/30"
                      }`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => openDetailModal(r)}
                        className="px-2.5 py-1 rounded-xs bg-institutional text-white font-bold text-[0.68rem] hover:bg-institutional-dark cursor-pointer"
                      >
                        Review Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REPORT DETAIL & ADMIN EDIT MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-card border-2 border-institutional p-6 rounded-xs shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <div>
                <p className="label-caps text-saffron">Admin Review Portal</p>
                <h3 className="text-lg font-black text-institutional">Issue Report #{selectedReport.id}: {selectedReport.issue_title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {updateMsg && (
              <div className="p-3 bg-institutional/10 border border-institutional/30 rounded-xs text-xs font-semibold text-institutional">
                ℹ️ {updateMsg}
              </div>
            )}

            <div className="bg-background border border-rule p-4 rounded-xs text-xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-rule pb-2">
                <div>
                  <p className="label-caps text-muted-foreground">Category</p>
                  <p className="font-bold text-foreground">{selectedReport.issue_category}</p>
                </div>
                <div>
                  <p className="label-caps text-muted-foreground">Financial Year</p>
                  <p className="font-bold text-foreground">{selectedReport.financial_year || "Not specified"}</p>
                </div>
                <div>
                  <p className="label-caps text-muted-foreground">Reporter</p>
                  <p className="font-bold text-foreground">
                    {selectedReport.is_anonymous ? "Anonymous Citizen" : selectedReport.reporter_name}
                  </p>
                </div>
              </div>

              {selectedReport.ministry_department && (
                <div>
                  <p className="label-caps text-muted-foreground">Ministry / Department</p>
                  <p className="font-bold text-institutional">{selectedReport.ministry_department}</p>
                </div>
              )}

              {selectedReport.budget_item && (
                <div>
                  <p className="label-caps text-muted-foreground">Budget Item / Scheme</p>
                  <p className="font-semibold text-foreground">{selectedReport.budget_item}</p>
                </div>
              )}

              <div>
                <p className="label-caps text-muted-foreground mb-1">Detailed Concern Description</p>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed border border-rule p-2.5 rounded-xs bg-card">
                  {selectedReport.description}
                </p>
              </div>

              {selectedReport.evidence_reference && (
                <div>
                  <p className="label-caps text-muted-foreground mb-1">Evidence / Source Reference</p>
                  <p className="font-mono text-[0.7rem] text-institutional border border-rule p-2 rounded-xs bg-card">
                    {selectedReport.evidence_reference}
                  </p>
                </div>
              )}
            </div>

            {/* Admin Management Controls Form */}
            <form onSubmit={handleUpdateReport} className="space-y-3 text-xs pt-2 border-t border-rule">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-edit-status" className="label-caps text-muted-foreground block mb-1">Update Status:</label>
                  <select
                    id="admin-edit-status"
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    className="w-full rounded-xs border border-rule bg-background p-2 font-bold text-institutional"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="needs_information">Needs Information</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="admin-edit-priority" className="label-caps text-muted-foreground block mb-1">Set Priority:</label>
                  <select
                    id="admin-edit-priority"
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value)}
                    className="w-full rounded-xs border border-rule bg-background p-2 font-bold text-institutional"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="admin-edit-notes" className="label-caps text-muted-foreground block mb-1">Internal Admin Notes:</label>
                <textarea
                  id="admin-edit-notes"
                  rows={3}
                  value={editAdminNotes}
                  onChange={e => setEditAdminNotes(e.target.value)}
                  placeholder="Add internal audit notes or investigation findings..."
                  className="w-full rounded-xs border border-rule bg-background p-2 text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xs border border-rule bg-background font-bold text-foreground hover:bg-muted cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xs bg-institutional text-white font-bold hover:bg-institutional-dark disabled:opacity-50 cursor-pointer"
                >
                  {updating ? "Saving..." : "Save Admin Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent Agent Activity Preview */}
      <div className="border border-rule bg-card p-6 rounded-xs shadow-xs">
        <h2 className="text-base font-bold text-institutional mb-4">Recent Agentic AI Subtask Execution</h2>
        <div className="space-y-3">
          {AGENT_ACTIVITY_LOGS.slice(0, 4).map(log => (
            <div key={log.id} className="flex items-start justify-between p-3 border border-rule rounded-xs bg-background">
              <div>
                <span className="text-xs font-bold text-institutional font-mono">[{log.timestamp}]</span>
                <span className="ml-2 text-xs font-semibold text-foreground">{log.message}</span>
                <p className="text-[0.7rem] text-muted-foreground mt-0.5">{log.details}</p>
              </div>
              <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-institutional/10 text-institutional">
                {log.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
