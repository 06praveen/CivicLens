import { useState } from 'react'
import { Search, Landmark, ChevronDown } from 'lucide-react'
import AshokaChakra from './AshokaChakra.jsx'

const FINANCIAL_YEARS = ['2026-27', '2025-26', '2024-25', '2023-24']

export default function Header() {
  const [query, setQuery] = useState('')
  const [year, setYear] = useState(FINANCIAL_YEARS[0])
  const [yearOpen, setYearOpen] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    // Wire this up to a real search endpoint / router as needed.
    console.log('Searching budget records for:', query)
  }

  return (
    <header className="w-full bg-white relative overflow-hidden">
      {/* subtle tricolor wash behind the header, echoing the identity strip */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-saffron/10 via-transparent to-indiaGreen/10" />

      <div className="relative flex flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-6">
        {/* Left: State emblem + brand lockup */}
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-saffron">
            <Landmark className="h-7 w-7 text-navy" aria-hidden="true" />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/5">
              <Landmark className="h-6 w-6 text-navy" aria-hidden="true" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-navy">
                  CIVIC<span className="text-saffron">LENS</span>
                </h1>
                <span className="rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                  GOVT PORTAL
                </span>
              </div>
              <p className="text-xs font-medium text-slate-600">
                Intelligent Government Budget Transparency Platform
              </p>
            </div>
          </div>
        </div>

        {/* Center: large decorative Ashoka Chakra */}
        <div className="hidden md:block" aria-hidden="true">
          <AshokaChakra size={90} />
        </div>

        {/* Right: search + financial year */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex overflow-hidden rounded-md border border-slate-300">
            <label htmlFor="budget-search" className="sr-only">
              Search Budget Records
            </label>
            <input
              id="budget-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Budget Records..."
              className="w-48 px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:w-64"
            />
            <button
              type="submit"
              className="flex items-center gap-1 bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
            </button>
          </form>

          <div className="relative">
            <button
              onClick={() => setYearOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={yearOpen}
              className="flex items-center gap-2 rounded-md border-2 border-indiaGreen bg-white px-3 py-2 text-left"
            >
              <span className="h-2 w-2 rounded-full bg-indiaGreen" aria-hidden="true" />
              <span>
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Financial Year
                </span>
                <span className="block text-sm font-bold text-navy">{year}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
            </button>

            {yearOpen && (
              <ul
                role="listbox"
                className="absolute right-0 z-10 mt-1 w-full min-w-[9rem] rounded-md border border-slate-200 bg-white shadow-lg"
              >
                {FINANCIAL_YEARS.map((fy) => (
                  <li key={fy}>
                    <button
                      role="option"
                      aria-selected={fy === year}
                      onClick={() => {
                        setYear(fy)
                        setYearOpen(false)
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        fy === year ? 'font-semibold text-indiaGreen' : 'text-slate-700'
                      }`}
                    >
                      {fy}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
