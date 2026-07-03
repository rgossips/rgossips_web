"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProfileCompletionSection } from "@/components/brands/ProfileCompletionSection";
import { InfluencerCard } from "@/components/brands/InfluencerCard";
import { FilterDrawer, filterData, sortOptions } from "@/components/brands/FilterDrawer";
import { createClient } from "@/utils/supabase/client";

const emptyFilters = Object.fromEntries(Object.keys(filterData).map((k) => [k, []]));

const PAGE_SIZE = 50;

// The sort strings in the UI don't match what the server accepts, and
// mapping this at call time keeps the FilterDrawer options list as the
// user-facing source of truth.
const SORT_WIRE = {
  "Followers (High to Low)": "followers_desc",
  "Followers (Low to High)": "followers_asc",
  "Alphabetical": "alpha",
};

// Convert the FilterDrawer's per-group chip arrays into the shape
// list-influencers expects on the wire.
function filtersToWire(filters) {
  return {
    categories: filters.Categories || [],
    // Server treats followerBuckets as a union of both the "Follower
    // Count" and "Creator Type" chip lists — same range table.
    followerBuckets: [
      ...(filters["Follower Count"] || []),
      ...(filters["Creator Type"] || []),
    ],
    locations: filters.Location || [],
    genders: filters.Gender || [],
    profileTypes: (filters["Profile Type"] || []).map((p) =>
      p === "Meme page" ? "meme_page" : p === "Celebrity" ? "celebrity" : p,
    ),
    languages: filters["Content Language"] || [],
  };
}

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
  const initialQuery = searchParams.get("q") || "";
  const initialCity = searchParams.get("city");
  // ?profileType=meme_page | celebrity — routed here from the
  // CategorySection Meme Pages / Celebrities cards on /brands. We
  // translate the wire value into the chip label the FilterDrawer
  // renders ("Meme page" / "Celebrity") so the pre-selection lights up
  // in the drawer too.
  const initialProfileTypeRaw = searchParams.get("profileType");
  const initialProfileType =
    initialProfileTypeRaw === "meme_page"
      ? "Meme page"
      : initialProfileTypeRaw === "celebrity"
        ? "Celebrity"
        : null;
  const [influencers, setInfluencers] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState(initialQuery);
  // Debounced version — only this actually drives fetches, so typing a
  // 12-char query doesn't fire 12 round-trips.
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);
  const [sort, setSort] = useState(null);
  // Bumped every time filters/search/sort change, so a stale in-flight
  // request from a prior filter combination can't overwrite the current
  // results when it finally lands.
  const reqRef = useRef(0);
  const [filters, setFilters] = useState(() => {
    let initial = { ...emptyFilters };
    if (initialCategory && filterData.Categories.includes(initialCategory)) {
      initial.Categories = [initialCategory];
    }
    if (initialCity && filterData.Location?.includes(initialCity)) {
      initial.Location = [initialCity];
    }
    if (initialProfileType && filterData["Profile Type"]?.includes(initialProfileType)) {
      initial["Profile Type"] = [initialProfileType];
    }
    return initial;
  });

  // Re-sync filters when query params change after mount (e.g. user clicks a
  // city tile on /brands while already on /brands/search).
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
    if (initialCity && filterData.Location?.includes(initialCity)) {
      setFilters((prev) =>
        prev.Location?.includes(initialCity)
          ? prev
          : { ...prev, Location: [initialCity] }
      );
    }
  }, [initialCity]);

  useEffect(() => {
    if (initialProfileType && filterData["Profile Type"]?.includes(initialProfileType)) {
      setFilters((prev) =>
        prev["Profile Type"]?.includes(initialProfileType)
          ? prev
          : { ...prev, "Profile Type": [initialProfileType] }
      );
    }
  }, [initialProfileType]);

  useEffect(() => {
    setSearchText(initialQuery);
  }, [initialQuery]);

  // Debounce searchText → debouncedSearch. 300ms feels responsive without
  // flooding the edge function on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  // Any change to the filter combination resets pagination to the first
  // page. loadPage(0, replace=true) runs immediately after via the
  // effect below.
  useEffect(() => {
    setOffset(0);
  }, [debouncedSearch, filters, sort]);

  // Fetch a page. On the initial load / any filter change we replace
  // the list; on Load More we append.
  const loadPage = async (nextOffset, { replace }) => {
    const ticket = ++reqRef.current;
    if (replace) setLoading(true);
    else setLoadingMore(true);
    try {
      const { data, error } = await supabase.functions.invoke("list-influencers", {
        body: {
          limit: PAGE_SIZE,
          offset: nextOffset,
          q: debouncedSearch.trim(),
          filters: filtersToWire(filters),
          sort: SORT_WIRE[sort] || "followers_desc",
        },
      });
      // A newer request has already fired — drop this response.
      if (ticket !== reqRef.current) return;
      if (error || data?.error) {
        console.error("Failed to load influencers:", error || data?.error);
        if (replace) setInfluencers([]);
        return;
      }
      const page = data?.influencers || [];
      setTotal(Number(data?.total || 0));
      setInfluencers((prev) => (replace ? page : [...prev, ...page]));
    } finally {
      if (ticket === reqRef.current) {
        if (replace) setLoading(false);
        else setLoadingMore(false);
      }
    }
  };

  // Kick off the first-page fetch after debouncedSearch / filters / sort
  // settle. Also runs on mount.
  useEffect(() => {
    loadPage(0, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters, sort]);

  const handleLoadMore = () => {
    if (loadingMore) return;
    const next = influencers.length;
    setOffset(next);
    loadPage(next, { replace: false });
  };

  // Drawer count for "Apply Filters (N)" — cheap server dry-run using
  // limit:0 so we get { total } without pulling any rows.
  const countForDraft = async (draft) => {
    try {
      const { data } = await supabase.functions.invoke("list-influencers", {
        body: {
          limit: 1,
          offset: 0,
          q: debouncedSearch.trim(),
          filters: filtersToWire(draft),
          sort: SORT_WIRE[sort] || "followers_desc",
        },
      });
      return Number(data?.total || 0);
    } catch {
      return 0;
    }
  };

  const filteredInfluencers = influencers;
  const hasMore = filteredInfluencers.length < total;

  const FilterBar = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <FilterDrawer
        filters={filters}
        onApply={setFilters}
        onClear={() => setFilters(emptyFilters)}
        countForDraft={countForDraft}
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

      {/* ── DESKTOP: Profile Completion + Filter Bar ── */}
      <div className="hidden w-full lg:flex justify-between items-center gap-4 px-8 py-3">
        <div className="flex-1 max-w-[50%]">
          <ProfileCompletionSection />
        </div>
        <div className="col-span-2">
          <FilterBar />
        </div>
      </div>

      {/* ── MOBILE: Profile Completion ── */}
      <div className="lg:hidden pt-4 px-4">
        <ProfileCompletionSection />
      </div>

      {/* ── MOBILE: Filter Bar ── */}
      <div className="lg:hidden flex items-center gap-2 px-6 mb-4 mt-4">
        <FilterBar />
      </div>

      {/* ── Influencer Grid ── */}
      <div className="flex-1 lg:px-8 pb-4">
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
          <>
            {/* Result count strip — tells the brand there's more behind
                the Load More button so paginating doesn't feel like the
                list is complete when it isn't. */}
            <p className="text-[11px] font-semibold text-slate-400 px-6 lg:px-0 pb-3">
              Showing {filteredInfluencers.length} of {total} creator{total === 1 ? "" : "s"}
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {filteredInfluencers.map((inf) => (
                <InfluencerCard key={inf.influencer_id} {...inf} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center py-6">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#5851DB] text-[#5851DB] bg-white hover:bg-purple-50 disabled:opacity-60 text-[12px] font-bold cursor-pointer"
                >
                  {loadingMore && <Loader2 size={14} className="animate-spin" />}
                  {loadingMore ? "Loading..." : `Load more (${total - filteredInfluencers.length} left)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InfluencerDirectory;
