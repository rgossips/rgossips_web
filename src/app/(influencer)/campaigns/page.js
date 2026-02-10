"use client";
import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Activity,
  Clock,
  CheckCircle,
  Instagram,
  Youtube,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "@/components/CampaignCard";
import { SearchOverlay } from "@/components/SearchOverlay";
import { CampaignFilters } from "@/components/CampaignFilters";

// ... (Keep CAMPAIGNS_DATA, RECENT_SEARCHES, and CAMPAIGN_FILTER_DATA here)

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState("Active");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filter campaigns based on the current active tab
  const filteredCampaigns = CAMPAIGNS_DATA.filter(
    (campaign) => campaign.status === activeTab,
  );

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-6 lg:p-10 font-sans relative">
      <AnimatePresence>
        {isSearchOpen && (
          <SearchOverlay
            onClose={() => setIsSearchOpen(false)}
            recentSearches={RECENT_SEARCHES}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFiltersOpen && (
          <CampaignFilters
            onClose={() => setIsFiltersOpen(false)}
            filterData={CAMPAIGN_FILTER_DATA}
          />
        )}
      </AnimatePresence>

      <div className="max-w-xl mx-auto space-y-8">
        <header className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Campaigns</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Track and manage collaborations
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsSearchOpen(true)}
                size="icon"
                variant="ghost"
                className="bg-white rounded-xl shadow-sm text-slate-400 hover:text-[#E60076]"
              >
                <Search size={20} />
              </Button>
              <Button
                onClick={() => setIsFiltersOpen(true)}
                size="icon"
                variant="ghost"
                className="bg-white rounded-xl shadow-sm text-slate-400 hover:text-[#E60076]"
              >
                <SlidersHorizontal size={20} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Active",
                val: 24,
                icon: <Activity className="text-[#00BA88]" />,
                bg: "bg-emerald-50",
              },
              {
                label: "Applied",
                val: 12,
                icon: <Clock className="text-blue-500" />,
                bg: "bg-blue-50",
              },
              {
                label: "Completed",
                val: 38,
                icon: <CheckCircle className="text-emerald-500" />,
                bg: "bg-emerald-50",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white p-4 rounded-[24px] border border-slate-50 flex flex-col items-center text-center"
              >
                <div
                  className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-2`}
                >
                  {stat.icon}
                </div>
                <p className="text-lg font-black text-slate-800 leading-none">
                  {stat.val}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white p-1.5 rounded-2xl flex gap-1 shadow-sm border border-slate-50">
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

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {["All", "High Budget", "Ending Soon", "New"].map((pill) => (
              <button
                key={pill}
                className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-500 whitespace-nowrap active:bg-pink-50"
              >
                {pill}
              </button>
            ))}
          </div>
        </header>

        <main className="space-y-6">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
              No {activeTab.toLowerCase()} campaigns found.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
const CAMPAIGNS_DATA = [
  {
    id: 1,
    initials: "SB",
    title: "Summer",
    brandName: "StyleBrand Co.",
    status: "Active",
    tags: ["Fashion", "Lifestyle"],
    budget: "₹25,000 - ₹35,000",
    deadline: "Jan 30, 2026",
    daysLeft: "10d",
    deliverables: "2 Reels + 2 Stories",
    location: "Mumbai, India",
    platforms: ["instagram", "tiktok"],
  },
  {
    id: 2,
    initials: "MB",
    title: "Music",
    brandName: "MusicWave Events",
    status: "Applied",
    tags: ["Music", "Events"],
    budget: "₹30,000 - ₹40,000",
    deadline: "Feb 10, 2026",
    daysLeft: "21d",
    deliverables: "4 Reels + 2 Videos",
    location: "Pune",
    platforms: ["instagram", "youtube"],
  },
  {
    id: 3,
    initials: "GB",
    title: "Eco-Friendly",
    brandName: "GreenEarth Co.",
    status: "Completed",
    tags: ["Sustainability", "Lifestyle"],
    budget: "₹20,000 - ₹25,000",
    deadline: "Jan 15, 2026",
    deliverables: "2 Videos + 1 Reel",
    location: "Chennai",
    platforms: ["youtube"],
  },
];
