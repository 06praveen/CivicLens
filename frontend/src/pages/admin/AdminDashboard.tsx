import { ADMIN_METRICS, AGENT_ACTIVITY_LOGS } from "@/data/mockData";

export default function AdminDashboard() {
  return (
    <div className="portal-container pb-14">
      <div className="border-b-2 border-rule pb-4 mb-6">
        <h1 className="text-xl font-bold text-institutional">System Metrics & Overview</h1>
        <p className="text-xs text-muted-foreground">Monitored datasets, pipeline health, and active RAG agents.</p>
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
