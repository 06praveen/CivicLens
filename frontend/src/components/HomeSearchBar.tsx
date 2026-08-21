import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import emblemIndia from "@/assets/emblem-india.png";
import { getBudgets } from "@/api/budgets";

interface SearchResultItem {
  id: string | number;
  title: string;
  category: string;
  targetUrl: string;
}

const CATEGORIES = [
  { id: "All", label: "All Categories" },
  { id: "Departments", label: "Departments" },
  { id: "Schemes", label: "Schemes & Programs" },
  { id: "Sectors", label: "Sectors" },
  { id: "Allocations", label: "Budget Allocations" },
];

export function HomeSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real search fetching logic
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await getBudgets({
          search: query.trim(),
          limit: 6,
        });

        if (res && res.data && res.data.length > 0) {
          const items: SearchResultItem[] = res.data.map((item) => ({
            id: item.record_id,
            title: item.budget_item,
            category: item.ministry_department || item.expenditure_category || "Allocation",
            targetUrl: `/explore-budget?search=${encodeURIComponent(item.budget_item_key || item.budget_item)}`,
          }));
          setSearchResults(items);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Home search error:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
        setShowDropdown(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedCategory]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowDropdown(false);
    const q = query.trim();
    if (!q) {
      navigate("/explore-budget");
      return;
    }
    
    if (selectedCategory === "Departments") {
      navigate(`/departments?search=${encodeURIComponent(q)}`);
    } else {
      navigate(`/explore-budget?search=${encodeURIComponent(q)}&category=${encodeURIComponent(selectedCategory)}`);
    }
  }

  function handleQuickSearch(term: string) {
    setQuery(term);
    setShowDropdown(false);
    navigate(`/explore-budget?search=${encodeURIComponent(term)}&category=${encodeURIComponent(selectedCategory)}`);
  }

  function handleResultClick(item: SearchResultItem) {
    setShowDropdown(false);
    navigate(item.targetUrl);
  }

  return (
    <section className="bg-ivory/80 border-b border-rule py-8 sm:py-10 shadow-xs">
      <div className="portal-container w-full max-w-4xl flex flex-col items-center">
        
        {/* ── National Portal Branding Header ── */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-2 flex justify-center">
            <img
              src={emblemIndia}
              alt="State Emblem of India - Satyamev Jayate"
              className="h-20 sm:h-24 md:h-28 w-auto object-contain drop-shadow-xs"
            />
          </div>

          <div className="flex items-center justify-center gap-2.5 mb-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-institutional">
              civiclens.gov.in
            </span>
            <span className="bg-[#FFB703] text-black font-extrabold text-xs sm:text-sm px-2.5 py-0.5 rounded-xs uppercase tracking-wider shadow-2xs">
              BETA
            </span>
          </div>

          <div className="w-52 sm:w-72 h-1.5 rounded-full bg-gradient-to-r from-saffron via-white to-emerald-600 mb-2 border border-rule/30" />

          <h2 className="text-base sm:text-xl font-bold text-institutional tracking-wide">
            National Portal of India
          </h2>

          <p className="text-sm sm:text-base font-semibold text-institutional/80 mt-1">
            Where Government Information Converges
          </p>
        </div>

        {/* ── Category Tabs Row ── */}
        <div className="w-full mb-3 flex items-center justify-center gap-1.5 overflow-x-auto pb-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xs text-xs font-bold transition-all whitespace-nowrap border ${
                selectedCategory === cat.id
                  ? "bg-institutional text-white border-institutional shadow-xs"
                  : "bg-white text-institutional/80 border-rule hover:bg-institutional/5 hover:text-institutional"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Full-width Search Bar Container ── */}
        <div ref={dropdownRef} className="w-full relative">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full bg-white rounded-md shadow-md p-2 flex flex-col sm:flex-row items-stretch gap-2 border border-rule transition-all hover:shadow-lg"
          >
            {/* Search Input Field */}
            <div className="flex-1 flex items-center bg-gray-50/90 rounded-sm px-4 py-3 border border-rule/80 focus-within:bg-white focus-within:border-institutional focus-within:ring-2 focus-within:ring-institutional/10 transition-all">
              <Search className="w-5 h-5 text-institutional/60 shrink-0 mr-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.trim() && setShowDropdown(true)}
                placeholder="Search for schemes, departments, allocations, sectors, or budget terms..."
                className="w-full bg-transparent text-sm sm:text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {/* Category Selector Dropdown */}
            <div className="sm:w-56 bg-gray-50/90 rounded-sm border border-rule/80 flex items-center px-3 py-2 sm:py-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-institutional focus:outline-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
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

          {/* Real Search Results Dropdown Overlay */}
          {showDropdown && query.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-rule rounded-md shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-muted-foreground font-semibold flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-institutional border-t-transparent rounded-full animate-spin" />
                  Searching official CivicLens database...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-rule">
                  {searchResults.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => handleResultClick(res)}
                      className="w-full text-left p-3 hover:bg-institutional/5 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-bold text-institutional group-hover:text-saffron transition-colors">
                          {res.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{res.category}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-institutional transition-colors shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-5 text-center text-xs text-muted-foreground space-y-1">
                  <p className="font-bold text-institutional">No results found for "{query}"</p>
                  <p>Try searching for terms like "Education", "Healthcare", "Agriculture", or "MGNREGS"</p>
                </div>
              )}
            </div>
          )}
        </div>

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
