import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import emblemIndia from "@/assets/emblem-india.png";

export function HomeSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() && category === "All Categories") {
      navigate("/explore-budget");
      return;
    }
    navigate(`/explore-budget?q=${encodeURIComponent(query.trim())}`);
  }

  function handleQuickSearch(term: string) {
    setQuery(term);
    navigate(`/explore-budget?q=${encodeURIComponent(term)}`);
  }

  return (
    <section className="bg-ivory/80 border-b border-rule py-8 sm:py-10 shadow-xs">
      <div className="portal-container w-full max-w-4xl flex flex-col items-center">
        
        {/* ── National Portal Branding Header (Just above Search Bar) ── */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* State Emblem of India Logo */}
          <div className="mb-2 flex justify-center">
            <img
              src={emblemIndia}
              alt="State Emblem of India - Satyamev Jayate"
              className="h-20 sm:h-24 md:h-28 w-auto object-contain drop-shadow-xs"
            />
          </div>

          {/* civiclens.gov.in BETA Title */}
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-institutional">
              civiclens.gov.in
            </span>
            <span className="bg-[#FFB703] text-black font-extrabold text-xs sm:text-sm px-2.5 py-0.5 rounded-xs uppercase tracking-wider shadow-2xs">
              BETA
            </span>
          </div>

          {/* Orange & Green Tricolor Accent Bar */}
          <div className="w-52 sm:w-72 h-1.5 rounded-full bg-gradient-to-r from-saffron via-white to-emerald-600 mb-2 border border-rule/30" />

          {/* Subtitle */}
          <h2 className="text-base sm:text-xl font-bold text-institutional tracking-wide">
            National Portal of India
          </h2>

          {/* Tagline */}
          <p className="text-sm sm:text-base font-semibold text-institutional/80 mt-1">
            Where Government Information Converges
          </p>
        </div>

        {/* ── Full-width Search Bar Container ── */}
        <form
          onSubmit={handleSearchSubmit}
          className="w-full bg-white rounded-md shadow-md p-2 flex flex-col sm:flex-row items-stretch gap-2 border border-rule transition-all hover:shadow-lg"
        >
          {/* Search Input Field with Icon */}
          <div className="flex-1 flex items-center bg-gray-50/90 rounded-sm px-4 py-3 border border-rule/80 focus-within:bg-white focus-within:border-institutional focus-within:ring-2 focus-within:ring-institutional/10 transition-all">
            <Search className="w-5 h-5 text-institutional/60 shrink-0 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for schemes, departments, allocations, sectors, or budget terms..."
              className="w-full bg-transparent text-sm sm:text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {/* Category Selector Dropdown */}
          <div className="sm:w-56 bg-gray-50/90 rounded-sm border border-rule/80 flex items-center px-3 py-2 sm:py-0">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-institutional focus:outline-none cursor-pointer"
            >
              <option value="All Categories">All Categories</option>
              <option value="Departments">Departments</option>
              <option value="Schemes">Schemes & Programs</option>
              <option value="Sectors">Sectors</option>
              <option value="Budget Data">Budget Allocations</option>
            </select>
          </div>

          {/* Primary Action Search Button */}
          <button
            type="submit"
            className="bg-[#E63946] hover:bg-[#D62828] text-white font-extrabold text-sm sm:text-base px-8 py-3.5 rounded-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider shrink-0"
          >
            <span>Search</span>
          </button>
        </form>

        {/* Popular Search Recommendation Badges */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="font-extrabold text-saffron uppercase tracking-wider text-[11px]">
            Popular Searches:
          </span>
          {["Education", "Healthcare", "Infrastructure", "MGNREGS", "PM-KISAN", "Samagra Shiksha"].map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleQuickSearch(term)}
              className="bg-white hover:bg-institutional hover:text-white text-institutional font-semibold px-3 py-1 rounded-full text-[11px] transition-colors border border-rule shadow-2xs cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
