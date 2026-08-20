import { useState, useEffect } from "react";
import redFort from "@/assets/red-fort.jpg";
import indiaEmblem from "@/assets/india-emblem.jpg";
import bannerImage from "@/assets/civic-banner.jpg";

const bannerImages = [redFort, indiaEmblem, bannerImage];

export function HeroBanner() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % bannerImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <section className="relative border-b border-rule overflow-hidden">
      {/* Image Container with Transition */}
      <div className="relative h-[400px] w-full sm:h-[550px]">
        {bannerImages.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`Banner slide ${index + 1}`}
            width={1920}
            height={912}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-[1400ms] ease-in-out ${
              index === currentImageIndex
                ? "scale-100 opacity-100"
                : "scale-105 opacity-0"
            }`}
          />
        ))}

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-institutional-dark/45" />

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="portal-container">
            <p className="label-caps text-saffron">Public Budget Information</p>
            <h1 className="mt-3 max-w-3xl text-2xl font-bold leading-snug tracking-[0.04em] text-institutional-foreground sm:text-3xl">
              CIVICLENS BUDGET TRANSPARENCY PORTAL
            </h1>
            <p className="mt-4 max-w-2xl border-l-2 border-saffron pl-4 text-sm leading-relaxed text-institutional-foreground/90 sm:text-base">
              Explore public budget allocations, examine significant changes in spending, and understand them through evidence-backed information.
            </p>
            <a
              href="#explore-budget"
              className="mt-6 inline-block border border-saffron bg-saffron/95 px-6 py-3 text-xs font-bold tracking-[0.12em] text-institutional-dark hover:bg-saffron transition-colors"
            >
              EXPLORE BUDGET INFORMATION
            </a>
          </div>
        </div>
      </div>

      {/* Slide Indicators - Removed */}
    </section>
  );
}
