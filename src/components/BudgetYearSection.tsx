import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BUDGET_YEARS_DATA, BudgetYearItem } from "@/data/budgetData";

// ── Inline Video Player Component ───────────────────────────────────────────
function BudgetVideoPlayer({
  item,
  isDragging,
}: {
  item: BudgetYearItem;
  isDragging: boolean;
}) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(false);
  }, [item.videoId]);

  const thumbnailUrl = `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`;
  const embedSrc = `https://www.youtube.com/embed/${item.videoId}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <div
      className={`relative aspect-video w-full rounded-sm overflow-hidden border border-rule bg-black shadow-sm group ${
        isDragging ? "pointer-events-none select-none" : ""
      }`}
    >
      {playing ? (
        /* ── Embedded Video Stream ── */
        <>
          <iframe
            key={item.videoId}
            src={embedSrc}
            title={item.title}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          <button
            type="button"
            onClick={() => setPlaying(false)}
            className="absolute top-2 right-2 z-20 bg-black/85 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border border-white/20 transition-colors cursor-pointer"
          >
            ✕ Close Stream
          </button>
        </>
      ) : (
        /* ── Video Poster / Thumbnail Preview ── */
        <div
          className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group select-none"
          onClick={() => setPlaying(true)}
          role="button"
          tabIndex={0}
          aria-label={`Play ${item.title}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setPlaying(true);
          }}
        >
          {/* Background Thumbnail */}
          <img
            src={thumbnailUrl}
            alt={`Thumbnail for ${item.title}`}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/50 group-hover:from-black/80 transition-all" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/80 px-2.5 py-1 rounded text-[11px] font-bold text-white uppercase tracking-wider z-10 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
            PIB India Official
          </div>

          <div className="absolute top-3 right-3 bg-saffron text-institutional-dark text-[11px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider z-10 shadow-sm">
            FY {item.year}
          </div>

          {/* Center Play Button */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 group-hover:bg-red-500 group-hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-2xl">
              <svg className="w-8 h-8 sm:w-9 sm:h-9 fill-white ml-1" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-white text-xs sm:text-sm font-bold tracking-wide drop-shadow-md">
              Click to Watch Parliamentary Broadcast
            </span>
          </div>

          {/* Bottom Title Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <p className="text-white text-xs sm:text-sm font-bold line-clamp-1 drop-shadow-sm">
              {item.title}
            </p>
            <p className="text-white/70 text-[11px] mt-0.5">
              Official Parliamentary Address — Finance Minister Nirmala Sitharaman
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Section with Video on Left & Summary on Right (Drag Scroll Carousel) ──
export function BudgetYearSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  // ── Intersection Observer to Track Active Slide ──
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
          const indexAttr = entry.target.getAttribute("data-slide-index");
          if (indexAttr !== null) {
            const index = parseInt(indexAttr, 10);
            if (!isNaN(index)) {
              setActiveIndex(index);
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

  // ── Drag-to-Scroll Mouse Handlers ──
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    if (e.button !== 0) return;
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

  // ── Scroll Arrow Button Navigation ──
  const scrollToSlide = (index: number) => {
    if (index < 0 || index >= BUDGET_YEARS_DATA.length) return;
    const targetPanel = panelRefs.current[index];
    if (targetPanel && containerRef.current) {
      containerRef.current.scrollTo({
        left: targetPanel.offsetLeft,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      className="bg-white border-y border-rule py-12 mb-12"
      aria-label="Union Budget — Parliament Speeches Carousel"
    >
      <div className="portal-container">
        {/* ── Section Header ── */}
        <div className="border-b-2 border-institutional/20 pb-3 pt-2 mb-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-5 w-1.5 rounded-full bg-saffron shrink-0" />
            <h2 className="text-lg font-bold tracking-[0.12em] text-institutional sm:text-xl uppercase">
              Union Budget — Parliament Speeches Overview
            </h2>
          </div>

          {/* Controls: Prev / Next buttons + Counter */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold font-mono text-institutional/70 bg-ivory px-2.5 py-1 border border-rule rounded">
              {activeIndex + 1} / {BUDGET_YEARS_DATA.length}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollToSlide(activeIndex - 1)}
                disabled={activeIndex === 0}
                aria-label="Previous Broadcast"
                className="w-8 h-8 rounded border border-rule bg-ivory hover:bg-institutional hover:text-white disabled:opacity-40 disabled:hover:bg-ivory disabled:hover:text-institutional transition-colors flex items-center justify-center text-institutional cursor-pointer font-bold shadow-xs"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => scrollToSlide(activeIndex + 1)}
                disabled={activeIndex === BUDGET_YEARS_DATA.length - 1}
                aria-label="Next Broadcast"
                className="w-8 h-8 rounded border border-rule bg-ivory hover:bg-institutional hover:text-white disabled:opacity-40 disabled:hover:bg-ivory disabled:hover:text-institutional transition-colors flex items-center justify-center text-institutional cursor-pointer font-bold shadow-xs"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Watch the official Union Budget speech on the left and review key highlights on the right. Drag horizontally or use the arrows to navigate through all 7 broadcasts.
        </p>

        {/* ── Horizontal Drag-Scroll Container (Video Left, Summary Right per slide) ── */}
        <div
          ref={containerRef}
          tabIndex={0}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          aria-label="Horizontal list of budget parliament speeches"
          className={`flex flex-row overflow-x-auto border border-rule rounded-sm bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-institutional/20 transition-all select-none ${
            isDragging
              ? "cursor-grabbing scroll-auto"
              : "cursor-grab snap-x snap-mandatory scrollbar-thin scrollbar-thumb-institutional/30 scrollbar-track-rule/40"
          }`}
        >
          {BUDGET_YEARS_DATA.map((item, idx) => (
            <div
              key={`${item.videoId}-${idx}`}
              ref={(el) => {
                panelRefs.current[idx] = el;
              }}
              data-slide-index={idx}
              className="snap-start min-w-full w-full shrink-0 flex-none p-4 sm:p-6 lg:p-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                
                {/* ── LEFT COLUMN: Budget Video ── */}
                <div className="lg:col-span-7 flex flex-col justify-center gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-institutional/10 text-institutional text-xs font-bold tracking-wider uppercase">
                      <svg className="w-3.5 h-3.5 fill-red-600" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Parliament Speech Broadcast
                    </span>
                    <span className="text-xs font-bold tracking-wider text-institutional/70 font-mono">
                      FY {item.year}
                    </span>
                  </div>

                  <BudgetVideoPlayer item={item} isDragging={isDragging} />

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-muted-foreground font-medium">
                      Source: PIB India / Sansad TV Official Broadcast
                    </span>
                    <a
                      href={item.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-gov-blue hover:text-red-600 transition-colors inline-flex items-center gap-1"
                    >
                      <span>Watch on YouTube ↗</span>
                    </a>
                  </div>
                </div>

                {/* ── RIGHT COLUMN: Budget Summary ── */}
                <div className="lg:col-span-5 flex flex-col justify-between bg-ivory/60 p-5 sm:p-6 border border-rule rounded-sm">
                  <div>
                    <div className="border-b border-rule pb-3 mb-4">
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-saffron block mb-0.5">
                        Key Highlights
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-institutional">
                        {item.title}
                      </h3>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {item.summary.map((point, pIdx) => (
                        <li
                          key={pIdx}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90 leading-relaxed"
                        >
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
                      <svg
                        className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </Link>
                    <span className="text-[11px] font-bold text-institutional/60 uppercase tracking-wider font-mono">
                      FY {item.year}
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
