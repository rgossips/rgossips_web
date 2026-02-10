"use client";

import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  CheckCircle2,
  Star,
  Users,
  ArrowUpRight,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronDown,
  Check,
  Gamepad2,
  Tv,
  Smartphone,
  Globe,
  Monitor,
  Shirt,
  Dumbbell,
  Plane,
  Utensils,
  Camera,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import BrandCard from "@/components/BrandCard";
import FilterModal from "@/components/FilterModal";

export default function DiscoverBrands() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-4 lg:p-8 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="space-y-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
            Discover Brands
          </h1>

          <div className="flex gap-4">
            <div className="relative flex-1 max-w-[80%] group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E60076] transition-colors"
                size={20}
              />
              <Input
                placeholder="Search brands, campaigns..."
                className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm text-base placeholder:text-slate-400"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsFiltersOpen(true)}
              className="h-14 w-14 rounded-2xl border-none bg-white shadow-sm shrink-0 hover:bg-slate-50 transition-transform active:scale-95"
            >
              <SlidersHorizontal className="text-slate-600" />
            </Button>
          </div>

          {/* Search Tags */}
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {["Skincare", "Gaming PC", "Travel Vlog", "Fitness"].map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl text-xs font-semibold text-slate-600 shadow-sm border border-slate-50 whitespace-nowrap"
              >
                <TrendingUp size={14} className="text-[#00BA88]" />
                {tag}
              </div>
            ))}
          </div>

          {/* Categories */}
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
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Brand Grid */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-slate-800 text-lg">
                Top Brands
                <span className="text-slate-400 font-medium ml-2 text-sm">
                  {BRANDS.length} brands
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {BRANDS.map((brand) => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </div>
          </div>

          {/* Sidebar / Match Score Section */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 sticky top-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#00BA88] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#00BA88]/20">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Your Match Score</h3>
                  <p className="text-xs text-slate-400">
                    Based on your profile
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-0 text-center">
                <div className="px-2">
                  <p className="text-2xl font-black text-slate-800">92%</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">
                    Avg Match
                  </p>
                </div>
                <div className="border-x border-slate-100 px-2">
                  <p className="text-2xl font-black text-slate-800">156</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">
                    Oppty
                  </p>
                </div>
                <div className="px-2">
                  <p className="text-2xl font-black text-[#00BA88]">$2.5K</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">
                    Potential
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Filter Modal Overlay */}
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
