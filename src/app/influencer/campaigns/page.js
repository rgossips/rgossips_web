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
      "Beauty & Skincare",
      "Fashion & Lifestyle",
      "Food & Beverage",
      "Health, Fitness & Wellness",
      "Travel & Hospitality",
      "Technology & Gadgets",
      "Parenting & Family",
      "Home & Decor",
      "Finance & Personal Finance",
      "Education & Career",
      "Gaming & Entertainment",
      "Automobile & Mobility",
      "Entrepreneurship & Business",
      "Sustainable & Eco-conscious Living",
      "Pet Care & Animals",
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
      <div className="flex-1 p-6 lg:p-10 lg:pt-24 overflow-y-auto">
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
                  className="bg-white rounded-xl cursor-pointer shadow-sm text-slate-400 hover:text-[#E60076] border border-slate-100"
                >
                  <SlidersHorizontal size={20} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Active",
                  val: CAMPAIGNS_DATA.filter((c) => c.status === "Active")
                    .length,
                  icon: <Activity className="text-[#00BA88]" />,
                  bg: "bg-emerald-50",
                },
                {
                  label: "Applied",
                  val: CAMPAIGNS_DATA.filter((c) => c.status === "Applied")
                    .length,
                  icon: <Clock className="text-blue-500" />,
                  bg: "bg-blue-50",
                },
                {
                  label: "Completed",
                  val: CAMPAIGNS_DATA.filter((c) => c.status === "Completed")
                    .length,
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
  // ── Active ──
  {
    id: 1,
    initials: "SB",
    title: "Summer Collection",
    brandName: "StyleBrand Co.",
    status: "Active",
    tags: ["Fashion", "Lifestyle"],
    budget: "₹25,000 - ₹35,000",
    deadline: "Apr 15, 2026",
    daysLeft: "20d",
    deliverables: "2 Reels + 2 Stories",
    location: "Mumbai",
    platforms: ["instagram", "tiktok"],
  },
  {
    id: 2,
    initials: "NK",
    title: "Running Gear Drop",
    brandName: "Nike India",
    status: "Active",
    tags: ["Fitness", "Fashion"],
    budget: "₹50,000 - ₹75,000",
    deadline: "Apr 20, 2026",
    daysLeft: "25d",
    deliverables: "3 Reels + 1 YT Short",
    location: "Delhi",
    platforms: ["instagram", "youtube"],
  },
  {
    id: 3,
    initials: "ME",
    title: "Skincare Routine",
    brandName: "Mamaearth",
    status: "Active",
    tags: ["Beauty", "Wellness"],
    budget: "₹15,000 - ₹20,000",
    deadline: "Apr 10, 2026",
    daysLeft: "15d",
    deliverables: "1 Reel + 3 Stories",
    location: "Bangalore",
    platforms: ["instagram"],
  },
  {
    id: 4,
    initials: "BT",
    title: "Wireless Earbuds Launch",
    brandName: "boAt Lifestyle",
    status: "Active",
    tags: ["Technology", "Music"],
    budget: "₹30,000 - ₹45,000",
    deadline: "Apr 25, 2026",
    daysLeft: "30d",
    deliverables: "1 Unboxing + 2 Reels",
    location: "Pan India",
    platforms: ["instagram", "youtube"],
  },
  {
    id: 5,
    initials: "ZM",
    title: "Healthy Snacks",
    brandName: "Zomato",
    status: "Active",
    tags: ["Food", "Lifestyle"],
    budget: "₹20,000 - ₹30,000",
    deadline: "Apr 18, 2026",
    daysLeft: "23d",
    deliverables: "2 Reels + 1 Story",
    location: "Hyderabad",
    platforms: ["instagram", "tiktok"],
  },
  {
    id: 6,
    initials: "SG",
    title: "Lipstick Collection",
    brandName: "Sugar Cosmetics",
    status: "Active",
    tags: ["Beauty", "Fashion"],
    budget: "₹18,000 - ₹25,000",
    deadline: "Apr 12, 2026",
    daysLeft: "17d",
    deliverables: "2 Reels + 4 Stories",
    location: "Mumbai",
    platforms: ["instagram"],
  },
  {
    id: 7,
    initials: "PH",
    title: "Budget Phones Review",
    brandName: "Flipkart",
    status: "Active",
    tags: ["Technology", "Deals"],
    budget: "₹40,000 - ₹55,000",
    deadline: "May 1, 2026",
    daysLeft: "36d",
    deliverables: "1 Video + 2 Shorts",
    location: "Pan India",
    platforms: ["youtube"],
  },
  {
    id: 8,
    initials: "CU",
    title: "Protein Shake Campaign",
    brandName: "Cure.fit",
    status: "Active",
    tags: ["Fitness", "Health"],
    budget: "₹22,000 - ₹30,000",
    deadline: "Apr 22, 2026",
    daysLeft: "27d",
    deliverables: "2 Reels + 1 Testimonial",
    location: "Bangalore",
    platforms: ["instagram", "youtube"],
  },
  {
    id: 9,
    initials: "NV",
    title: "Travel Vlog Series",
    brandName: "Navi Mumbai Tourism",
    status: "Active",
    tags: ["Travel", "Lifestyle"],
    budget: "₹60,000 - ₹80,000",
    deadline: "May 10, 2026",
    daysLeft: "45d",
    deliverables: "3 Vlogs + 5 Stories",
    location: "Navi Mumbai",
    platforms: ["youtube", "instagram"],
  },
  {
    id: 10,
    initials: "LN",
    title: "Online Courses Promo",
    brandName: "Lenskart Education",
    status: "Active",
    tags: ["Education", "Tech"],
    budget: "₹12,000 - ₹18,000",
    deadline: "Apr 8, 2026",
    daysLeft: "13d",
    deliverables: "1 Reel + 2 Stories",
    location: "Delhi",
    platforms: ["instagram"],
  },

  // ── Applied ──
  {
    id: 11,
    initials: "MB",
    title: "Music Fest Promo",
    brandName: "MusicWave Events",
    status: "Applied",
    tags: ["Music", "Events"],
    budget: "₹30,000 - ₹40,000",
    deadline: "May 15, 2026",
    daysLeft: "50d",
    deliverables: "4 Reels + 2 Videos",
    location: "Pune",
    platforms: ["instagram", "youtube"],
  },
  {
    id: 12,
    initials: "AD",
    title: "Sneaker Drop",
    brandName: "Adidas India",
    status: "Applied",
    tags: ["Fashion", "Fitness"],
    budget: "₹45,000 - ₹60,000",
    deadline: "May 5, 2026",
    daysLeft: "40d",
    deliverables: "2 Reels + 1 YT Short",
    location: "Mumbai",
    platforms: ["instagram", "youtube"],
  },
  {
    id: 13,
    initials: "SW",
    title: "Smartwatch Review",
    brandName: "Noise",
    status: "Applied",
    tags: ["Technology", "Fitness"],
    budget: "₹20,000 - ₹28,000",
    deadline: "Apr 28, 2026",
    daysLeft: "33d",
    deliverables: "1 Unboxing + 1 Reel",
    location: "Pan India",
    platforms: ["youtube", "instagram"],
  },
  {
    id: 14,
    initials: "PC",
    title: "Pizza Party Campaign",
    brandName: "Dominos India",
    status: "Applied",
    tags: ["Food", "Lifestyle"],
    budget: "₹15,000 - ₹22,000",
    deadline: "Apr 30, 2026",
    daysLeft: "35d",
    deliverables: "2 Reels + 3 Stories",
    location: "Delhi",
    platforms: ["instagram", "tiktok"],
  },
  {
    id: 15,
    initials: "TR",
    title: "Goa Getaway Series",
    brandName: "MakeMyTrip",
    status: "Applied",
    tags: ["Travel", "Lifestyle"],
    budget: "₹70,000 - ₹1,00,000",
    deadline: "May 20, 2026",
    daysLeft: "55d",
    deliverables: "5 Vlogs + 8 Stories",
    location: "Goa",
    platforms: ["youtube", "instagram"],
  },
  {
    id: 16,
    initials: "GM",
    title: "Mobile Gaming Tourney",
    brandName: "BGMI Official",
    status: "Applied",
    tags: ["Gaming", "Technology"],
    budget: "₹35,000 - ₹50,000",
    deadline: "May 8, 2026",
    daysLeft: "43d",
    deliverables: "3 Streams + 2 Shorts",
    location: "Pan India",
    platforms: ["youtube"],
  },
  {
    id: 17,
    initials: "HL",
    title: "Hair Care Essentials",
    brandName: "Himalaya Wellness",
    status: "Applied",
    tags: ["Beauty", "Wellness"],
    budget: "₹12,000 - ₹18,000",
    deadline: "Apr 25, 2026",
    daysLeft: "30d",
    deliverables: "1 Reel + 2 Stories",
    location: "Chennai",
    platforms: ["instagram"],
  },
  {
    id: 18,
    initials: "ED",
    title: "Coding Bootcamp Ads",
    brandName: "Scaler Academy",
    status: "Applied",
    tags: ["Education", "Tech"],
    budget: "₹25,000 - ₹35,000",
    deadline: "May 12, 2026",
    daysLeft: "47d",
    deliverables: "2 Videos + 1 Testimonial",
    location: "Bangalore",
    platforms: ["youtube"],
  },
  {
    id: 19,
    initials: "CF",
    title: "Coffee Subscription",
    brandName: "Blue Tokai",
    status: "Applied",
    tags: ["Food", "Lifestyle"],
    budget: "₹10,000 - ₹15,000",
    deadline: "Apr 20, 2026",
    daysLeft: "25d",
    deliverables: "1 Reel + 2 Stories",
    location: "Mumbai",
    platforms: ["instagram"],
  },
  {
    id: 20,
    initials: "FT",
    title: "Yoga Mat Promo",
    brandName: "Decathlon India",
    status: "Applied",
    tags: ["Fitness", "Lifestyle"],
    budget: "₹18,000 - ₹24,000",
    deadline: "May 3, 2026",
    daysLeft: "38d",
    deliverables: "2 Reels + 1 Story",
    location: "Hyderabad",
    platforms: ["instagram", "tiktok"],
  },

  // ── Completed ──
  {
    id: 21,
    initials: "GB",
    title: "Eco-Friendly Living",
    brandName: "GreenEarth Co.",
    status: "Completed",
    tags: ["Sustainability", "Lifestyle"],
    budget: "₹20,000 - ₹25,000",
    deadline: "Jan 15, 2026",
    deliverables: "2 Videos + 1 Reel",
    location: "Chennai",
    platforms: ["youtube"],
  },
  {
    id: 22,
    initials: "AM",
    title: "Great Indian Sale",
    brandName: "Amazon India",
    status: "Completed",
    tags: ["Deals", "Technology"],
    budget: "₹55,000 - ₹70,000",
    deadline: "Dec 20, 2025",
    deliverables: "3 Reels + 1 Video",
    location: "Pan India",
    platforms: ["instagram", "youtube"],
  },
  {
    id: 23,
    initials: "PP",
    title: "Diwali Skincare",
    brandName: "Plum Goodness",
    status: "Completed",
    tags: ["Beauty", "Festival"],
    budget: "₹15,000 - ₹20,000",
    deadline: "Nov 10, 2025",
    deliverables: "2 Reels + 4 Stories",
    location: "Mumbai",
    platforms: ["instagram"],
  },
  {
    id: 24,
    initials: "SW",
    title: "Winter Fashion",
    brandName: "Bewakoof",
    status: "Completed",
    tags: ["Fashion", "Lifestyle"],
    budget: "₹18,000 - ₹25,000",
    deadline: "Dec 5, 2025",
    deliverables: "2 Reels + 1 Haul Video",
    location: "Delhi",
    platforms: ["instagram", "youtube"],
  },
  {
    id: 25,
    initials: "RK",
    title: "Recipe Challenge",
    brandName: "Swiggy",
    status: "Completed",
    tags: ["Food", "Entertainment"],
    budget: "₹22,000 - ₹30,000",
    deadline: "Jan 8, 2026",
    deliverables: "3 Reels + 2 Stories",
    location: "Bangalore",
    platforms: ["instagram", "tiktok"],
  },
  {
    id: 26,
    initials: "OP",
    title: "Phone Launch Event",
    brandName: "OnePlus India",
    status: "Completed",
    tags: ["Technology", "Events"],
    budget: "₹80,000 - ₹1,20,000",
    deadline: "Feb 1, 2026",
    deliverables: "1 Launch Video + 3 Shorts",
    location: "Hyderabad",
    platforms: ["youtube"],
  },
  {
    id: 27,
    initials: "MY",
    title: "Meditation App Promo",
    brandName: "Mindful You",
    status: "Completed",
    tags: ["Wellness", "Lifestyle"],
    budget: "₹10,000 - ₹15,000",
    deadline: "Dec 28, 2025",
    deliverables: "1 Reel + 2 Stories",
    location: "Pan India",
    platforms: ["instagram"],
  },
  {
    id: 28,
    initials: "CC",
    title: "New Year Collection",
    brandName: "Chumbak",
    status: "Completed",
    tags: ["Fashion", "Home Decor"],
    budget: "₹20,000 - ₹28,000",
    deadline: "Jan 2, 2026",
    deliverables: "2 Reels + 1 Unboxing",
    location: "Bangalore",
    platforms: ["instagram", "youtube"],
  },
  {
    id: 29,
    initials: "UD",
    title: "Online Learning Push",
    brandName: "Unacademy",
    status: "Completed",
    tags: ["Education", "Tech"],
    budget: "₹30,000 - ₹40,000",
    deadline: "Feb 15, 2026",
    deliverables: "2 Videos + 1 Testimonial",
    location: "Delhi",
    platforms: ["youtube"],
  },
  {
    id: 30,
    initials: "RP",
    title: "Resort Weekend Stay",
    brandName: "Radisson Hotels",
    status: "Completed",
    tags: ["Travel", "Luxury"],
    budget: "₹90,000 - ₹1,50,000",
    deadline: "Mar 1, 2026",
    deliverables: "2 Vlogs + 6 Stories",
    location: "Udaipur",
    platforms: ["youtube", "instagram"],
  },
];
