"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  DollarSign,
  Users,
  MapPin,
  Check,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

// "₹5K-15K" / "₹3,500" / "₹2.5L" → numeric bounds. We use the parsed pair
// to test overlap with the user-typed [budgetMin, budgetMax] window.
const parseBudgetRange = (raw) => {
  if (!raw) return { min: 0, max: 0 };
  const parts = String(raw).replace(/₹/g, "").split(/[-–—]/);
  const toNum = (s) => {
    if (!s) return 0;
    const cleaned = String(s).trim().toLowerCase().replace(/,/g, "").replace(/\+/g, "");
    const num = parseFloat(cleaned);
    if (!Number.isFinite(num)) return 0;
    if (cleaned.endsWith("l")) return Math.round(num * 100_000);
    if (cleaned.endsWith("m")) return Math.round(num * 1_000_000);
    if (cleaned.endsWith("k")) return Math.round(num * 1_000);
    return Math.round(num);
  };
  const min = toNum(parts[0]);
  const max = parts.length > 1 ? toNum(parts[1]) : min;
  return { min, max: max || min };
};

const DUMMY_OFFERS_UNUSED = [
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
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSort, setSelectedSort] = useState("Recommended");

  // Filters start empty so the page opens with every active campaign
  // visible. Each filter narrows the visible list as the user picks values.
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [selectedContentTypes, setSelectedContentTypes] = useState([]);

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live campaign list — same edge function the rest of the influencer side
  // already uses. The cached response is warm if the user came from the
  // dashboard or campaigns tab.
  useEffect(() => {
    let cancelled = false;
    (async () => {
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
          body: JSON.stringify({ influencerId: user?.id || null }),
        });
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.campaigns)) {
          // Only show campaigns the user can actually apply to — drop
          // already-applied / closed rows.
          setCampaigns(
            data.campaigns.filter(
              (c) =>
                c.status === "Active" &&
                !c.applicationStatus &&
                !c.isExpired
            )
          );
        }
      } catch (e) {
        console.error("Failed to fetch campaigns:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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

  // Filter + sort pipeline. Re-runs whenever any filter input changes.
  const visibleCampaigns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const budgetLow = budgetMin ? Number(String(budgetMin).replace(/[^\d]/g, "")) : 0;
    const budgetHigh = budgetMax ? Number(String(budgetMax).replace(/[^\d]/g, "")) : Infinity;
    const platformsLc = selectedPlatforms.map((p) => p.toLowerCase());
    const contentTypesLc = selectedContentTypes.map((t) => t.toLowerCase());

    const filtered = campaigns.filter((c) => {
      // Search across title + brand
      if (q) {
        const haystack = `${c.title || ""} ${c.brandName || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // Categories — tags array on campaign vs selected list
      if (selectedCategories.length > 0) {
        const tags = Array.isArray(c.tags) ? c.tags : [];
        const hit = selectedCategories.some((sel) =>
          tags.some((t) => t.toLowerCase().includes(sel.toLowerCase()) || sel.toLowerCase().includes(t.toLowerCase()))
        );
        if (!hit) return false;
      }
      // Platforms — c.platforms is lowercase
      if (platformsLc.length > 0) {
        const cp = Array.isArray(c.platforms) ? c.platforms : [];
        if (!cp.some((p) => platformsLc.includes(p))) return false;
      }
      // Budget — overlap between campaign range and user range
      if (budgetLow > 0 || budgetHigh !== Infinity) {
        const { min: cMin, max: cMax } = parseBudgetRange(c.budget);
        const effMax = cMax || cMin;
        if (effMax < budgetLow) return false;
        if (cMin > budgetHigh) return false;
      }
      // Content types — c.contentTypesRequired is ["reels:2", ...]
      if (contentTypesLc.length > 0) {
        const required = (Array.isArray(c.contentTypesRequired) ? c.contentTypesRequired : []).map((t) =>
          String(t).split(":")[0].toLowerCase()
        );
        const hit = contentTypesLc.some((t) =>
          required.some((r) => r === t || r.startsWith(t) || t.startsWith(r))
        );
        if (!hit) return false;
      }
      return true;
    });

    // Sort
    if (selectedSort === "Highest Collaboration Cost" || selectedSort === "Lowest Collaboration Cost") {
      const asc = selectedSort === "Lowest Collaboration Cost";
      filtered.sort((a, b) => {
        const av = parseBudgetRange(a.budget).max || 0;
        const bv = parseBudgetRange(b.budget).max || 0;
        return asc ? av - bv : bv - av;
      });
    } else if (selectedSort === "Highest Followers") {
      filtered.sort((a, b) => (b.targetFollowerMax || 0) - (a.targetFollowerMax || 0));
    } else if (selectedSort === "New Creators") {
      filtered.sort((a, b) => (new Date(b.startDate || 0).getTime()) - (new Date(a.startDate || 0).getTime()));
    }
    return filtered;
  }, [campaigns, searchQuery, selectedCategories, selectedPlatforms, budgetMin, budgetMax, selectedContentTypes, selectedSort]);

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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-pink-500" />
          </div>
        ) : visibleCampaigns.length === 0 ? (
          <div className="text-center py-20 px-6">
            <p className="text-sm font-bold text-slate-700">No campaigns match your filters</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing some filters or widening the budget range.</p>
            <button
              onClick={resetFilters}
              className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-sm font-bold shadow-md cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {visibleCampaigns.map((c, index) => {
              const cover = c.bannerImage || c.brandLogo;
              const category = (Array.isArray(c.tags) ? c.tags[0] : "") || "Campaign";
              const location = c.location || "Pan India";
              const deliverables = c.deliverables || "Custom deliverables";
              const targetFollowers = c.targetFollowerMin
                ? `${(c.targetFollowerMin / 1000).toFixed(0)}K+ Followers`
                : "Open to all tiers";
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 8) * 0.05 }}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative h-48 w-full p-3">
                    <div className="relative h-full w-full rounded-2xl overflow-hidden bg-slate-100">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt={c.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-5xl font-black">
                          {(c.brandName || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Top badges */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-sm text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide text-slate-700">
                          {category}
                        </span>
                      </div>
                      {c.daysLeft > 0 && c.daysLeft <= 5 && (
                        <div className="absolute top-3 right-3">
                          <span className="bg-slate-900/70 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-amber-300 rounded-full" />
                            {c.daysLeft}d left
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-4 pb-4">
                    {/* Brand info */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-4 h-4 rounded-full bg-pink-100 flex items-center justify-center text-[8px] font-bold text-pink-600">
                        {(c.brandName || "?")[0]}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 truncate">
                        {c.brandName}
                      </span>
                      <span className="text-slate-300">·</span>
                      <div className="flex items-center gap-0.5 text-slate-400">
                        <MapPin size={10} />
                        <span className="text-[10px] font-semibold truncate">{location}</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">
                      {c.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">{deliverables}</p>

                    {/* Pay + Followers row */}
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <DollarSign size={12} className="text-green-500" />
                        <span className="font-semibold">{c.budget || "On request"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Users size={12} className="text-blue-500" />
                        <span className="font-semibold">{targetFollowers}</span>
                      </div>
                    </div>

                    {/* Apply button */}
                    <button
                      onClick={() => router.push(`/influencer/offers/${c.id}`)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-sm font-bold shadow-md shadow-pink-100 active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
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
