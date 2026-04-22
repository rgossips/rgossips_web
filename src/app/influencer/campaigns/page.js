"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  Activity,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import { CampaignCard } from "@/components/CampaignCard";
import FilterModal, { FilterSidebar } from "@/components/FilterModal";
import { useAuth } from "@/context/AuthContext";
import { calculateCampaignMatchScore } from "@/utils/matchScore";
import { useSearchParams } from "next/navigation";

export default function CampaignsPage() {
  const { profile, user } = useAuth();
  const searchParams = useSearchParams();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("Active");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const cat = searchParams?.get("category");
    return cat ? [cat] : [];
  });
  const [budgetRange, setBudgetRange] = useState({ min: 0, max: 200000 });
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
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

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesTab = campaign.status === activeTab;
      const matchesSearch = campaign.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        campaign.brandName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 ||
        campaign.tags.some((t) => selectedCategories.some((c) => t.toLowerCase().includes(c.toLowerCase())));
      const matchesPlatform =
        selectedPlatforms.length === 0 ||
        campaign.platforms.some((p) =>
          selectedPlatforms.map((sp) => sp.toLowerCase()).includes(p.toLowerCase())
        );
      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(campaign.brandName);
      const budgetNum = parseInt((campaign.budget || "").replace(/[^\d]/g, "")) || 0;
      const matchesBudget = budgetNum >= budgetRange.min && (budgetRange.max >= 200000 || budgetNum <= budgetRange.max);
      return matchesTab && matchesSearch && matchesCategory && matchesPlatform && matchesBrand && matchesBudget;
    });
  }, [campaigns, activeTab, searchQuery, selectedCategories, selectedPlatforms, selectedBrands, budgetRange]);

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-4 pb-24 lg:p-8 lg:pt-24 lg:pb-8 font-sans relative">
      <div className="max-w-[1440px] mx-auto space-y-8">
        {/* Header - Mobile Only */}
        <div className="lg:hidden space-y-4 mb-2">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Campaigns</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Track and manage collaborations
              </p>
            </div>
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
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white border-none rounded-xl shadow-sm text-sm font-medium"
            />
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="lg:hidden bg-white p-1.5 rounded-2xl flex gap-1 shadow-sm border border-slate-50">
          {["Active", "Applied", "Completed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? "bg-[#E60076] text-white shadow-md shadow-pink-100"
                  : "text-slate-400"
              }`}
            >
              {tab}
            </button>
          ))}
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

            {/* Status Tabs */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
              <h2 className="font-black text-slate-800 text-lg mb-4">Status</h2>
              <div className="space-y-1">
                {["Active", "Applied", "Completed"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full cursor-pointer flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      activeTab === tab
                        ? "bg-gradient-to-r from-[#E60076] to-[#D500F9] text-white shadow-md shadow-pink-100"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <FilterSidebar
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              budgetRange={budgetRange}
              setBudgetRange={setBudgetRange}
              selectedPlatforms={selectedPlatforms}
              setSelectedPlatforms={setSelectedPlatforms}
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
              <h2 className="text-xl font-bold text-slate-800">
                {activeTab} Campaigns
              </h2>
              <span className="text-sm font-bold text-slate-400">
                {filteredCampaigns.length} campaigns
              </span>
            </div>

            {/* Mobile Stats */}
            <div className="grid grid-cols-3 gap-4 lg:hidden">
              {[
                {
                  label: "Active",
                  val: campaigns.filter((c) => c.status === "Active").length,
                  icon: <Activity className="text-[#00BA88]" />,
                  bg: "bg-emerald-50",
                },
                {
                  label: "Applied",
                  val: campaigns.filter((c) => c.status === "Applied").length,
                  icon: <Clock className="text-blue-500" />,
                  bg: "bg-blue-50",
                },
                {
                  label: "Completed",
                  val: campaigns.filter((c) => c.status === "Completed").length,
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
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={28} className="animate-spin text-purple-500" />
                <p className="text-sm font-bold text-slate-400">Loading campaigns...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredCampaigns.map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} matchScore={calculateCampaignMatchScore(profile, campaign)} />
                  ))}
                </div>

                {filteredCampaigns.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-[32px] text-slate-400 font-bold">
                    No {activeTab.toLowerCase()} campaigns found.
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
            selectedPlatforms={selectedPlatforms}
            setSelectedPlatforms={setSelectedPlatforms}
            brands={brandNames}
            selectedBrands={selectedBrands}
            setSelectedBrands={setSelectedBrands}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
