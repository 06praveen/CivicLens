import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { HeroBanner } from "@/components/HeroBanner";
import { HomeSearchBar } from "@/components/HomeSearchBar";
import { PageLayout } from "@/components/PageLayout";
import { BudgetYearSection } from "@/components/BudgetYearSection";

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="border-b-2 border-institutional/20 pb-3 pt-4 mb-6">
      <div className="flex items-center gap-2.5">
        <span className="h-5 w-1.5 rounded-full bg-saffron" />
        <h2 className="text-lg font-bold tracking-[0.12em] text-institutional sm:text-xl">{title}</h2>
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useApp();

  const quickAccessCards = [
    {
      titleKey: "nav_budget_glance" as const,
      descKey: "quick_bag_desc" as const,
      ctaKey: "quick_bag_cta" as const,
      path: "/budget-at-a-glance"
    },
    {
      titleKey: "nav_explore" as const,
      descKey: "quick_explore_desc" as const,
      ctaKey: "quick_explore_cta" as const,
      path: "/explore-budget"
    },
    {
      titleKey: "quick_dept_title" as const,
      descKey: "quick_dept_desc" as const,
      ctaKey: "quick_dept_cta" as const,
      path: "/departments"
    },
    {
      titleKey: "nav_ask" as const,
      descKey: "quick_ask_desc" as const,
      ctaKey: "quick_ask_cta" as const,
      path: "/ask-civiclens"
    }
  ];

  const howItWorks = [
    { titleKey: "how_1_title" as const, descKey: "how_1_desc" as const, icon: "M10 21h4V9h-4v12zm8 0h4V3h-4v18zM2 21h4v-7H2v7z" },
    { titleKey: "how_2_title" as const, descKey: "how_2_desc" as const, icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" },
    { titleKey: "how_3_title" as const, descKey: "how_3_desc" as const, icon: "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" }
  ];

  return (
    <PageLayout>
      {/* ── Hero Monument Slideshow ── */}
      <HeroBanner />

      {/* ── Full-Width India.gov.in Style Search Bar (Between Hero Banner & Quick Access Cards) ── */}
      <HomeSearchBar />

      {/* ── Quick Access Feature Cards ("Budget at a Glance", "Explore Budget", etc.) ── */}
      <section className="portal-container mt-10 mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {quickAccessCards.map((card, i) => (
            <div key={i} className="flex flex-col bg-white border border-rule rounded-sm shadow-xs hover:shadow-md transition-shadow group relative overflow-hidden">
              {/* Subtle top border accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-institutional opacity-50 group-hover:bg-saffron group-hover:opacity-100 transition-colors" />
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-bold tracking-[0.05em] text-institutional mb-3 pt-2">
                  {t(card.titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {t(card.descKey)}
                </p>
                
                <Link to={card.path} className="mt-5 inline-block text-xs font-bold tracking-[0.08em] text-gov-blue hover:text-saffron transition-colors">
                  {t(card.ctaKey)}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Year-wise Union Budget Parliament Speeches Section ── */}
      <BudgetYearSection />

      {/* ── How CivicLens Helps ── */}
      <section className="bg-white border-y border-rule py-12 mb-12">
        <div className="portal-container">
          <SectionHeading title={t("how_title")} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {howItWorks.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="shrink-0 text-institutional/30 group-hover:text-institutional transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                    <path d={step.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide text-institutional mb-2">{t(step.titleKey)}</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed">{t(step.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </PageLayout>
  );
}
