import { CivicLensMark } from "./CivicLensMark";

const columns = [
  {
    title: "BUDGET INFORMATION",
    links: ["Budget at a Glance", "Explore Budget", "Departments", "AI Insights"],
  },
  {
    title: "TRANSPARENCY",
    links: ["Data Sources", "Methodology", "AI Explanation Policy"],
  },
  {
    title: "SUPPORT",
    links: ["Accessibility", "Help", "Feedback"],
  },
];

export function PortalFooter() {
  return (
    <footer className="border-t-4 border-saffron bg-institutional-dark text-institutional-foreground">
      <div className="portal-container grid gap-8 py-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <CivicLensMark className="h-11 w-11" />
            <span className="text-lg font-bold tracking-[0.14em]">CIVICLENS</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-institutional-foreground/75">
            Intelligent Government Budget Transparency Platform
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="label-caps border-b border-institutional-foreground/25 pb-2 text-saffron">
              {col.title}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-institutional-foreground/85">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#main-content" className="underline-offset-4 hover:text-saffron hover:underline">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-institutional-foreground/20">
        <div className="portal-container py-5 text-xs leading-relaxed text-institutional-foreground/70">
          <p>
            <span className="label-caps text-institutional-foreground/90">Disclaimer: </span>
            CivicLens is an independent public information platform. Information and AI-generated
            insights are based on available uploaded budget records and supporting documents.
          </p>
          <p className="mt-2">© 2026 CivicLens. Not affiliated with any government body.</p>
        </div>
      </div>
    </footer>
  );
}
