import { useState } from "react";
import { PortalHeader } from "@/components/PortalHeader";
import { PortalFooter } from "@/components/PortalFooter";
import { HeroBanner } from "@/components/HeroBanner";
import recordsImage from "@/assets/civic-records.jpg";

const stats = [
  { label: "Total Budget Tracked", value: "₹12,450 Cr" },
  { label: "Departments Covered", value: "18" },
  { label: "Budget Categories", value: "127" },
  { label: "Significant Changes", value: "24" },
];

const infoBlocks = [
  ["BUDGET OVERVIEW", "Explore total allocations and major expenditure categories.", "VIEW OVERVIEW"],
  ["DEPARTMENT-WISE BUDGET", "Browse budget allocations by department.", "EXPLORE DEPARTMENTS"],
  ["YEAR-WISE COMPARISON", "Compare available budget allocations across years.", "COMPARE BUDGETS"],
  ["SIGNIFICANT CHANGES", "View notable increases and decreases identified in budget records.", "VIEW CHANGES"],
];

const analyses = [
  { index: "01", title: "EDUCATION INFRASTRUCTURE", year: "2026–27", change: "+42.6%", positive: true, status: "INVESTIGATION COMPLETED", note: "Relevant budget records and supporting documents have been examined.", action: "VIEW INVESTIGATION" },
  { index: "02", title: "TRANSPORT DEVELOPMENT", year: "2026–27", change: "-18.2%", positive: false, status: "CHANGE IDENTIFIED", note: "Allocation decrease recorded against the previous financial year.", action: "VIEW DETAILS" },
  { index: "03", title: "URBAN WATER SUPPLY", year: "2026–27", change: "+11.4%", positive: true, status: "UNDER EXAMINATION", note: "Supporting documents are being matched against the budget record.", action: "VIEW DETAILS" },
];

const process = [
  ["01", "BUDGET RECORD"],
  ["02", "SIGNIFICANT CHANGE IDENTIFIED"],
  ["03", "RELEVANT RECORDS EXAMINED"],
  ["04", "EXPLANATION WITH SOURCE REFERENCES"],
];

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="section-rule border-b border-rule pb-3 pt-4">
      <h2 className="text-lg font-bold tracking-[0.12em] text-institutional sm:text-xl">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export default function App() {
  const [fontScale, setFontScale] = useState(1);

  return (
    <div className="min-h-screen bg-background" style={{ fontSize: `${fontScale}em` }}>
      <PortalHeader
        onFontSize={(change) => setFontScale((v) => Math.min(1.18, Math.max(0.9, v + change)))}
        onFontReset={() => setFontScale(1)}
      />

      <main id="main-content">
        <HeroBanner />

        <section id="budget-at-a-glance" className="portal-container">
          <SectionHeading title="BUDGET AT A GLANCE" subtitle="Financial Year 2026–27" />
          <div className="grid grid-cols-1 border-x border-b border-rule bg-card sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <div key={stat.label} className={`px-5 py-6 ${i > 0 ? "border-t border-rule lg:border-l lg:border-t-0" : ""} ${i === 1 ? "sm:border-t-0 sm:border-l" : ""} ${i === 3 ? "sm:border-l" : ""}`}>
                <p className="label-caps text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-institutional">{stat.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Figures derived from budget records available on the platform.</p>
        </section>

        <section id="explore-budget" className="portal-container mt-10">
          <SectionHeading title="EXPLORE BUDGET INFORMATION" />
          <div className="grid border-x border-b border-rule bg-card md:grid-cols-2">
            {infoBlocks.map(([title, body, action], i) => (
              <div key={title} className={`px-6 py-6 ${i > 0 ? "border-t border-rule" : ""} ${i === 1 ? "md:border-t-0 md:border-l" : ""} ${i === 3 ? "md:border-l" : ""}`}>
                <h3 className="border-l-4 border-institutional pl-3 text-sm font-bold tracking-[0.1em] text-institutional">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">{body}</p>
                <a href="#budget-at-a-glance" className="mt-4 inline-block text-xs font-bold tracking-[0.1em] text-gov-blue underline-offset-4 hover:underline">{action} →</a>
              </div>
            ))}
          </div>
        </section>

        <section id="budget-analysis" className="portal-container mt-10">
          <SectionHeading title="CIVICLENS BUDGET ANALYSIS" subtitle="Notable allocation changes recorded and examined against supporting documents." />
          <ol className="border-x border-b border-rule bg-card">
            {analyses.map((item, i) => (
              <li key={item.index} className={`flex flex-col gap-4 px-6 py-6 sm:flex-row ${i > 0 ? "border-t border-rule" : ""}`}>
                <span className="w-12 shrink-0 text-xl font-bold text-muted-foreground">{item.index}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-bold tracking-[0.1em] text-institutional">{item.title}</h3>
                  <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex gap-2"><dt>Financial Year:</dt><dd className="font-semibold text-foreground">{item.year}</dd></div>
                    <div className="flex gap-2"><dt>Allocation Change:</dt><dd className={`font-bold ${item.positive ? "text-positive" : "text-negative"}`}>{item.change}</dd></div>
                    <div className="flex gap-2"><dt>Status:</dt><dd className={`font-bold ${item.status === "INVESTIGATION COMPLETED" ? "text-positive" : "text-attention"}`}>{item.status}</dd></div>
                  </dl>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/80">{item.note}</p>
                </div>
                <a href="#budget-analysis" className="self-start text-xs font-bold tracking-[0.1em] text-gov-blue underline-offset-4 hover:underline sm:self-center">{item.action} →</a>
              </li>
            ))}
          </ol>
        </section>

        <section className="portal-container mt-10">
          <SectionHeading title="HOW THE ANALYSIS WORKS" />
          <div className="grid border-x border-b border-rule bg-card sm:grid-cols-2 lg:grid-cols-4">
            {process.map(([step, label], i) => (
              <div key={step} className={`px-5 py-5 ${i > 0 ? "border-t border-rule lg:border-l lg:border-t-0" : ""} ${i === 1 ? "sm:border-t-0 sm:border-l" : ""} ${i === 3 ? "sm:border-l" : ""}`}>
                <span className="label-caps text-saffron">{step}</span>
                <p className="mt-1 text-sm font-semibold leading-snug text-institutional">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="ask-civiclens" className="portal-container mb-12 mt-10">
          <SectionHeading title="ASK CIVICLENS" />
          <div className="grid border-x border-b border-rule bg-card lg:grid-cols-2">
            <div className="px-6 py-7">
              <p className="text-sm leading-relaxed text-foreground/80">Put questions to the platform about allocations, departments and recorded changes. Responses cite the budget records and supporting documents held on CivicLens.</p>
              <a href="#budget-analysis" className="mt-5 inline-block border border-institutional px-5 py-2.5 text-xs font-bold tracking-[0.1em] text-institutional hover:bg-institutional hover:text-institutional-foreground">OPEN ASK CIVICLENS →</a>
            </div>
            <img src={recordsImage} alt="Institutional records hall with rows of archived budget documents" width={1600} height={704} loading="lazy" className="h-full min-h-[200px] w-full border-t border-rule object-cover lg:border-l lg:border-t-0" />
          </div>
        </section>
      </main>

      <PortalFooter />
    </div>
  );
}
