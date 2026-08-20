import { useState } from "react";
import { AGENT_ACTIVITY_LOGS } from "@/data/mockData";

export default function AdminActivity() {
  const [filterCategory, setFilterCategory] = useState("All");

  const categories = ["All", "Data Processing", "Anomaly Detection", "RAG", "AI Explanation"];

  const filteredLogs = filterCategory === "All"
    ? AGENT_ACTIVITY_LOGS
    : AGENT_ACTIVITY_LOGS.filter(l => l.category === filterCategory);

  return (
    <div className="portal-container pb-14">
      <div className="border-b-2 border-rule pb-4 mb-6">
        <h1 className="text-xl font-bold text-institutional">Live Agentic AI Execution Feed</h1>
        <p className="text-xs text-muted-foreground">Detailed trace log of background subtasks performed by CivicLens AI.</p>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 text-xs font-bold rounded-xs transition-colors ${
              filterCategory === cat
                ? "bg-institutional text-white shadow-xs"
                : "bg-card text-institutional border border-rule hover:bg-institutional/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Log Feed */}
      <div className="border border-rule bg-card rounded-xs shadow-xs p-5 space-y-3">
        {filteredLogs.map(log => (
          <div key={log.id} className="p-4 border border-rule rounded-xs bg-background flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-institutional">[{log.timestamp}]</span>
                <span className="font-bold text-sm text-foreground">{log.message}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
            </div>

            <span className="self-start sm:self-auto text-[0.68rem] font-bold px-2.5 py-1 rounded-full bg-saffron/20 text-institutional-dark border border-saffron/30">
              {log.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
