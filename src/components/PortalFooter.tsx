import { NavLink } from "react-router-dom";
import { CivicLensMark } from "./CivicLensMark";
import { useApp } from "@/context/AppContext";

export function PortalFooter() {
  const { t } = useApp();

  return (
    <footer className="border-t-4 border-saffron bg-institutional-dark text-institutional-foreground">
      <div className="portal-container grid gap-8 py-10 md:grid-cols-4">
        {/* Brand Column */}
        <div>
          <NavLink to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <CivicLensMark className="h-11 w-11" />
            <span className="text-lg font-bold tracking-[0.14em]">CIVICLENS</span>
          </NavLink>
          <p className="mt-3 text-xs leading-relaxed text-institutional-foreground/75">
            {t("footer_tagline")}
          </p>
          {/* Tiranga strip */}
          <div className="mt-4 flex h-1.5 w-24 overflow-hidden rounded-full">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>
        </div>

        {/* Column 1 — Budget Data */}
        <div>
          <h3 className="label-caps border-b border-institutional-foreground/25 pb-2 text-saffron mb-3">
            Budget Data
          </h3>
          <ul className="space-y-2 text-xs">
            <li><NavLink to="/budget-at-a-glance" className="hover:text-saffron transition-colors">Budget at a Glance</NavLink></li>
            <li><NavLink to="/explore-budget" className="hover:text-saffron transition-colors">Explore Budget</NavLink></li>
            <li><NavLink to="/departments" className="hover:text-saffron transition-colors">Departments</NavLink></li>
            <li><NavLink to="/ai-insights" className="hover:text-saffron transition-colors">AI Insights</NavLink></li>
          </ul>
        </div>

        {/* Column 2 — Citizen Tools */}
        <div>
          <h3 className="label-caps border-b border-institutional-foreground/25 pb-2 text-saffron mb-3">
            Citizen Tools
          </h3>
          <ul className="space-y-2 text-xs">
            <li><NavLink to="/ask-civiclens" className="hover:text-saffron transition-colors">Ask CivicLens AI</NavLink></li>
            <li><NavLink to="/compare" className="hover:text-saffron transition-colors">Compare Spending</NavLink></li>
            <li><NavLink to="/glossary" className="hover:text-saffron transition-colors">Budget Glossary</NavLink></li>
            <li><NavLink to="/alerts" className="hover:text-saffron transition-colors">My Budget Alerts</NavLink></li>
            <li><NavLink to="/rti-assistant" className="hover:text-saffron transition-colors">RTI Application Assistant</NavLink></li>
          </ul>
        </div>

        {/* Column 3 — Administration & Engagement */}
        <div>
          <h3 className="label-caps border-b border-institutional-foreground/25 pb-2 text-saffron mb-3">
            Portal & Admin
          </h3>
          <ul className="space-y-2 text-xs">
            <li><NavLink to="/feedback" className="hover:text-saffron transition-colors">Citizen Feedback</NavLink></li>
            <li><NavLink to="/admin" className="hover:text-saffron font-bold text-saffron/90 transition-colors">Admin Suite</NavLink></li>
            <li><NavLink to="/admin/upload" className="hover:text-saffron transition-colors">Document Ingestion Pipeline</NavLink></li>
            <li><NavLink to="/admin/agent-activity" className="hover:text-saffron transition-colors">Agent Activity Log</NavLink></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/20 py-4 text-center text-xs text-institutional-foreground/60">
        <p>CivicLens &bull; Public Budget Information & Transparency Portal &bull; Government of India</p>
      </div>
    </footer>
  );
}
