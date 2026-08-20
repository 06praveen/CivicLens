import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BUDGET_YEARS_DATA } from "@/data/budgetData";

export function BudgetYearSection() {
  const [activeYearIndex, setActiveYearIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeftState, setScrollLeftState] = useState<number>(0);

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

  // ── Mouse Cursor Drag to Scroll Handlers ──
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    if (e.button !== 0) return; // Only main click
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeftState(containerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    containerRef.current.scrollLeft = scrollLeftState - walk;
  };

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

        {/* ── Horizontal Scroll Container (Mouse Cursor Drag Scrollable) ── */}
        <div
          ref={containerRef}
          tabIndex={0}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          aria-label={`Horizontal list of budget years. Currently showing Union Budget ${activeYear.year}`}
          className={`flex flex-row overflow-x-auto border border-rule rounded-xs bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-institutional/20 transition-all select-none ${
            isDragging
              ? "cursor-grabbing scroll-auto"
              : "cursor-grab snap-x snap-mandatory scrollbar-thin scrollbar-thumb-institutional/30 scrollbar-track-rule/40"
          }`}
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

                  <div className={`relative aspect-video w-full rounded-xs overflow-hidden border border-rule bg-black shadow-sm ${isDragging ? "pointer-events-none" : ""}`}>
                    <iframe
                      src={`https://www.youtube.com/embed/${item.videoId}`}
                      title={`Union Budget ${item.year} Presentation Video`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
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
