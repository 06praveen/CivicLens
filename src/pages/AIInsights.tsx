import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { INSIGHTS, type Insight } from "@/data/insightsData";
import { YOY_DATA } from "@/data/budgetData";

const typeIcon: Record<Insight["type"], string> = {
  increase: "📈",
  decrease: "📉",
  signal:   "⚡",
  yoy:      "📊",
};

const typeBorder: Record<Insight["type"], string> = {
  increase: "border-l-4 border-positive",
  decrease: "border-l-4 border-negative",
  signal:   "border-l-4 border-saffron",
  yoy:      "border-l-4 border-institutional",
};

function InsightCard({ insight, onExplain }: { insight: Insight; onExplain: (i: Insight) => void }) {
  const { t, lang } = useApp();
  const [expanded, setExpanded] = useState(false);
  const title = lang === "hi" ? insight.titleHi : insight.title;
  const body  = lang === "hi" ? insight.bodyHi  : insight.body;

  return (
    <div className={`rounded-xs bg-card shadow-xs hover:shadow-sm transition-shadow ${typeBorder[insight.type]} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-2xl leading-none shrink-0 mt-0.5">{typeIcon[insight.type]}</span>
          <div className="min-w-0">
            <span className="label-caps text-muted-foreground block mb-1">{insight.sector}</span>
            <h3 className="font-bold text-institutional text-sm sm:text-base leading-snug">{title}</h3>
          </div>
        </div>
        <span className={`shrink-0 text-lg font-black ${insight.statPositive ? "text-positive" : "text-negative"}`}>
          {insight.stat}
        </span>
      </div>

      {expanded && (
        <div className="mt-3 pl-9">
          <p className="text-sm leading-relaxed text-foreground/80">{body}</p>
          <div className="mt-3 rounded-xs bg-institutional/5 border border-rule px-3 py-2">
            <p className="label-caps text-muted-foreground mb-1">{t("ask_source")}</p>
            <p className="text-xs text-institutional font-semibold">
              {lang === "hi" ? insight.evidenceHi : insight.evidence}
            </p>
          </div>
        </div>
      )}

      <div className="mt-3 pl-9 flex gap-3">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="text-xs font-bold text-institutional hover:text-saffron underline-offset-2 hover:underline"
        >
          {expanded ? "▲ Hide" : "▼ " + t("ai_explain")}
        </button>
        <button
          type="button"
          onClick={() => onExplain(insight)}
          className="text-xs font-bold text-gov-blue hover:underline underline-offset-2"
        >
          {t("ai_evidence")}
        </button>
        <span className="ml-auto label-caps text-muted-foreground bg-rule px-2 py-0.5 rounded-full">{t("ai_badge")}</span>
      </div>
    </div>
  );
}

// Mini YoY bar chart (inline SVG)
function YoYMiniChart() {
  const max = Math.max(...YOY_DATA.map(d => d.budget));
  const h = 100;
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[400px]">
        <svg viewBox={`0 0 ${YOY_DATA.length * 70 + 20} ${h + 30}`} className="w-full">
          {YOY_DATA.map((d, i) => {
            const barH = (d.budget / max) * h;
            const x = 20 + i * 70;
            return (
              <g key={d.year}>
                <rect x={x} y={h - barH} width={40} height={barH} fill="#1e3a8a" rx="2" />
                <text x={x + 20} y={h + 14} fontSize="7.5" textAnchor="middle" fill="#6b7280">{d.year.slice(2, 4)}-{d.year.slice(7)}</text>
                <text x={x + 20} y={h - barH - 4} fontSize="7" textAnchor="middle" fill="#1e3a8a" fontWeight="700">
                  {(d.budget / 100000).toFixed(1)}L
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function AIInsights() {
  const { t, lang } = useApp();
  const [activeFilter, setActiveFilter] = useState<"all" | Insight["type"]>("all");
  const [evidenceModal, setEvidenceModal] = useState<Insight | null>(null);

  const filters: { key: "all" | Insight["type"]; label: string }[] = [
    { key: "all",      label: "All Insights" },
    { key: "increase", label: t("ai_spending_up") },
    { key: "decrease", label: t("ai_spending_down") },
    { key: "signal",   label: t("ai_key_signals") },
    { key: "yoy",      label: t("ai_yoy") },
  ];

  const filtered = activeFilter === "all" ? INSIGHTS : INSIGHTS.filter(i => i.type === activeFilter);

  return (
    <PageLayout>
      <div className="portal-container pb-14">
        {/* Page header */}
        <div className="border-b-4 border-saffron py-6">
          <p className="label-caps text-saffron">Union Budget 2026–27</p>
          <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">{t("ai_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("ai_subtitle")}</p>
          <p className="mt-2 text-xs text-attention bg-attention/10 border border-attention/30 rounded-xs px-3 py-1.5 inline-block">{t("ai_note")}</p>
        </div>

        {/* Filter tabs */}
        <div className="mt-5 flex flex-wrap gap-2">
          {filters.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1.5 rounded-xs text-xs font-bold border transition-colors ${
                activeFilter === f.key
                  ? "bg-institutional text-white border-institutional"
                  : "border-rule bg-card text-foreground hover:border-institutional/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Insights grid */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(insight => (
            <InsightCard key={insight.id} insight={insight} onExplain={setEvidenceModal} />
          ))}
        </div>

        {/* YoY Chart */}
        <div className="mt-8 border border-rule bg-card rounded-xs p-5 shadow-xs">
          <h2 className="font-bold text-institutional mb-4 flex items-center gap-2">
            <span className="h-4 w-1 bg-saffron rounded-full" />
            {t("ai_yoy")} — Total Budget (₹ Lakh Crore)
          </h2>
          <YoYMiniChart />
        </div>

        {/* Evidence modal */}
        {evidenceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setEvidenceModal(null)}>
            <div className="w-full max-w-lg rounded-sm bg-card border border-rule shadow-2xl p-6" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-institutional text-base mb-1">
                {lang === "hi" ? evidenceModal.titleHi : evidenceModal.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{evidenceModal.sector}</p>
              <p className="text-sm leading-relaxed text-foreground/85">
                {lang === "hi" ? evidenceModal.bodyHi : evidenceModal.body}
              </p>
              <div className="mt-4 bg-institutional/5 border border-rule rounded-xs px-4 py-3">
                <p className="label-caps text-muted-foreground mb-1">{t("ask_source")}</p>
                <p className="text-xs font-semibold text-institutional">
                  {lang === "hi" ? evidenceModal.evidenceHi : evidenceModal.evidence}
                </p>
              </div>
              <button type="button" onClick={() => setEvidenceModal(null)}
                className="mt-4 border border-rule px-4 py-2 text-xs font-bold text-foreground hover:bg-rule rounded-xs">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
