"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import BrandCard from "@/components/BrandCard";
import ListPagination from "@/components/ListPagination";
import FilterModal, { FilterSidebar } from "@/components/FilterModal";
import { useAuth } from "@/context/AuthContext";
import { calculateBrandMatchScore } from "@/utils/matchScore";
import { useTranslations } from "next-intl";

export default function DiscoverBrands() {
  const t = useTranslations("InfluencerBrands");
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

  // Sort order: match score (default) / A–Z / most active campaigns.
  const [sortBy, setSortBy] = useState("match");

  // --- FILTER ENGINE ---
  const filteredBrands = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    const passed = brands.filter((brand) => {
      const name = (brand.name || "").toLowerCase();
      const ig = (brand.instagram || "").toLowerCase();
      const cats = Array.isArray(brand.categories) ? brand.categories : [];

      // Match against name OR @handle
      const matchesSearch =
        q === "" || name.includes(q) || ig.includes(q.replace(/^@/, ""));

      // Match if selected category is in any of the brand's categories
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some(
          (c) => cats.includes(c) || brand.category === c
        );

      // Budget filter — skip when brand has no budget info (minBudget = 0)
      const matchesBudget =
        !brand.minBudget ||
        (brand.minBudget >= budgetRange.min && brand.minBudget <= budgetRange.max);

      const matchesVerified = isVerifiedOnly ? brand.isVerified : true;

      return matchesSearch && matchesCategory && matchesBudget && matchesVerified;
    });

    // User-selectable sort. "match" (default) keeps the best-fit brands on
    // top using the SAME scorer the card badge renders, so position and %
    // agree. Ties keep their original order.
    if (sortBy === "az") {
      return [...passed].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    if (sortBy === "campaigns") {
      return [...passed].sort((a, b) => (b.activeCampaigns || 0) - (a.activeCampaigns || 0));
    }
    return passed
      .map((b) => ({ b, score: calculateBrandMatchScore(profile, b) }))
      .sort((a, c) => c.score - a.score)
      .map(({ b }) => b);
  }, [brands, searchQuery, selectedCategories, budgetRange, isVerifiedOnly, profile, sortBy]);

  // Client-side pagination — 30 per page, reset on any filter change.
  const PAGE_SIZE = 30;
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategories, budgetRange, isVerifiedOnly, sortBy]);
  const pageCount = Math.max(1, Math.ceil(filteredBrands.length / PAGE_SIZE));
  const pagedBrands = filteredBrands.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goToPage = (p) => {
    setPage(Math.min(Math.max(1, p), pageCount));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setBudgetRange({ min: 0, max: 10000 });
    setIsVerifiedOnly(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-4 pb-24 lg:p-8 lg:pt-24 lg:pb-8 font-sans relative">
      <div className="max-w-[1440px] mx-auto">
        {/* Mobile header */}
        <div className="lg:hidden space-y-4 mb-2">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">{t("title")}</h1>
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
              placeholder={t("searchBrandsPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white border-none rounded-xl shadow-sm text-sm font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* --- LEFT SIDEBAR (Desktop) --- */}
          {/* Same fix as the campaigns page sidebar — sticky + max-h +
              overflow-y-auto so the "All Filters" expand button at the
              bottom stays reachable on short viewports without
              scrolling the full page. */}
          <aside className="hidden lg:block lg:col-span-3 space-y-8 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto pr-2 scrollbar-thin">
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E60076]"
                size={20}
              />
              <Input
                placeholder={t("searchPlaceholder")}
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
                <p className="text-sm font-bold text-slate-400">{t("loading")}</p>
              </div>
            ) : (
              <>
                {/* Count + sort control */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-sm font-bold text-slate-400">
                    {t("countBrands", { count: filteredBrands.length })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("sort.label")}</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="h-9 px-3 pr-8 rounded-xl bg-white border border-slate-100 shadow-sm text-xs font-bold text-slate-600 outline-none cursor-pointer"
                    >
                      <option value="match">{t("sort.match")}</option>
                      <option value="az">{t("sort.az")}</option>
                      <option value="campaigns">{t("sort.campaigns")}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {pagedBrands.map((brand) => (
                      <BrandCard key={brand.id} brand={brand} matchScore={calculateBrandMatchScore(profile, brand)} />
                    ))}
                  </AnimatePresence>
                </div>

                <ListPagination page={page} pageCount={pageCount} onPage={goToPage} />

                {filteredBrands.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-[32px] text-slate-400 font-bold">
                    {t("empty")}
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
            title={t("filterTitle")}
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
