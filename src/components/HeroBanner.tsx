import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import redFort from "@/assets/red-fort.jpg";
import hampiChariot from "@/assets/hampi-chariot.jpg";
import indiaGate from "@/assets/india-gate.png";

const bannerImages = [
  { src: redFort,      alt: "Red Fort, New Delhi",               fit: "object-cover object-center" },
  { src: hampiChariot, alt: "Hampi Stone Chariot Monument",       fit: "object-cover object-center" },
  { src: indiaGate,    alt: "India Gate, New Delhi",              fit: "object-cover object-center" },
];

export function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    // Auto-advance slideshow (5.5 seconds)
    const id = setInterval(() => setCurrent(p => (p + 1) % bannerImages.length), 5500);
    return () => clearInterval(id);
  }, []);

  function nextSlide() {
    setCurrent(p => (p + 1) % bannerImages.length);
  }

  function prevSlide() {
    setCurrent(p => (p === 0 ? bannerImages.length - 1 : p - 1));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    // Minimum swipe distance
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
  }

  return (
    <section 
      className="relative border-b border-rule overflow-hidden touch-pan-y select-none group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Historical monuments of India"
    >
      <div className="relative h-[420px] w-full sm:h-[480px] lg:h-[540px] bg-institutional-dark">
        {bannerImages.map((item, idx) => (
          <img
            key={idx}
            src={item.src}
            alt={item.alt}
            width={1920}
            height={560}
            className={`absolute inset-0 h-full w-full ${item.fit} transition-opacity duration-[1400ms] ease-in-out ${
              idx === current ? "opacity-100 z-0" : "opacity-0 -z-10"
            }`}
            draggable={false}
          />
        ))}

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-institutional-dark/80 via-institutional-dark/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-institutional-dark/30 z-10 pointer-events-none" />

        {/* Content - Static while images change */}
        <div className="absolute inset-0 flex items-center z-20">
          <div className="portal-container w-full">
            <h1 className="mt-3 max-w-2xl text-2xl font-bold leading-[1.25] tracking-[0.02em] text-white sm:text-4xl lg:text-5xl uppercase">
              CIVICLENS BUDGET TRANSPARENCY PORTAL
            </h1>
            <p className="mt-5 max-w-xl border-l-4 border-saffron pl-4 text-base font-semibold leading-relaxed text-white sm:text-lg">
              Understand where public money goes, how spending changes, and what it means for you.
            </p>
            <p className="mt-4 max-w-xl pl-5 text-sm leading-relaxed text-white/90 sm:text-base">
              Explore government budgets in simple language with data, charts, AI explanations, and official sources.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 pl-5">
              <Link
                to="/explore-budget"
                className="inline-block border border-saffron bg-saffron/95 px-6 py-3 text-xs font-bold tracking-[0.12em] text-institutional-dark hover:bg-saffron transition-colors"
              >
                EXPLORE BUDGET
              </Link>
              <Link
                to="/ask-civiclens"
                className="inline-block border border-white/60 bg-institutional-dark/60 backdrop-blur-sm px-6 py-3 text-xs font-bold tracking-[0.12em] text-white hover:bg-institutional-dark hover:border-white transition-colors"
              >
                ASK CIVICLENS
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        <div className="absolute inset-x-0 bottom-6 z-30 flex justify-center gap-2">
          {bannerImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2.5 rounded-full transition-all ${
                idx === current ? "w-8 bg-saffron" : "w-2.5 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Previous/Next Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 text-white/70 hover:bg-black/50 hover:text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 text-white/70 hover:bg-black/50 hover:text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>
      </div>
    </section>
  );
}

