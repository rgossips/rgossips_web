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

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState("Active");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const RECENT_SEARCHES = [
    "Fashion campaigns",
    "High budget",
    "Tech reviews",
    "Instagram only",
  ];

  const CAMPAIGN_FILTER_DATA = {
    categories: [
      "Fashion",
      "Technology",
      "Fitness",
      "Beauty",
      "Food",
      "Travel",
      "Music",
      "Gaming",
      "Lifestyle",
      "Education",
    ],
    platforms: [
      { label: "Instagram", icon: <Instagram size={18} /> },
      { label: "YouTube", icon: <Youtube size={18} /> },
      { label: "TikTok", icon: <Activity size={18} /> },
    ],
    statusOptions: ["Active", "Applied", "Completed"],
  };

  const filteredCampaigns = CAMPAIGNS_DATA.filter(
    (campaign) => campaign.status === activeTab,
  );

  return (
    // FIX: Added 'flex' here so sidebar and content sit side-by-side on laptop
    <div className="flex min-h-screen bg-[#F8F9FD] font-sans relative">
      {/* --- SIDEBAR --- */}
      <aside className="hidden pt-24 lg:flex w-80 flex-col bg-white border-r border-slate-100 p-8 sticky top-0 h-screen overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Campaigns</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">
            Collaboration Hub
          </p>
        </div>

        <div className="relative mb-8">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search campaigns..."
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-pink-100 outline-none transition-all"
            onClick={() => setIsSearchOpen(true)}
          />
        </div>

        <nav className="space-y-8">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mb-4">
              Status
            </h3>
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

          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mb-4">
              Quick Filters
            </h3>
            <div className="space-y-1">
              {["All", "High Budget", "Ending Soon", "New"].map((filter) => (
                <button
                  key={filter}
                  className="w-full cursor-pointer text-left px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      {/* FIX: Added 'flex-1' and 'overflow-y-auto' so this scrolls while sidebar stays fixed */}
      <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
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

        {/* FIX: Increased max-width to lg:max-w-4xl for better laptop spacing */}
        <div className="max-w-xl lg:max-w-5xl mx-auto space-y-8">
          <header className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 lg:hidden">
                  Campaigns
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-medium lg:hidden">
                  Track and manage collaborations
                </p>
                {/* Desktop subtitle - only shows on laptop */}
                <h2 className="hidden lg:block text-xl font-bold text-slate-800">
                  {activeTab} Campaigns
                </h2>
              </div>
              <div className="flex gap-2">
                {/* Mobile Search - Hidden on Laptop because it's in the sidebar */}
                <Button
                  onClick={() => setIsSearchOpen(true)}
                  size="icon"
                  variant="ghost"
                  className="lg:hidden bg-white rounded-xl shadow-sm text-slate-400 hover:text-[#E60076]"
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

            {/* Mobile Tab Switcher - Hidden on Laptop because it's in the sidebar */}
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
          </header>

          <main className="space-y-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
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
