"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  DollarSign,
  Users,
  MapPin,
  Check,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const DUMMY_OFFERS = [
  {
    id: "camp-001",
    imageUrl:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600",
    category: "Beauty",
    badge: "Trending",
    match: "98% Match",
    brand: "Glow Essential",
    title: "Summer Radiance Campaign",
    location: "New York",
    desc: "Showcase our new summer glow collection in your daily skincare routine.",
    pay: "₹30k - 45k",
    followers: "20k+ Followers",
  },
  {
    id: "camp-002",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600",
    category: "Travel",
    badge: "High Paying",
    match: "95% Match",
    brand: "Blue Horizon",
    title: "Luxury Bali Retreat",
    location: "Bali",
    desc: "Exclusive 3-night stay at our newest eco-luxury resort in Uluwatu.",
    pay: "₹80k + Flights",
    followers: "Travel Niche",
  },
  {
    id: "camp-003",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600",
    category: "Tech",
    badge: "New",
    match: "92% Match",
    brand: "Sonic Audio",
    title: "Pro Headset Review",
    location: "Remote",
    desc: "Test and review our flagship noise-cancelling wireless headphones.",
    pay: "₹15k + Product",
    followers: "Tech Reviewers",
  },
  {
    id: "camp-004",
    imageUrl:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600",
    category: "Fashion",
    badge: "Featured",
    match: "90% Match",
    brand: "Vogue Studio",
    title: "Spring Collection Lookbook",
    location: "Mumbai",
    desc: "Style and shoot our spring 2025 collection with your personal twist.",
    pay: "₹25k - 40k",
    followers: "15k+ Followers",
  },
];

const CATEGORIES = [
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
];
const PLATFORMS = ["Instagram", "YouTube", "TikTok", "Facebook"];
const BUDGET_RANGES = [
  "1k — 10K",
  "10K — 50K",
  "50K — 100K",
  "100K — 500K",
  "500K — 1M",
];
const CONTENT_TYPES = ["Posts", "Reels", "Shorts", "Stories", "Videos"];
const SORT_OPTIONS = [
  { label: "Recommended", sub: "" },
  { label: "Most Engagement", sub: "" },
  { label: "Highest Followers", sub: "" },
  { label: "Lowest Collaboration Cost", sub: "Cheapest to work with" },
  { label: "Highest Collaboration Cost", sub: "Biggest deal first" },
  { label: "New Creators", sub: "" },
  { label: "Nearby Creators", sub: "" },
];

export default function RecommendedCampaigns() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSort, setSelectedSort] = useState("Recommended");

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState(["Fashion"]);
  const [selectedPlatforms, setSelectedPlatforms] = useState(["Instagram"]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [selectedContentTypes, setSelectedContentTypes] = useState([]);

  const toggleItem = (setArr, item) => {
    setArr((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedPlatforms([]);
    setBudgetMin("");
    setBudgetMax("");
    setSelectedContentTypes([]);
  };

  return (
    <div className="min-h-screen bg-white pb-8 overflow-x-hidden">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-base font-bold text-slate-900">Recommended</h1>
          <div className="flex items-center gap-2">
            {/* Sort Drawer */}
            <SortDrawer
              selectedSort={selectedSort}
              setSelectedSort={setSelectedSort}
            />
            {/* Filter Drawer */}
            <FilterDrawer
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              selectedPlatforms={selectedPlatforms}
              setSelectedPlatforms={setSelectedPlatforms}
              budgetMin={budgetMin}
              setBudgetMin={setBudgetMin}
              budgetMax={budgetMax}
              setBudgetMax={setBudgetMax}
              selectedContentTypes={selectedContentTypes}
              setSelectedContentTypes={setSelectedContentTypes}
              toggleItem={toggleItem}
              resetFilters={resetFilters}
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search campaigns or brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm w-full outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <SortDrawer
            selectedSort={selectedSort}
            setSelectedSort={setSelectedSort}
            asPill
          />
          <FilterDrawer
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            selectedPlatforms={selectedPlatforms}
            setSelectedPlatforms={setSelectedPlatforms}
            budgetMin={budgetMin}
            setBudgetMin={setBudgetMin}
            budgetMax={budgetMax}
            setBudgetMax={setBudgetMax}
            selectedContentTypes={selectedContentTypes}
            setSelectedContentTypes={setSelectedContentTypes}
            toggleItem={toggleItem}
            resetFilters={resetFilters}
            asPill
          />
          <BudgetDrawer
            budgetMin={budgetMin}
            setBudgetMin={setBudgetMin}
            budgetMax={budgetMax}
            setBudgetMax={setBudgetMax}
          />
          <PlatformDrawer
            selectedPlatforms={selectedPlatforms}
            toggleItem={toggleItem}
            setSelectedPlatforms={setSelectedPlatforms}
          />
        </div>
      </div>

      {/* CAMPAIGN CARDS */}
      <div className="px-4 pt-4 space-y-5">
        <AnimatePresence>
          {DUMMY_OFFERS.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-48 w-full p-3">
                <div className="relative h-full w-full rounded-2xl overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  {/* Top badges */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide text-slate-700">
                      {item.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="bg-slate-900/70 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      {item.badge}
                    </span>
                  </div>
                  {/* Match badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md">
                      {item.match}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 pb-4">
                {/* Brand info */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-4 h-4 rounded-full bg-pink-100 flex items-center justify-center text-[8px] font-bold text-pink-600">
                    {item.brand[0]}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {item.brand}
                  </span>
                  <span className="text-slate-300">·</span>
                  <div className="flex items-center gap-0.5 text-slate-400">
                    <MapPin size={10} />
                    <span className="text-[10px] font-semibold">
                      {item.location}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {item.title}
                </h3>

                {/* Pay + Followers row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <DollarSign size={12} className="text-green-500" />
                    <span className="font-semibold">{item.pay}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Users size={12} className="text-blue-500" />
                    <span className="font-semibold">{item.followers}</span>
                  </div>
                </div>

                {/* Apply button */}
                <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-sm font-bold shadow-md shadow-pink-100 active:scale-[0.98] transition-transform">
                  Apply
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── SORT DRAWER ─── */
function SortDrawer({ selectedSort, setSelectedSort, asPill = false }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        {asPill ? (
          <button className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600">
            <ArrowUpDown size={12} /> Sort
          </button>
        ) : (
          <button className="p-2 rounded-full bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white">
            <ArrowUpDown size={16} />
          </button>
        )}
      </DrawerTrigger>
      <DrawerContent className="rounded-t-3xl">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DrawerClose asChild>
              <button className="p-2 rounded-full hover:bg-slate-100">
                <ChevronLeft size={20} />
              </button>
            </DrawerClose>
            <DrawerTitle className="text-lg font-bold">
              Sort Influencers
            </DrawerTitle>
            <div className="w-9" />
          </div>
        </DrawerHeader>

        <div className="px-5 pb-2 space-y-1">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.label}
              onClick={() => setSelectedSort(option.label)}
              className="w-full flex items-center justify-between py-3.5 px-1 border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedSort === option.label
                      ? "border-pink-500 bg-pink-500"
                      : "border-slate-300"
                  }`}
                >
                  {selectedSort === option.label && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
                <div className="text-left">
                  <p
                    className={`text-sm font-semibold ${
                      selectedSort === option.label
                        ? "text-slate-900"
                        : "text-slate-600"
                    }`}
                  >
                    {option.label}
                  </p>
                  {option.sub && (
                    <p className="text-[11px] text-slate-400">{option.sub}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <DrawerFooter className="flex-row gap-3 pt-2">
          <DrawerClose asChild>
            <button className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600">
              Cancel
            </button>
          </DrawerClose>
          <DrawerClose asChild>
            <button className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-sm font-bold shadow-md">
              Apply
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/* ─── FILTER DRAWER ─── */
function FilterDrawer({
  selectedCategories,
  setSelectedCategories,
  selectedPlatforms,
  setSelectedPlatforms,
  budgetMin,
  setBudgetMin,
  budgetMax,
  setBudgetMax,
  selectedContentTypes,
  setSelectedContentTypes,
  toggleItem,
  resetFilters,
  asPill = false,
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        {asPill ? (
          <button className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600">
            <SlidersHorizontal size={12} /> Filter
          </button>
        ) : (
          <button className="p-2 rounded-full bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white">
            <SlidersHorizontal size={16} />
          </button>
        )}
      </DrawerTrigger>
      <DrawerContent className="rounded-t-3xl max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DrawerClose asChild>
              <button className="p-2 rounded-full hover:bg-slate-100">
                <ChevronLeft size={20} />
              </button>
            </DrawerClose>
            <DrawerTitle className="text-lg font-bold">Filters</DrawerTitle>
            <div className="w-9" />
          </div>
        </DrawerHeader>

        <div className="px-5 pb-4 space-y-6 overflow-y-auto">
          {/* Category */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleItem(setSelectedCategories, cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                    selectedCategories.includes(cat)
                      ? "bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white border-transparent"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Platform
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  onClick={() => toggleItem(setSelectedPlatforms, platform)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold border transition-colors ${
                    selectedPlatforms.includes(platform)
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {selectedPlatforms.includes(platform) && (
                    <Check size={14} className="text-emerald-600" />
                  )}
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Budget Range
            </p>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5">
                <span className="text-xs text-slate-400">₹</span>
                <input
                  type="text"
                  placeholder="Min"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="w-full text-sm font-semibold outline-none bg-transparent"
                />
              </div>
              <span className="text-slate-300 text-xs">—</span>
              <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5">
                <span className="text-xs text-slate-400">₹</span>
                <input
                  type="text"
                  placeholder="Max"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="w-full text-sm font-semibold outline-none bg-transparent"
                />
              </div>
              <button className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-xs font-bold">
                Go
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {BUDGET_RANGES.map((range) => (
                <button
                  key={range}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-500 hover:border-slate-300 transition-colors"
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Content Type */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Content Type
            </p>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleItem(setSelectedContentTypes, type)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                    selectedContentTypes.includes(type)
                      ? "bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white border-transparent"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DrawerFooter className="flex-row gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={resetFilters}
            className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600"
          >
            Reset
          </button>
          <DrawerClose asChild>
            <button className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-sm font-bold shadow-md">
              Apply Filters
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/* ─── BUDGET DRAWER ─── */
function BudgetDrawer({ budgetMin, setBudgetMin, budgetMax, setBudgetMax }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600">
          <DollarSign size={12} /> Budget
          {(budgetMin || budgetMax) && (
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
          )}
        </button>
      </DrawerTrigger>
      <DrawerContent className="rounded-t-3xl">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DrawerClose asChild>
              <button className="p-2 rounded-full hover:bg-slate-100">
                <ChevronLeft size={20} />
              </button>
            </DrawerClose>
            <DrawerTitle className="text-lg font-bold">
              Budget Range
            </DrawerTitle>
            <div className="w-9" />
          </div>
        </DrawerHeader>

        <div className="px-5 pb-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5">
              <span className="text-xs text-slate-400">₹</span>
              <input
                type="text"
                placeholder="Min"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className="w-full text-sm font-semibold outline-none bg-transparent"
              />
            </div>
            <span className="text-slate-300 text-xs">—</span>
            <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5">
              <span className="text-xs text-slate-400">₹</span>
              <input
                type="text"
                placeholder="Max"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="w-full text-sm font-semibold outline-none bg-transparent"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {BUDGET_RANGES.map((range) => (
              <button
                key={range}
                className="px-3 py-2 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-500 hover:border-slate-300 transition-colors"
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <DrawerFooter className="flex-row gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              setBudgetMin("");
              setBudgetMax("");
            }}
            className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600"
          >
            Reset
          </button>
          <DrawerClose asChild>
            <button className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-sm font-bold shadow-md">
              Apply
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/* ─── PLATFORM DRAWER ─── */
function PlatformDrawer({ selectedPlatforms, toggleItem, setSelectedPlatforms }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600">
          Platform
          {selectedPlatforms.length > 0 && (
            <span className="bg-pink-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {selectedPlatforms.length}
            </span>
          )}
        </button>
      </DrawerTrigger>
      <DrawerContent className="rounded-t-3xl">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DrawerClose asChild>
              <button className="p-2 rounded-full hover:bg-slate-100">
                <ChevronLeft size={20} />
              </button>
            </DrawerClose>
            <DrawerTitle className="text-lg font-bold">Platform</DrawerTitle>
            <div className="w-9" />
          </div>
        </DrawerHeader>

        <div className="px-5 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map((platform) => (
              <button
                key={platform}
                onClick={() => toggleItem(setSelectedPlatforms, platform)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold border transition-colors ${
                  selectedPlatforms.includes(platform)
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {selectedPlatforms.includes(platform) && (
                  <Check size={14} className="text-emerald-600" />
                )}
                {platform}
              </button>
            ))}
          </div>
        </div>

        <DrawerFooter className="flex-row gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={() => setSelectedPlatforms([])}
            className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600"
          >
            Reset
          </button>
          <DrawerClose asChild>
            <button className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-sm font-bold shadow-md">
              Apply
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
