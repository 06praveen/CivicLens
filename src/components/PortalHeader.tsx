import { CivicLensMark } from "./CivicLensMark";

const utilityLinks = [
  "Skip to Main Content",
  "Screen Reader Access",
  "English",
  "हिन्दी",
];

const navItems = [
  { label: "HOME", href: "#top" },
  { label: "BUDGET AT A GLANCE", href: "#budget-at-a-glance" },
  { label: "EXPLORE BUDGET", href: "#explore-budget" },
  { label: "DEPARTMENTS", href: "#explore-budget" },
  { label: "AI INSIGHTS", href: "#budget-analysis" },
  { label: "ASK CIVICLENS", href: "#ask-civiclens" },
];

export function PortalHeader({ onFontSize, onFontReset }: { onFontSize?: (change: number) => void; onFontReset?: () => void }) {
  return (
    <header id="top">
      {/* Level 1 — utility bar */}
      <div className="border-b border-institutional-dark bg-institutional-dark text-institutional-foreground">
        <div className="portal-container flex flex-wrap items-center justify-between gap-y-1 py-1.5 text-xs">
          <p className="tracking-wide">Public Budget Information &amp; Transparency Platform</p>
          <nav aria-label="Accessibility and utilities" className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {utilityLinks.map((item) => (
              <a
                key={item}
                href="#main-content"
                className="underline-offset-2 hover:text-saffron hover:underline"
              >
                {item}
              </a>
            ))}
            <span className="flex items-center gap-1 border-l border-institutional-foreground/30 pl-3">
              <button type="button" onClick={() => onFontSize?.(-0.04)} className="px-1 hover:text-saffron" aria-label="Decrease text size">
                A-
              </button>
              <button type="button" onClick={() => onFontReset?.()} className="px-1 hover:text-saffron" aria-label="Default text size">
                A
              </button>
              <button type="button" onClick={() => onFontSize?.(0.04)} className="px-1 hover:text-saffron" aria-label="Increase text size">
                A+
              </button>
            </span>
            <button type="button" className="border-l border-institutional-foreground/30 pl-3 hover:text-saffron">
              High Contrast
            </button>
            <button type="button" className="border-l border-institutional-foreground/30 pl-3 hover:text-saffron">
              Search
            </button>
          </nav>
        </div>
      </div>

      {/* Level 2 — institutional identity */}
      <div className="border-b border-rule bg-ivory">
        <div className="portal-container flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-4">
            <span className="text-institutional">
              <CivicLensMark className="h-16 w-16" />
            </span>
            <span className="border-l border-rule pl-4">
              <span className="block text-2xl font-bold tracking-[0.14em] text-institutional sm:text-3xl">
                CIVICLENS
              </span>
              <span className="block text-[0.8rem] text-muted-foreground">
                Intelligent Government Budget Transparency Platform
              </span>
            </span>
          </div>
          <div className="border border-rule bg-card px-4 py-2">
            <span className="label-caps block text-muted-foreground">Financial Year</span>
            <span className="mt-0.5 block text-base font-bold text-institutional">2026–27 ▼</span>
          </div>
        </div>
      </div>

      {/* Level 3 — primary navigation */}
      <nav aria-label="Primary" className="border-b-2 border-saffron bg-institutional">
        <div className="portal-container flex flex-wrap">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="border-r border-institutional-foreground/15 px-4 py-3 text-xs font-bold tracking-[0.09em] text-institutional-foreground first:border-l first:border-institutional-foreground/15 hover:bg-institutional-dark"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
