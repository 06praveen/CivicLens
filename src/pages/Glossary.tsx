import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { GLOSSARY_TERMS, type GlossaryTerm } from "@/data/mockData";

export default function Glossary() {
  const { t, lang } = useApp();
  const [search, setSearch] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  const filteredTerms = GLOSSARY_TERMS.filter(item => {
    const q = search.toLowerCase();
    const termStr = (lang === "hi" ? item.termHi : item.term).toLowerCase();
    const meaningStr = (lang === "hi" ? item.simpleMeaningHi : item.simpleMeaning).toLowerCase();
    return termStr.includes(q) || meaningStr.includes(q) || item.category.toLowerCase().includes(q);
  });

  return (
    <PageLayout>
      <div className="portal-container pb-14">
        {/* Header */}
        <div className="border-b-4 border-saffron py-6">
          <p className="label-caps text-saffron">Citizen Education</p>
          <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">
            {t("glossary_title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("glossary_subtitle")}</p>
        </div>

        {/* Search Filter */}
        <div className="mt-6 max-w-xl">
          <label htmlFor="glossary-search" className="label-caps block text-muted-foreground mb-1">
            Search Term or Category
          </label>
          <input
            id="glossary-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search e.g. Fiscal Deficit, Capex, Subsidy..."
            className="w-full rounded-xs border border-rule bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-institutional"
          />
        </div>

        {/* Glossary Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTerms.map(item => (
            <div
              key={item.id}
              className="flex flex-col justify-between border border-rule bg-card p-5 rounded-xs shadow-xs hover:shadow-md transition-shadow"
            >
              <div>
                <span className="label-caps text-saffron block mb-1">{item.category}</span>
                <h3 className="text-base font-bold text-institutional">
                  {lang === "hi" ? item.termHi : item.term}
                </h3>
                
                <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
                  {lang === "hi" ? item.simpleMeaningHi : item.simpleMeaning}
                </p>
              </div>

              <div className="mt-5 border-t border-rule pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedTerm(item)}
                  className="inline-flex items-center text-xs font-bold text-gov-blue hover:text-saffron transition-colors"
                >
                  Explain Simply & Real Example →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Term Modal */}
        {selectedTerm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-sm border border-rule bg-white p-6 shadow-xl relative">
              <button
                onClick={() => setSelectedTerm(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
              <span className="label-caps text-saffron block mb-1">{selectedTerm.category}</span>
              <h2 className="text-xl font-bold text-institutional">
                {lang === "hi" ? selectedTerm.termHi : selectedTerm.term}
              </h2>

              <div className="mt-4 space-y-3">
                <div className="rounded-xs bg-institutional/5 p-3 border border-rule">
                  <p className="label-caps text-institutional mb-1">Simple Meaning</p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {lang === "hi" ? selectedTerm.simpleMeaningHi : selectedTerm.simpleMeaning}
                  </p>
                </div>

                <div className="rounded-xs bg-saffron/10 p-3 border border-saffron/30">
                  <p className="label-caps text-saffron mb-1">Real-Life Example</p>
                  <p className="text-sm leading-relaxed text-institutional-dark">
                    {lang === "hi" ? selectedTerm.exampleHi : selectedTerm.example}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-rule pt-3 text-xs text-muted-foreground">
                Official Reference: <strong>{selectedTerm.officialDocRef}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
