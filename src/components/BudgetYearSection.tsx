import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BUDGET_YEARS_DATA } from "@/data/budgetData";

export function BudgetYearSection() {
  const [activeYearIndex, setActiveYearIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observerOptions = {
      root: container,
      threshold: 0.55,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const indexAttr = entry.target.getAttribute("data-year-index");
          if (indexAttr !== null) {
            const index = parseInt(indexAttr, 10);
            if (!isNaN(index)) {
              setActiveYearIndex(index);
            }
          }
        }
      });
    }, observerOptions);

    panelRefs.current.forEach((panel) => {
      if (panel) observer.observe(panel);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const activeYear = BUDGET_YEARS_DATA[activeYearIndex] || BUDGET_YEARS_DATA[0];

  return (
    <section 
      className="bg-white border-y border-rule py-12 mb-12" 
      aria-label="Union Budget — Year-wise Overview"
    >
      <div className="portal-container">
        {/* ── Section Header ── */}
        <div className="border-b-2 border-institutional/20 pb-3 pt-2 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="h-5 w-1.5 rounded-full bg-saffron shrink-0" />
            <h2 className="text-lg font-bold tracking-[0.12em] text-institutional sm:text-xl uppercase">
              Union Budget — Year-wise Overview
            </h2>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Watch the Union Budget presentation and explore a concise summary of the key announcements, allocations and priorities.
        </p>

        {/* ── Active Year Visual Indicator Bar (Non-clickable / Visual Only) ── */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div 
            aria-hidden="true" 
            className="inline-flex items-center gap-3 sm:gap-5 py-2 px-4 bg-institutional/5 border border-rule rounded-xs text-xs select-none pointer-events-none shadow-2xs"
          >
            <span className="font-bold text-institutional uppercase tracking-widest text-[11px]">
              Active Year:
            </span>
            <div className="flex items-center gap-3 sm:gap-4">
              {BUDGET_YEARS_DATA.map((item, idx) => {
                const isActive = idx === activeYearIndex;
                return (
                  <div key={item.year} className="flex items-center gap-1.5">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                        isActive
                          ? "bg-saffron ring-2 ring-saffron/30 scale-110"
                          : "bg-institutional/25"
                      }`}
                    />
                    <span
                      className={`font-semibold tracking-tight ${
                        isActive
                          ? "text-institutional font-bold"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      {item.year}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Horizontal Scroll Hint */}
          <div className="text-xs text-muted-foreground/80 flex items-center gap-1.5 font-medium select-none">
            <svg className="w-4 h-4 text-saffron shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span>Scroll horizontally for other years ({activeYear.year})</span>
          </div>
        </div>

        {/* ── Horizontal Scroll Container ── */}
        <div
          ref={containerRef}
          tabIndex={0}
          aria-label={`Horizontal list of budget years. Currently showing Union Budget ${activeYear.year}`}
          className="flex flex-row overflow-x-auto snap-x snap-mandatory scrollbar-thin scrollbar-thumb-institutional/30 scrollbar-track-rule/40 border border-rule rounded-xs bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-institutional/20"
        >
          {BUDGET_YEARS_DATA.map((item, idx) => (
            <div
              key={item.year}
              ref={(el) => { panelRefs.current[idx] = el; }}
              data-year-index={idx}
              className="snap-start min-w-full w-full shrink-0 flex-none p-4 sm:p-6 lg:p-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                
                {/* ── LEFT COLUMN: YouTube Budget Video ── */}
                <div className="lg:col-span-7 flex flex-col justify-center">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-institutional/10 text-institutional text-xs font-bold tracking-wider uppercase">
                      <svg className="w-3.5 h-3.5 text-saffron fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Budget Presentation Video
                    </span>
                    <span className="text-xs font-bold tracking-wider text-institutional/70">
                      Union Budget {item.year}
                    </span>
                  </div>

                  <div className="relative aspect-video w-full rounded-xs overflow-hidden border border-rule bg-institutional/95 shadow-sm group">
                    {item.videoId && item.videoId !== "REPLACE_WITH_REAL_VIDEO_ID" ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${item.videoId}?rel=0`}
                        title={`Union Budget ${item.year} Presentation Video`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-gradient-to-br from-institutional-dark via-institutional to-institutional/90">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-inner">
                          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-saffron fill-current ml-1" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                          Union Budget {item.year}
                        </h3>
                        <p className="text-xs text-white/75 max-w-sm mb-3 leading-relaxed">
                          Watch the official budget speech and video presentation.
                        </p>
                        <span className="inline-block px-2.5 py-1 text-[11px] font-mono rounded-xs bg-white/10 text-white/90 border border-white/15">
                          YouTube Video ID: {item.videoId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── RIGHT COLUMN: Budget Summary ── */}
                <div className="lg:col-span-5 flex flex-col justify-between bg-ivory/60 p-5 sm:p-6 border border-rule rounded-xs">
                  <div>
                    <div className="border-b border-rule pb-3 mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-saffron block mb-0.5">
                        Key Highlights
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-institutional">
                        Budget {item.year} — Key Highlights
                      </h3>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {item.summary.map((point, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90 leading-relaxed">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-saffron shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-rule/60 flex items-center justify-between">
                    <Link
                      to="/budget-at-a-glance"
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-wide text-gov-blue hover:text-saffron transition-colors group"
                    >
                      <span>View Full Summary</span>
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                    <span className="text-[11px] font-bold text-institutional/60 uppercase tracking-wider">
                      {item.year}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
