"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  ChevronDown,
  Loader2,
  UserPlus,
  X,
  Send,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProfileCompletionSection } from "@/components/brands/ProfileCompletionSection";
import { InfluencerCard } from "@/components/brands/InfluencerCard";
import { FilterDrawer, filterData, sortOptions } from "@/components/brands/FilterDrawer";
import CampaignPickerModal from "@/components/brands/CampaignPickerModal";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";

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
  const t = useTranslations("BrandsSearch");
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
          {value || t("sortBy")}
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
            {t("clearSort")}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

// Map a raw follower count to the closest FilterDrawer bucket labels
// that fully cover the range. Used when a campaign's target
// follower_min/max lands us on /brands/search — we translate to chip
// labels so the drawer's pre-selection lights up.
const FOLLOWER_BUCKETS = [
  { label: "0 - 10k", min: 0, max: 10_000 },
  { label: "10k - 50k", min: 10_000, max: 50_000 },
  { label: "50k - 100k", min: 50_000, max: 100_000 },
  { label: "100k - 500k", min: 100_000, max: 500_000 },
  { label: "500k - 1M", min: 500_000, max: 1_000_000 },
  { label: "1M+", min: 1_000_000, max: Infinity },
];
function bucketsForRange(followerMin, followerMax) {
  const lo = Number(followerMin) || 0;
  const hi = Number.isFinite(followerMax) ? Number(followerMax) : Infinity;
  return FOLLOWER_BUCKETS.filter((b) => b.max > lo && b.min < hi).map((b) => b.label);
}

const InfluencerDirectory = () => {
  const t = useTranslations("BrandsSearch");
  const supabase = createClient();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  // ?invite=<campaignId> — the campaign-detail "Invite creators" flow lands
  // here in select-mode pre-bound to that campaign (Flow B).
  const inviteCampaignId = searchParams.get("invite") || null;
  const initialCategory = searchParams.get("category");
  const initialQuery = searchParams.get("q") || "";
  const initialCity = searchParams.get("city");
  // Multi-value versions of the same params. Both single and multi
  // shapes are accepted; the campaign-match callout on brand campaign
  // detail routes here with the multi shape prefilled from the
  // campaign's target_categories / target_cities. Comma-separated
  // values are decoded via decodeURIComponent per element.
  const initialCategoriesRaw = searchParams.get("categories") || "";
  const initialCategoriesList = initialCategoriesRaw
    .split(",")
    .map((s) => decodeURIComponent(s).trim())
    .filter((s) => s && filterData.Categories.includes(s));
  const initialCitiesRaw = searchParams.get("cities") || "";
  const initialCitiesList = initialCitiesRaw
    .split(",")
    .map((s) => decodeURIComponent(s).trim())
    .filter((s) => s && filterData.Location?.includes(s));
  const initialFollowerMin = Number(searchParams.get("followerMin") || 0);
  const initialFollowerMax = Number(searchParams.get("followerMax") || 0);
  const initialFollowerBuckets =
    initialFollowerMin || initialFollowerMax
      ? bucketsForRange(initialFollowerMin, initialFollowerMax || Infinity)
      : [];
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
    // Multi-value wins over single-value when both are present.
    if (initialCategoriesList.length > 0) {
      initial.Categories = [...initialCategoriesList];
    } else if (initialCategory && filterData.Categories.includes(initialCategory)) {
      initial.Categories = [initialCategory];
    }
    if (initialCitiesList.length > 0) {
      initial.Location = [...initialCitiesList];
    } else if (initialCity && filterData.Location?.includes(initialCity)) {
      initial.Location = [initialCity];
    }
    if (initialFollowerBuckets.length > 0) {
      initial["Follower Count"] = [...initialFollowerBuckets];
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

  // ── Selection / invite ───────────────────────────────────────────
  // Auto-enter select mode when arriving via the campaign "Invite creators"
  // flow (?invite=<id>).
  const [selectMode, setSelectMode] = useState(!!inviteCampaignId);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState("");

  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const onInviteDone = (result) => {
    const invited = result?.invited || 0;
    const already = (result?.alreadyInvited || 0) + (result?.alreadyResponded || 0);
    const parts = [`Invited ${invited} creator${invited === 1 ? "" : "s"}`];
    if (already) parts.push(`${already} already invited/applied`);
    setToast(parts.join(" · "));
    setSelectedIds(new Set());
    setTimeout(() => setToast(""), 4000);
  };

  const FilterBar = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <FilterDrawer
        filters={filters}
        onApply={setFilters}
        onClear={() => setFilters(emptyFilters)}
        countForDraft={countForDraft}
      />
      <SortPopover value={sort} onChange={setSort} />
      <button
        onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
        className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
          selectMode ? "border-[#5851DB] bg-purple-50/40 text-[#5851DB]" : "border-gray-200 text-gray-700"
        }`}
      >
        <UserPlus size={13} />
        {selectMode ? "Done" : "Select creators"}
      </button>
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
            placeholder={t("searchPlaceholder")}
            className="w-full pl-8 text-sm text-gray-800 outline-hidden placeholder:text-gray-300"
          />
        </div>
      </section>

      {/* No desktop search bar here on purpose — BrandNavbar already has one,
          and it submits to /brands/search?q=… which this page reads into
          searchText. A second field on the same screen meant two inputs that
          looked independent but drove the same filter.

          The MOBILE search above stays: BrandNavbar is `hidden lg:flex`, so
          below lg there is no header search to fall back on. */}

      {/* ── DESKTOP: Profile Completion + Filter Bar ── */}
      {/* pt-8 replaces the top spacing the removed search section used to
          provide, so the page doesn't start flush against the navbar. */}
      <div className="hidden w-full lg:flex justify-between items-center gap-4 px-8 pt-8 pb-3">
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
            <p className="text-sm font-semibold text-gray-700">{t("emptyTitle")}</p>
            <p className="text-xs text-gray-400 mt-1">
              {t("emptySubtitle")}
            </p>
          </div>
        ) : (
          <>
            {/* Result count strip — tells the brand there's more behind
                the Load More button so paginating doesn't feel like the
                list is complete when it isn't. */}
            <p className="text-[11px] font-semibold text-slate-400 px-6 lg:px-0 pb-3">
              {t("resultCount", { shown: filteredInfluencers.length, total })}
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {filteredInfluencers.map((inf) => (
                <InfluencerCard
                  key={inf.influencer_id}
                  {...inf}
                  selectable={selectMode}
                  selected={selectedIds.has(inf.influencer_id)}
                  onToggleSelect={() => toggleSelect(inf.influencer_id)}
                />
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
                  {loadingMore ? t("loading") : t("loadMore", { count: total - filteredInfluencers.length })}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 lg:bottom-8 z-[95] px-4 py-2.5 rounded-full bg-gray-900 text-white text-[12px] font-semibold shadow-xl">
          {toast}
        </div>
      )}

      {/* Sticky invite bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed left-0 right-0 bottom-16 lg:bottom-0 z-[80] px-4 pb-3 lg:pb-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 bg-[#5851DB] text-white rounded-2xl shadow-2xl px-4 py-3">
            <button onClick={exitSelectMode} className="p-1 rounded-full hover:bg-white/15 cursor-pointer">
              <X size={16} />
            </button>
            <span className="text-[13px] font-bold flex-1">
              {selectedIds.size} creator{selectedIds.size === 1 ? "" : "s"} selected
            </span>
            <button
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1.5 bg-white text-[#5851DB] rounded-full px-4 py-2 text-[12px] font-extrabold cursor-pointer"
            >
              <Send size={13} />
              Invite to campaign
            </button>
          </div>
        </div>
      )}

      <CampaignPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        brandId={user?.id}
        influencerIds={[...selectedIds]}
        campaignId={inviteCampaignId}
        onDone={onInviteDone}
      />
    </div>
  );
};

export default InfluencerDirectory;
