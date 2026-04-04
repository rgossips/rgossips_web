"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import BrandCard from "@/components/BrandCard";
import FilterModal, { FilterSidebar } from "@/components/FilterModal";
import { useAuth } from "@/context/AuthContext";
import { calculateBrandMatchScore } from "@/utils/matchScore";

export default function DiscoverBrands() {
  const { profile } = useAuth();

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FILTER STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [budgetRange, setBudgetRange] = useState({ min: 0, max: 10000 });
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // --- FETCH BRANDS ---
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

        const res = await fetch(`${supabaseUrl}/functions/v1/list-brands`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({}),
        });

        const data = await res.json();
        if (data?.brands) {
          setBrands(data.brands);
        }
      } catch (err) {
        console.error("Failed to fetch brands:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  // --- FILTER ENGINE ---
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const matchesSearch = brand.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(brand.category);
      const matchesBudget =
        brand.minBudget >= budgetRange.min &&
        brand.minBudget <= budgetRange.max;
      const matchesVerified = isVerifiedOnly ? brand.isVerified : true;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBudget &&
        matchesVerified
      );
    });
  }, [
    brands,
    searchQuery,
    selectedCategories,
    budgetRange,
    isVerifiedOnly,
  ]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setBudgetRange({ min: 0, max: 10000 });
    setIsVerifiedOnly(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-4 pb-24 lg:p-8 lg:pt-24 lg:pb-8 font-sans relative">
      <div className="max-w-7xl mx-auto">
        {/* Mobile header */}
        <div className="lg:hidden space-y-4 mb-2">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">Discover Brands</h1>
            <Button
              variant="outline"
              onClick={() => setIsFiltersOpen(true)}
              className="h-10 w-10 rounded-xl border-none bg-white shadow-sm shrink-0"
            >
              <SlidersHorizontal size={18} />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white border-none rounded-xl shadow-sm text-sm font-medium"
            />
          </div>
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

            <FilterSidebar
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              budgetRange={budgetRange}
              setBudgetRange={setBudgetRange}
              isVerifiedOnly={isVerifiedOnly}
              setIsVerifiedOnly={setIsVerifiedOnly}
              onExpand={() => setIsFiltersOpen(true)}
            />
          </aside>

          {/* --- RIGHT CONTENT --- */}
          <main className="lg:col-span-9 space-y-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={28} className="animate-spin text-purple-500" />
                <p className="text-sm font-bold text-slate-400">Loading brands...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredBrands.map((brand) => (
                      <BrandCard key={brand.id} brand={brand} matchScore={calculateBrandMatchScore(profile, brand)} />
                    ))}
                  </AnimatePresence>
                </div>

                {filteredBrands.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-[32px] text-slate-400 font-bold">
                    No brands match these filters.
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {isFiltersOpen && (
          <FilterModal
            onClose={() => setIsFiltersOpen(false)}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            budgetRange={budgetRange}
            setBudgetRange={setBudgetRange}
            isVerifiedOnly={isVerifiedOnly}
            setIsVerifiedOnly={setIsVerifiedOnly}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
