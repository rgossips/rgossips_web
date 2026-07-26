"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  Activity,
  Clock,
  CheckCircle,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import { CampaignCard } from "@/components/CampaignCard";
import FilterModal, { FilterSidebar } from "@/components/FilterModal";
import { useAuth } from "@/context/AuthContext";
import { calculateCampaignMatchScore } from "@/utils/matchScore";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import ListPagination from "@/components/ListPagination";

export default function CampaignsPage() {
  const t = useTranslations("InfluencerCampaigns");
  const { profile, user } = useAuth();
  const searchParams = useSearchParams();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("Active");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Accept either ?category=Beauty (single, legacy) or
  // ?categories=Beauty,Fashion (multi, used by Recommended Campaigns'
  // "View all" link) — both pre-fill the category filter on load.
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const single = searchParams?.get("category");
    const multi = searchParams?.get("categories");
    if (multi) return multi.split(",").map((c) => c.trim()).filter(Boolean);
    return single ? [single] : [];
  });
  const [budgetRange, setBudgetRange] = useState({ min: 0, max: 200000 });
  const [selectedBrands, setSelectedBrands] = useState(() => {
    const b = searchParams?.get("brand");
    return b ? [b] : [];
  });

  // --- FETCH CAMPAIGNS ---
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

        const res = await fetch(`${supabaseUrl}/functions/v1/list-campaigns`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ influencerId: user?.id }),
        });

        const data = await res.json();
        if (data?.campaigns) {
          setCampaigns(data.campaigns);
        }
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user?.id]);

  // Unique brand names across all campaigns — sorted alphabetically
  const brandNames = useMemo(() => {
    const set = new Set();
    for (const c of campaigns) {
      if (c.brandName) set.add(c.brandName);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [campaigns]);

  // Which tab a campaign belongs to. "Completed" surfaces only campaigns
  // the user applied to AND finished. "Invites" holds campaigns the brand
  // personally invited the creator to but they HAVEN'T applied yet — once
  // applied, the campaign's status becomes "Applied" and it moves there.
  // Invited campaigns are pulled OUT of the Active tab so they don't double up.
  const tabMatches = (campaign, tab) => {
    if (tab === "Completed") return campaign.applicationStatus === "completed";
    if (tab === "Invites") return !!campaign.invited && campaign.status === "Active";
    if (tab === "Active") return campaign.status === "Active" && !campaign.invited;
    return campaign.status === tab; // Applied
  };

  // Non-tab filters (search / category / brand / budget). Extracted so the
  // tab COUNT badges and the rendered LIST use the SAME predicate — otherwise
  // an active filter (e.g. a category prefilled from the URL) hides a card
  // while the badge still counts it, so a tab reads "2" but shows 1.
  const passesFilters = (campaign) => {
    const matchesSearch =
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.brandName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategories.length === 0 ||
      campaign.tags.some((t) => selectedCategories.some((c) => t.toLowerCase().includes(c.toLowerCase())));
    const matchesBrand =
      selectedBrands.length === 0 || selectedBrands.includes(campaign.brandName);
    const budgetNum = parseInt((campaign.budget || "").replace(/[^\d]/g, "")) || 0;
    const matchesBudget = budgetNum >= budgetRange.min && (budgetRange.max >= 200000 || budgetNum <= budgetRange.max);
    return matchesSearch && matchesCategory && matchesBrand && matchesBudget;
  };

  // Count for a tab that respects the same active filters as the list.
  const tabCount = (tab) =>
    campaigns.filter((c) => tabMatches(c, tab) && passesFilters(c)).length;

  // "Invites" tab only exists when the brand has personally invited the creator
  // to at least one campaign they haven't applied to yet.
  const hasInvites = useMemo(
    () => campaigns.some((c) => c.invited && c.status === "Active"),
    [campaigns],
  );
  const TABS = hasInvites ? ["Invites", "Active", "Applied", "Completed"] : ["Active", "Applied", "Completed"];
  const tabLabel = (tab) => (tab === "Invites" ? "Invites" : t(`tabs.${tab}`));
  const tabLabelLower = (tab) => (tab === "Invites" ? "invites" : t(`tabsLower.${tab}`));

  // If the last invite gets applied while the user is on the Invites tab, move
  // them to Applied (where that campaign just went) instead of an empty view.
  useEffect(() => {
    if (!hasInvites && activeTab === "Invites") setActiveTab("Applied");
  }, [hasInvites, activeTab]);

  const filteredCampaigns = useMemo(() => {
    const passed = campaigns.filter(
      (campaign) => tabMatches(campaign, activeTab) && passesFilters(campaign)
    );

    // Sort by match score (highest first) so the best fit lands at the
    // top of the grid. Equal scores keep their server-side order
    // (newest-first by created_at). Memoised on the raw `passed` array
    // so a stable score isn't recomputed during re-render storms.
    return passed
      .map((c) => ({ c, score: calculateCampaignMatchScore(profile, c) }))
      .sort((a, b) => b.score - a.score)
      .map(({ c }) => c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns, activeTab, searchQuery, selectedCategories, selectedBrands, budgetRange, profile]);

  // Client-side pagination — 30 per page, reset to page 1 whenever the tab
  // or any filter changes so the user never lands on an empty page.
  const PAGE_SIZE = 30;
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery, selectedCategories, selectedBrands, budgetRange]);
  const pageCount = Math.max(1, Math.ceil(filteredCampaigns.length / PAGE_SIZE));
  const pagedCampaigns = filteredCampaigns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goToPage = (p) => {
    setPage(Math.min(Math.max(1, p), pageCount));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filtered-state header: "N out of M campaigns" + a Show-all reset. The
  // total ignores filters (tabCount applies them) so the ratio is honest.
  const tabTotalUnfiltered = campaigns.filter((c) => tabMatches(c, activeTab)).length;
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    budgetRange.min > 0 ||
    budgetRange.max < 200000;
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedBrands([]);
    setBudgetRange({ min: 0, max: 200000 });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-4 pb-24 lg:p-8 lg:pt-24 lg:pb-8 font-sans relative">
      <div className="max-w-[1440px] mx-auto space-y-8">
        {/* Header - Mobile Only */}
        <div className="lg:hidden space-y-4 mb-2">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{t("title")}</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.reload()}
                title={t("refreshStatus")}
                className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-white shadow-sm text-slate-500 hover:text-pink-500 cursor-pointer"
              >
                <RefreshCw size={16} />
              </button>
              <Button
                variant="outline"
                onClick={() => setIsFiltersOpen(true)}
                className="h-10 w-10 rounded-xl border-none bg-white shadow-sm shrink-0"
              >
                <SlidersHorizontal size={18} />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder={t("searchCampaignsPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white border-none rounded-xl shadow-sm text-sm font-medium"
            />
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="lg:hidden bg-white p-1.5 rounded-2xl flex gap-1 shadow-sm border border-slate-50">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? "bg-[#E60076] text-white shadow-md shadow-pink-100"
                  : "text-slate-400"
              }`}
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* --- LEFT SIDEBAR (Desktop) --- */}
          {/* sticky + max-h + overflow-y-auto so the sidebar scrolls
              internally instead of pushing the "All Filters" button
              off-screen on short viewports — was forcing the user to
              scroll the full page to reach it. The thin pr-2 leaves
              room for the scrollbar without pushing content under it. */}
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

            {/* Status Tabs */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
              <h2 className="font-black text-slate-800 text-lg mb-4">{t("statusHeading")}</h2>
              <div className="space-y-1">
                {TABS.map((tab) => {
                  const count = tabCount(tab);
                  const isActive = activeTab === tab;
                  const isInvites = tab === "Invites";
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`w-full cursor-pointer flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-[#E60076] to-[#D500F9] text-white shadow-md shadow-pink-100"
                          : isInvites
                            ? "text-[#5851DB] bg-indigo-50 hover:bg-indigo-100"
                            : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {isInvites && !isActive && <Sparkles size={13} />}
                        {tabLabel(tab)}
                      </span>
                      <span
                        className={`text-[11px] font-black px-2 py-0.5 rounded-md min-w-6 text-center ${
                          isActive
                            ? "bg-white/25 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filters */}
            <FilterSidebar
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              budgetRange={budgetRange}
              setBudgetRange={setBudgetRange}
              brands={brandNames}
              selectedBrands={selectedBrands}
              setSelectedBrands={setSelectedBrands}
              onExpand={() => setIsFiltersOpen(true)}
            />
          </aside>

          {/* --- RIGHT CONTENT --- */}
          <main className="lg:col-span-9 space-y-8">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between">
              <div className="flex items-baseline gap-3">
                <h2 className="text-xl font-bold text-slate-800">
                  {t("headerCampaigns", { tab: tabLabel(activeTab) })}
                </h2>
                {hasActiveFilters && (
                  <span className="text-sm font-bold text-[#E60076]">
                    {t("filteredOutOf", { shown: filteredCampaigns.length, total: tabTotalUnfiltered })}
                  </span>
                )}
              </div>
              {hasActiveFilters ? (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 rounded-xl text-xs font-black text-white cursor-pointer shadow-md shadow-pink-100 hover:opacity-90 transition-all"
                  style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
                >
                  {t("showAll")}
                </button>
              ) : (
                <span className="text-sm font-bold text-slate-400">
                  {t("campaignCount", { count: filteredCampaigns.length })}
                </span>
              )}
            </div>

            {/* Mobile filtered strip — same info without the desktop header */}
            {hasActiveFilters && (
              <div className="lg:hidden flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-50">
                <span className="text-xs font-bold text-[#E60076]">
                  {t("filteredOutOf", { shown: filteredCampaigns.length, total: tabTotalUnfiltered })}
                </span>
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-black text-white cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
                >
                  {t("showAll")}
                </button>
              </div>
            )}

            {/* Mobile Stats */}
            <div className="grid grid-cols-3 gap-4 lg:hidden">
              {[
                {
                  label: "Active",
                  val: tabCount("Active"),
                  icon: <Activity className="text-[#00BA88]" />,
                  bg: "bg-emerald-50",
                },
                {
                  label: "Applied",
                  val: tabCount("Applied"),
                  icon: <Clock className="text-blue-500" />,
                  bg: "bg-blue-50",
                },
                {
                  label: "Completed",
                  val: tabCount("Completed"),
                  icon: <CheckCircle className="text-emerald-500" />,
                  bg: "bg-emerald-50",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white p-4 rounded-[24px] border border-slate-50 flex flex-col items-center text-center"
                >
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-2`}>
                    {stat.icon}
                  </div>
                  <p className="text-lg font-black text-slate-800 leading-none">{stat.val}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">{t(`tabs.${stat.label}`)}</p>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={28} className="animate-spin text-purple-500" />
                <p className="text-sm font-bold text-slate-400">{t("loading")}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {pagedCampaigns.map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} matchScore={calculateCampaignMatchScore(profile, campaign)} />
                  ))}
                </div>

                <ListPagination page={page} pageCount={pageCount} onPage={goToPage} />

                {filteredCampaigns.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-[32px] text-slate-400 font-bold">
                    {t("empty", { tab: tabLabelLower(activeTab) })}
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
            brands={brandNames}
            selectedBrands={selectedBrands}
            setSelectedBrands={setSelectedBrands}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
