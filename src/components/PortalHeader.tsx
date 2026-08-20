import { useState } from "react";
import { NavLink } from "react-router-dom";
import { IndianWavingFlag } from "./IndianWavingFlag";
import { CivicLensMark } from "./CivicLensMark";
import { AshokaChakra } from "./AshokaChakra";
import { useApp } from "@/context/AppContext";
import emblemIndia from "@/assets/emblem-india.png";

export function PortalHeader() {
  const { lang, setLang, t, increaseFontSize, decreaseFontSize, resetFontSize, highContrast, toggleHighContrast } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { labelKey: "nav_home" as const,          path: "/",          icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" },
    { labelKey: "nav_budget_glance" as const, path: "/budget-at-a-glance", icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" },
    { labelKey: "nav_explore" as const,       path: "/explore-budget",     icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" },
    { labelKey: "nav_ai" as const,            path: "/ai-insights",        icon: "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" },
    { labelKey: "nav_ask" as const,           path: "/ask-civiclens",      icon: "M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" },
    { labelKey: "nav_reports" as const,       path: "/compare",            icon: "M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" },
    { labelKey: "nav_about" as const,         path: "/glossary",           icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" },
  ];

  return (
    <header id="top" className="shadow-xs flex flex-col w-full z-40 select-none">
      
      {/* ── SECTION 1 — Compact Dark Navy Government Utility Bar (#00145C) ── */}
      <div className="bg-[#00145C] text-white border-b border-white/15 h-[42px] flex items-center">
        <div className="w-full px-3 sm:px-6 lg:px-8 flex justify-between items-center text-[0.72rem]">
          
          {/* Left: Indian flag indicator + Government Title */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center justify-center h-3 w-4 rounded-[1px] bg-gradient-to-b from-[#E65100] via-white to-[#1B5E20] shadow-xs shrink-0" aria-hidden="true" />
            <p className="font-medium tracking-wide text-white/95">
              <span className="font-semibold text-white">भारत सरकार</span>
              <span className="hidden sm:inline"> • Government of India • Public Budget Information & Transparency Portal</span>
            </p>
          </div>

          {/* Right: Accessibility & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-saffron focus:text-institutional-dark focus:p-1.5 text-[0.68rem] font-bold">
              {t("skip_main")}
            </a>
            
            <button
              type="button"
              onClick={() => alert("Screen reader access enabled.")}
              className="hidden lg:inline-block text-[0.68rem] text-white/80 hover:text-white transition-colors"
            >
              {t("screen_reader")}
            </button>
            <span className="hidden lg:inline text-white/30 text-[0.6rem]">|</span>

            {/* Language Switcher with active underline under English */}
            <span className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`py-0.5 text-[0.7rem] font-semibold transition-all relative ${
                  lang === "en" ? "text-white font-bold" : "text-white/70 hover:text-white"
                }`}
                aria-pressed={lang === "en"}
              >
                {t("lang_en")}
                {lang === "en" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-saffron rounded-full" />
                )}
              </button>
              <span className="text-white/30 text-[0.6rem]">|</span>
              <button
                type="button"
                onClick={() => setLang("hi")}
                className={`py-0.5 text-[0.7rem] font-semibold transition-all relative ${
                  lang === "hi" ? "text-white font-bold" : "text-white/70 hover:text-white"
                }`}
                aria-pressed={lang === "hi"}
              >
                {t("lang_hi")}
                {lang === "hi" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-saffron rounded-full" />
                )}
              </button>
            </span>

            {/* Font Size Controls */}
            <span className="flex items-center gap-1 border-l border-white/20 pl-2 sm:pl-2.5">
              <button type="button" onClick={decreaseFontSize} className="px-1 hover:text-saffron font-bold text-[0.68rem]" aria-label={t("font_decrease")}>A-</button>
              <button type="button" onClick={resetFontSize}    className="px-1 hover:text-saffron font-bold text-[0.72rem]" aria-label={t("font_reset")}>A</button>
              <button type="button" onClick={increaseFontSize} className="px-1 hover:text-saffron font-bold text-[0.78rem]" aria-label={t("font_increase")}>A+</button>
            </span>

            {/* High Contrast */}
            <button
              type="button"
              onClick={toggleHighContrast}
              aria-pressed={highContrast}
              className={`border-l border-white/20 pl-2 sm:pl-2.5 hover:text-saffron whitespace-nowrap text-[0.68rem] ${highContrast ? "text-saffron font-bold" : "text-white/80"}`}
            >
              {t("high_contrast")}
            </button>

            {/* Mobile Hamburger toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(p => !p)}
              className="md:hidden ml-1 p-1 text-white hover:text-saffron focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

          </div>
        </div>
      </div>

      {/* ── SECTION 2 — Main Tricolor Branding Banner (Full-Width Wave, ~140px Height) ── */}
      <div className="relative overflow-hidden border-b border-institutional/20 shadow-xs h-[135px] sm:h-[145px] w-full flex items-center">
        
        {/* Full Viewport Width Flowing Tricolor Background */}
        <IndianWavingFlag />

        {/* Branding Grid Content */}
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
          
          {/* LEFT: Government Emblem + Divider + CivicLens Branding (No floating white box) */}
          <NavLink to="/" aria-label="CivicLens — Home" className="flex items-center gap-3 sm:gap-4 group">
            {/* Government of India Emblem (~65px-75px height) */}
            <div className="flex shrink-0 items-center drop-shadow-sm">
              <img
                src={emblemIndia}
                alt="State Emblem of India"
                className="h-16 w-auto object-contain sm:h-20"
              />
            </div>
            
            {/* Thin vertical divider */}
            <div className="h-12 sm:h-14 w-px bg-institutional/30" aria-hidden="true" />
            
            {/* CivicLens Title & Subtitle */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <CivicLensMark className="h-7 w-7 text-institutional shrink-0" />
                <span className="text-xl sm:text-2xl font-black tracking-[0.12em] text-institutional leading-none">
                  CIVICLENS
                </span>
                <span className="rounded-full bg-institutional text-white px-2 py-0.5 text-[0.55rem] font-bold tracking-wider uppercase">
                  GOVT PORTAL
                </span>
              </div>
              <span className="mt-1 text-[0.7rem] sm:text-[0.75rem] font-semibold text-institutional/90 leading-tight">
                Intelligent Government Budget Transparency Platform
              </span>
            </div>
          </NavLink>
          
          {/* CENTER: Large Dark Navy Ashoka Chakra (Centered in Viewport) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none hidden md:block">
            <AshokaChakra className="h-20 w-20 sm:h-24 sm:w-24 text-[#000080]" />
          </div>

          {/* RIGHT: Intentionally Clean (No search, no FY selector) */}
          <div className="hidden lg:block w-12" />

        </div>
      </div>

      {/* ── SECTION 3 — Clean White Navigation Bar ── */}
      <nav aria-label="Primary navigation" className="bg-white border-b border-rule shadow-xs">
        <div className="w-full px-3 sm:px-6 lg:px-8">
          
          {/* Desktop Nav Items */}
          <div className={`${mobileMenuOpen ? "flex" : "hidden md:flex"} flex-col md:flex-row md:items-center justify-start overflow-x-auto py-1 md:py-0`}>
            {navItems.map((item, idx) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 sm:px-4 py-3 text-[0.78rem] font-semibold transition-colors border-r border-rule/50 last:border-r-0 whitespace-nowrap relative ${
                    isActive
                      ? "text-institutional font-bold"
                      : "text-institutional/80 hover:text-institutional"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <svg className="w-4 h-4 text-institutional/70 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d={item.icon} />
                    </svg>
                    <span>{t(item.labelKey)}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#00145C] rounded-t-sm" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

        </div>
      </nav>

    </header>
  );
}
