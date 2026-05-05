"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TrustSection } from "@/components/brands/TrustSection";
import { InfluencerCard } from "@/components/brands/InfluencerCard";
import { FilterDrawer, filterData, sortOptions } from "@/components/brands/FilterDrawer";
import { createClient } from "@/utils/supabase/client";

// Map "Follower Count" bucket labels to [min, max] ranges
const followerRanges = {
  "0 - 10k": [0, 10_000],
  "10k - 50k": [10_000, 50_000],
  "50k - 100k": [50_000, 100_000],
  "100k - 500k": [100_000, 500_000],
  "500k - 1M": [500_000, 1_000_000],
  "1M+": [1_000_000, Infinity],
};

// Map "Creator Type" labels to [min, max] ranges
const creatorTypeRanges = {
  Nano: [0, 10_000],
  Micro: [10_000, 100_000],
  Macro: [100_000, 1_000_000],
  Mega: [1_000_000, Infinity],
};

const emptyFilters = Object.fromEntries(Object.keys(filterData).map((k) => [k, []]));

const SortPopover = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
            value
              ? "border-[#5851DB] bg-purple-50/30 text-[#5851DB]"
              : "border-gray-200 text-gray-700"
          }`}
        >
          {value || "Sort by"}
          <ChevronDown size={12} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 p-2 rounded-xl shadow-xl border border-gray-100"
      >
        {sortOptions.map((option) => (
          <button
            key={option}
            onClick={() => {
              onChange(value === option ? null : option);
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2.5 text-[11px] font-medium rounded-lg transition-colors ${
              value === option
                ? "bg-[#EBE9FE] text-[#5851DB]"
                : "text-gray-700 hover:bg-blue-50/50"
            }`}
          >
            {option}
          </button>
        ))}
        {value && (
          <button
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 text-[11px] font-medium text-red-500 hover:bg-red-50 rounded-lg"
          >
            Clear sort
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

const InfluencerDirectory = () => {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [sort, setSort] = useState(null);
  const [filters, setFilters] = useState(() =>
    initialCategory && filterData.Categories.includes(initialCategory)
      ? { ...emptyFilters, Categories: [initialCategory] }
      : emptyFilters
  );

  useEffect(() => {
    if (initialCategory && filterData.Categories.includes(initialCategory)) {
      setFilters((prev) =>
        prev.Categories?.includes(initialCategory)
          ? prev
          : { ...prev, Categories: [initialCategory] }
      );
    }
  }, [initialCategory]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Use edge function (service role) so RLS doesn't hide influencers from brand users.
      const { data, error } = await supabase.functions.invoke("list-influencers", {
        body: {},
      });

      if (!cancelled) {
        if (error || data?.error) {
          console.error("Failed to load influencers:", error || data?.error);
          setInfluencers([]);
        } else {
          setInfluencers(data?.influencers || []);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const filteredInfluencers = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    let list = influencers.filter((inf) => {
      // Search by name / username / instagram handle
      if (q) {
        const haystack = `${inf.full_name || ""} ${inf.username || ""} ${inf.instagram_handle || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Categories filter — match if influencer has ANY of the selected categories
      const selectedCats = filters.Categories || [];
      if (selectedCats.length) {
        const infCats = Array.isArray(inf.categories) ? inf.categories : [];
        if (!selectedCats.some((c) => infCats.includes(c))) return false;
      }

      // Follower Count filter — match if followers fall in ANY selected bucket
      const followerBuckets = filters["Follower Count"] || [];
      if (followerBuckets.length) {
        const fc = inf.followers_count || 0;
        const matches = followerBuckets.some((b) => {
          const [min, max] = followerRanges[b] || [0, Infinity];
          return fc >= min && fc < max;
        });
        if (!matches) return false;
      }

      // Creator Type filter — derived from followers_count
      const creatorTypes = filters["Creator Type"] || [];
      if (creatorTypes.length) {
        const fc = inf.followers_count || 0;
        const matches = creatorTypes.some((t) => {
          const [min, max] = creatorTypeRanges[t] || [0, Infinity];
          return fc >= min && fc < max;
        });
        if (!matches) return false;
      }

      // Location filter — match against `city` column if present
      const locations = filters.Location || [];
      if (locations.length) {
        if (!inf.city || !locations.includes(inf.city)) return false;
      }

      return true;
    });

    // Sort
    if (sort === "Followers (High to Low)") {
      list = [...list].sort((a, b) => (b.followers_count || 0) - (a.followers_count || 0));
    } else if (sort === "Followers (Low to High)") {
      list = [...list].sort((a, b) => (a.followers_count || 0) - (b.followers_count || 0));
    } else if (sort === "Alphabetical") {
      list = [...list].sort((a, b) =>
        (a.full_name || a.username || "").localeCompare(b.full_name || b.username || "")
      );
    }

    return list;
  }, [influencers, searchText, filters, sort]);

  const FilterBar = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <FilterDrawer
        filters={filters}
        onApply={setFilters}
        onClear={() => setFilters(emptyFilters)}
      />
      <SortPopover value={sort} onChange={setSort} />
    </div>
  );

  return (
    <div className="bg-white min-h-screen pb-20 lg:pb-8">
      {/* ── MOBILE Header ── */}
      <section className="lg:hidden w-full bg-linear-to-b from-[#4C75BE] to-[#4A3996] px-6 pt-12 pb-10 rounded-b-[40px] text-white">
        <div className="relative flex items-center bg-white rounded-2xl p-4 shadow-xl">
          <Search className="text-gray-300 absolute left-4" size={20} />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder='Enter Creator by "Username"'
            className="w-full pl-8 text-sm text-gray-800 outline-hidden placeholder:text-gray-300"
          />
        </div>
      </section>

      {/* ── DESKTOP Header ── */}
      <section className="hidden lg:block px-8 pt-8 pb-4">
        <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <Search className="text-gray-400 absolute left-4" size={18} />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder='Enter Creator by "Username"'
            className="w-full pl-8 text-sm text-gray-700 outline-none placeholder:text-gray-400 bg-transparent"
          />
        </div>
      </section>

      {/* ── DESKTOP: Trust + Filter Bar ── */}
      <div className="hidden w-full lg:flex justify-between items-center gap-4 px-8 py-3">
        <div className="flex-1 max-w-[50%]">
          <TrustSection />
        </div>
        <div className="col-span-2">
          <FilterBar />
        </div>
      </div>

      {/* ── MOBILE: Trust Section ── */}
      <div className="lg:hidden pt-4 px-4">
        <TrustSection />
      </div>

      {/* ── MOBILE: Filter Bar ── */}
      <div className="lg:hidden flex items-center gap-2 px-6 mb-4 mt-4">
        <FilterBar />
      </div>

      {/* ── Influencer Grid ── */}
      <div className="flex-1 overflow-y-auto max-h-[80vh] lg:px-8 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#5851DB]" />
          </div>
        ) : filteredInfluencers.length === 0 ? (
          <div className="text-center py-20 px-6">
            <p className="text-sm font-semibold text-gray-700">No influencers found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {filteredInfluencers.map((inf) => (
              <InfluencerCard key={inf.influencer_id} {...inf} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InfluencerDirectory;
