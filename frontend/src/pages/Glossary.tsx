import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { GLOSSARY_TERMS, type GlossaryTerm } from "@/data/mockData";

export default function Glossary() {
  const { t } = useApp();
  const [search, setSearch] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  const filteredTerms = GLOSSARY_TERMS.filter(item => {
    const q = search.toLowerCase();
    const termStr = item.term.toLowerCase();
    const descStr = item.shortCardDesc.toLowerCase();
    const catStr = item.category.toLowerCase();
    return termStr.includes(q) || descStr.includes(q) || catStr.includes(q);
  });

  return (
    <PageLayout>
      <div className="portal-container pb-14">
        {/* Header */}
        <div className="border-b-4 border-saffron py-6">
          <p className="label-caps text-saffron">Citizen Education & Financial Literacy</p>
          <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">
            About CivicLens — Budget Terms & Explanations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Understand key Union Budget terms, expenditure categories, and financial indicators in simple plain language.
          </p>
        </div>

        {/* Search Filter */}
        <div className="mt-6 max-w-xl">
          <label htmlFor="glossary-search" className="label-caps block text-muted-foreground mb-1">
            Search Budget Term or Category
          </label>
          <input
            id="glossary-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search e.g. Fiscal Deficit, Capex, Revenue Expenditure, Subsidy..."
            className="w-full rounded-xs border border-rule bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-institutional"
          />
        </div>

        {/* Glossary Grid (6 Core Cards) */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTerms.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedTerm(item)}
              className="flex flex-col justify-between border border-rule bg-card p-5 rounded-xs shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div>
                <span className="label-caps text-saffron block mb-1">{item.category}</span>
                <h3 className="text-base font-bold text-institutional group-hover:text-saffron transition-colors">
                  {item.term}
                </h3>

                <p className="mt-3 text-xs text-foreground/80 leading-relaxed">
                  {item.shortCardDesc}
                </p>
              </div>

              <div className="mt-5 border-t border-rule pt-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTerm(item);
                  }}
                  className="inline-flex items-center text-xs font-bold text-institutional group-hover:text-saffron-dark transition-colors cursor-pointer"
                >
                  Learn More →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Explanation Modal (Opens in Same Tab) */}
        {selectedTerm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto"
            onClick={() => setSelectedTerm(null)}
          >
            <div
              className="w-full max-w-xl rounded-xs border-2 border-institutional bg-card p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-rule pb-3">
                <div>
                  <span className="label-caps text-saffron">{selectedTerm.category}</span>
                  <h2 className="text-xl font-black text-institutional mt-0.5">{selectedTerm.term}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTerm(null)}
                  className="text-muted-foreground hover:text-foreground font-bold text-lg p-1 cursor-pointer"
                  aria-label="Close explanation modal"
                >
                  ✕
                </button>
              </div>

              {/* 5 Structured Explanation Sections */}
              <div className="space-y-3.5 text-xs">
                {/* 1. What does it mean? */}
                <div className="rounded-xs bg-background p-3.5 border border-rule">
                  <h4 className="label-caps text-institutional mb-1 font-bold">1. What does it mean?</h4>
                  <p className="text-foreground leading-relaxed font-medium">
                    {selectedTerm.whatItMeans}
                  </p>
                </div>

                {/* 2. Why does it matter? */}
                <div className="rounded-xs bg-background p-3.5 border border-rule">
                  <h4 className="label-caps text-institutional mb-1 font-bold">2. Why does it matter?</h4>
                  <p className="text-foreground leading-relaxed font-medium">
                    {selectedTerm.whyItMatters}
                  </p>
                </div>

                {/* 3. Simple example */}
                <div className="rounded-xs bg-saffron/10 p-3.5 border border-saffron/30">
                  <h4 className="label-caps text-saffron-dark mb-1 font-bold">3. Simple example</h4>
                  <p className="text-institutional-dark font-semibold leading-relaxed">
                    {selectedTerm.simpleExample}
                  </p>
                </div>

                {/* 4. How it relates to the government budget */}
                <div className="rounded-xs bg-background p-3.5 border border-rule">
                  <h4 className="label-caps text-institutional mb-1 font-bold">4. How it relates to the government budget</h4>
                  <p className="text-foreground leading-relaxed font-medium">
                    {selectedTerm.howItRelates}
                  </p>
                </div>

                {/* 5. How CivicLens helps understand it */}
                <div className="rounded-xs bg-institutional/10 p-3.5 border border-institutional/30">
                  <h4 className="label-caps text-institutional mb-1 font-bold">5. How CivicLens helps understand it</h4>
                  <p className="text-institutional font-semibold leading-relaxed">
                    {selectedTerm.howCivicLensHelps}
                  </p>
                </div>
              </div>

              {/* Modal Footer & Close Action */}
              <div className="mt-5 border-t border-rule pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTerm(null)}
                  className="px-4 py-2 rounded-xs bg-institutional text-white text-xs font-bold hover:bg-institutional-dark transition-colors cursor-pointer"
                >
                  Close Explanation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
