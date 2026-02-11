"use client";

import React, { useState } from "react";
import { Search, SlidersHorizontal, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import BrandCard from "@/components/BrandCard";
import FilterModal, { FilterContent } from "@/components/FilterModal";

export default function DiscoverBrands() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-4 lg:p-8 lg:pt-24 font-sans relative">
      <div className="max-w-[1440px] mx-auto space-y-8">
        {/* Header - Mobile Only (Title + Filter Toggle) */}
        <div className="lg:hidden flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Discover Brands</h1>
          <Button
            variant="outline"
            onClick={() => setIsFiltersOpen(true)}
            className="h-12 w-12 rounded-xl border-none bg-white shadow-sm shrink-0 hover:bg-slate-50"
          >
            <SlidersHorizontal className="text-slate-600" size={20} />
          </Button>
        </div>

        {/* MAIN LAYOUT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* --- LEFT SIDEBAR (Desktop Only) --- */}
          <aside className="hidden lg:block lg:col-span-3 space-y-8 sticky top-8">
            {/* Search Bar (In Sidebar for Desktop) */}
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E60076] transition-colors"
                size={20}
              />
              <Input
                placeholder="Search..."
                className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm text-sm font-medium"
              />
            </div>

            {/* Filter Content Wrapper */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-black text-slate-800 text-lg">Filters</h2>
                <button className="text-xs font-bold text-slate-400 hover:text-[#E60076]">
                  Reset
                </button>
              </div>
              <FilterContent />
            </div>

            {/* Match Score Card (Moved to Sidebar) */}
            <div className="bg-[#00BA88] p-6 rounded-[32px] shadow-lg shadow-[#00BA88]/20 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full blur-xl"></div>

              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Match Score</h3>
                  <p className="text-[10px] opacity-80">
                    Based on your profile
                  </p>
                </div>
              </div>

              <div className="flex items-end justify-between relative z-10">
                <div>
                  <p className="text-3xl font-black">92%</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">
                    Avg Match
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">$2.5K</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">
                    Potential
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* --- RIGHT CONTENT (Brands Grid) --- */}
          <main className="lg:col-span-9 space-y-8">
            {/* Horizontal Categories (Visible on both, adapted for Desktop) */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all shrink-0 shadow-sm ${
                    activeCategory === cat.name
                      ? "bg-[#E60076] text-white shadow-lg shadow-[#E60076]/20"
                      : "bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Mobile Search (Hidden on Desktop) */}
            <div className="lg:hidden relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <Input
                placeholder="Search brands..."
                className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm"
              />
            </div>

            {/* Results Header */}
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-slate-800">
                  Top Brands
                </h2>
                <p className="text-slate-400 text-sm font-medium mt-1">
                  Showing {BRANDS.length} results
                </p>
              </div>
            </div>

            {/* Brand Grid - 3 Columns on Laptop now because sidebar takes space */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {BRANDS.map((brand) => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* Filter Modal Overlay (Mobile Only) */}
      <AnimatePresence>
        {isFiltersOpen && (
          <FilterModal onClose={() => setIsFiltersOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Constants ---
const CATEGORIES = [
  { name: "All", icon: "✨" },
  { name: "Fashion", icon: "👗" },
  { name: "Tech", icon: "💻" },
  { name: "Beauty", icon: "💄" },
  { name: "Fitness", icon: "💪" },
];

const BRANDS = [
  {
    id: 1,
    name: "Nike",
    category: "Fashion",
    activeCampaigns: 8,
    payout: "$1,500-3,000",
    rating: 4.8,
    followers: "2.3K",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
  },
  {
    id: 2,
    name: "Samsung",
    category: "Tech",
    activeCampaigns: 12,
    payout: "$2,000-5,000",
    rating: 4.9,
    followers: "3.1K",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg",
  },
  {
    id: 3,
    name: "Sephora",
    category: "Beauty",
    activeCampaigns: 15,
    payout: "$800-1,800",
    rating: 4.7,
    followers: "1.8K",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Sephora_logo.svg",
  },
  {
    id: 4,
    name: "GoPro",
    category: "Travel",
    activeCampaigns: 6,
    payout: "$1,200-2,500",
    rating: 4.6,
    followers: "890",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5b/GoPro_logo.svg",
  },
  {
    id: 5,
    name: "HelloFresh",
    category: "Food",
    activeCampaigns: 10,
    payout: "$600-1,500",
    rating: 4.5,
    followers: "1.2K",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/91/HelloFresh_Logo.svg",
  },
  {
    id: 6,
    name: "Gymshark",
    category: "Fitness",
    activeCampaigns: 9,
    payout: "$900-2,000",
    rating: 4.8,
    followers: "1.5K",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/25/Gymshark_logo_black.svg",
  },
];
