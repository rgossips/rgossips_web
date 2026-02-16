"use client";

import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import BrandCard from "@/components/BrandCard";
import FilterModal, { FilterContent } from "@/components/FilterModal";

export default function DiscoverBrands() {
  // --- FILTER STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [budgetRange, setBudgetRange] = useState({ min: 0, max: 10000 });
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // --- FILTER ENGINE ---
  const filteredBrands = useMemo(() => {
    return BRANDS.filter((brand) => {
      const matchesSearch = brand.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "All" || brand.category === activeCategory;
      const matchesBudget =
        brand.minBudget >= budgetRange.min &&
        brand.minBudget <= budgetRange.max;
      const matchesVerified = isVerifiedOnly ? brand.isVerified : true;
      const matchesPlatform =
        selectedPlatforms.length === 0 ||
        brand.platforms.some((p) => selectedPlatforms.includes(p));

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBudget &&
        matchesVerified &&
        matchesPlatform
      );
    });
  }, [
    searchQuery,
    activeCategory,
    budgetRange,
    isVerifiedOnly,
    selectedPlatforms,
  ]);

  const resetFilters = () => {
    setSearchQuery("");
    setActiveCategory("All");
    setBudgetRange({ min: 0, max: 10000 });
    setSelectedPlatforms([]);
    setIsVerifiedOnly(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-4 lg:p-8 lg:pt-24 font-sans relative">
      <div className="max-w-[1440px] mx-auto space-y-8">
        {/* Header - Mobile Only */}
        <div className="lg:hidden flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Discover Brands</h1>
          <Button
            variant="outline"
            onClick={() => setIsFiltersOpen(true)}
            className="h-12 w-12 rounded-xl border-none bg-white shadow-sm shrink-0"
          >
            <SlidersHorizontal size={20} />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* --- LEFT SIDEBAR (Desktop) --- */}
          <aside className="hidden lg:block lg:col-span-3 space-y-8 sticky top-8">
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E60076]"
                size={20}
              />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm text-sm font-medium"
              />
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-black text-slate-800 text-lg">Filters</h2>
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-slate-400 hover:text-[#E60076]"
                >
                  Reset
                </button>
              </div>

              {/* Passing States to Sidebar Filter */}
              <FilterContent
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                budgetRange={budgetRange}
                setBudgetRange={setBudgetRange}
                selectedPlatforms={selectedPlatforms}
                setSelectedPlatforms={setSelectedPlatforms}
                isVerifiedOnly={isVerifiedOnly}
                setIsVerifiedOnly={setIsVerifiedOnly}
              />
            </div>

            {/* Match Score Card Placeholder */}
            <div className="bg-[#00BA88] p-6 rounded-[32px] text-white">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp size={20} />
                <h3 className="font-bold text-sm">Match Score</h3>
              </div>
              <p className="text-3xl font-black">92%</p>
            </div>
          </aside>

          {/* --- RIGHT CONTENT --- */}
          <main className="lg:col-span-9 space-y-8">
            {/* Quick Category Switcher */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {["All", "Fashion", "Tech", "Beauty", "Fitness", "Travel"].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-3 rounded-2xl font-bold text-sm shrink-0 transition-all ${
                      activeCategory === cat
                        ? "bg-[#E60076] text-white shadow-lg"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {cat}
                  </button>
                ),
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredBrands.map((brand) => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
              </AnimatePresence>
            </div>

            {filteredBrands.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[32px] text-slate-400 font-bold">
                No brands match these filters.
              </div>
            )}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {isFiltersOpen && (
          <FilterModal
            onClose={() => setIsFiltersOpen(false)}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            budgetRange={budgetRange}
            setBudgetRange={setBudgetRange}
            selectedPlatforms={selectedPlatforms}
            setSelectedPlatforms={setSelectedPlatforms}
            isVerifiedOnly={isVerifiedOnly}
            setIsVerifiedOnly={setIsVerifiedOnly}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const BRANDS = [
  {
    id: 1,
    name: "Nike",
    category: "Fashion",
    minBudget: 1500,
    maxBudget: 5000,
    isVerified: true,
    platforms: ["Instagram", "TikTok"],
    activeCampaigns: 12,
    rating: 4.9,
    followers: "45.2K",
    logo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400",
    payout: "$1,500 - $5,000",
  },
  {
    id: 2,
    name: "Samsung",
    category: "Tech",
    minBudget: 2500,
    maxBudget: 8000,
    isVerified: true,
    platforms: ["YouTube", "Twitter"],
    activeCampaigns: 8,
    rating: 4.8,
    followers: "120K",
    logo: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400",
    payout: "$2,500 - $8,000",
  },
  {
    id: 3,
    name: "Sephora", // FIXED LOGO LINK
    category: "Beauty",
    minBudget: 800,
    maxBudget: 2200,
    isVerified: false,
    platforms: ["Instagram", "TikTok"],
    activeCampaigns: 15,
    rating: 4.7,
    followers: "28K",
    logo: "https://images.pexels.com/photos/4602025/pexels-photo-4602025.jpeg",
    payout: "$800 - $2,200",
  },
  {
    id: 4,
    name: "Gymshark",
    category: "Fitness",
    minBudget: 1200,
    maxBudget: 3500,
    isVerified: true,
    platforms: ["Instagram", "TikTok", "YouTube"],
    activeCampaigns: 6,
    rating: 4.9,
    followers: "89K",
    logo: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=400",
    payout: "$1,200 - $3,500",
  },
  {
    id: 5,
    name: "Airbnb",
    category: "Travel",
    minBudget: 3000,
    maxBudget: 10000,
    isVerified: true,
    platforms: ["Instagram", "YouTube", "Twitter"],
    activeCampaigns: 4,
    rating: 5.0,
    followers: "210K",
    logo: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=400",
    payout: "$3,000 - $10,000",
  },
];
