"use client";
import React, { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  Activity,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import { CampaignCard } from "@/components/CampaignCard";
import FilterModal, { FilterSidebar } from "@/components/FilterModal";
import { useAuth } from "@/context/AuthContext";
import { calculateCampaignMatchScore } from "@/utils/matchScore";

export default function CampaignsPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("Active");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [budgetRange, setBudgetRange] = useState({ min: 0, max: 200000 });
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setBudgetRange({ min: 0, max: 200000 });
    setSelectedPlatforms([]);
    setIsVerifiedOnly(false);
  };

  const filteredCampaigns = useMemo(() => {
    return CAMPAIGNS_DATA.filter((campaign) => {
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
      return matchesTab && matchesSearch && matchesCategory && matchesPlatform;
    });
  }, [activeTab, searchQuery, selectedCategories, selectedPlatforms]);

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
              isVerifiedOnly={isVerifiedOnly}
              setIsVerifiedOnly={setIsVerifiedOnly}
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
                  val: CAMPAIGNS_DATA.filter((c) => c.status === "Active").length,
                  icon: <Activity className="text-[#00BA88]" />,
                  bg: "bg-emerald-50",
                },
                {
                  label: "Applied",
                  val: CAMPAIGNS_DATA.filter((c) => c.status === "Applied").length,
                  icon: <Clock className="text-blue-500" />,
                  bg: "bg-blue-50",
                },
                {
                  label: "Completed",
                  val: CAMPAIGNS_DATA.filter((c) => c.status === "Completed").length,
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
            isVerifiedOnly={isVerifiedOnly}
            setIsVerifiedOnly={setIsVerifiedOnly}
          />
        )}
      </AnimatePresence>
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
