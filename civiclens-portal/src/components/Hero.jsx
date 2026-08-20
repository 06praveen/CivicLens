export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-[520px] items-center overflow-hidden bg-navy bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(6,20,52,0.85) 10%, rgba(6,20,52,0.35) 60%, rgba(6,20,52,0.15) 100%), url('/hero-red-fort.svg')",
      }}
    >
      <div className="max-w-2xl px-6 py-16 md:px-12">
        <p className="mb-4 text-xs font-bold tracking-[0.2em] text-saffron">
          PUBLIC BUDGET INFORMATION
        </p>

        <h2 className="text-3xl font-extrabold uppercase leading-tight text-white sm:text-4xl md:text-5xl">
          CivicLens Budget Transparency Portal
        </h2>

        <div className="mt-6 border-l-4 border-saffron pl-4">
          <p className="text-base text-slate-100 md:text-lg">
            Explore public budget allocations, examine significant changes in spending, and
            understand them through evidence-backed information.
          </p>
        </div>

        <a
          href="#explore-budget"
          className="mt-8 inline-block bg-saffron px-6 py-3 text-sm font-bold tracking-wide text-navy hover:bg-orange-400"
        >
          EXPLORE BUDGET INFORMATION
        </a>
      </div>
    </section>
  )
}
