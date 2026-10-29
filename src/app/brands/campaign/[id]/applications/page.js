"use client";

// Every applicant to one campaign, on one page.
//
// The campaign detail aside shows the top handful and nothing else, which is
// fine at five applications and useless at ninety: a brand had no way to say
// "show me the ones still waiting on me", "only Mumbai", or "only the ones
// who actually fit the follower band". This is that view — status tabs
// across the top, filters down the side, and best-fit first by default.
//
// Ordering is the same rankApplications() the aside uses, so the top of this
// list and the top of that one cannot disagree.
//
// Clicking a row opens /applications/[appId] — a page, not a dialog, so a
// review can be linked, shared and refreshed, and the back button does what
// it looks like it does.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  creatorFromApplication,
  matchTone,
  rankApplications,
  scoreApplicant,
  targetFromCampaign,
} from "@/lib/applicationMatch";
import { MATCH_TONE_CLASS, VERDICT_MARK, appStatusConfig, formatCount, formatDate } from "@/components/brands/applicationUi";

// Lifecycle order for the tab strip. Two statuses share a label on purpose
// — from the brand's side, releasing payment IS the end — so tabs are keyed
// by LABEL, not by status, and "Completed" covers both `payment` and
// `completed`. Keying by status would print the same word twice.
const TAB_ORDER = Object.keys(appStatusConfig);

const STATUSES_BY_LABEL = TAB_ORDER.reduce((acc, status) => {
  const key = appStatusConfig[status].labelKey;
  (acc[key] = acc[key] || []).push(status);
  return acc;
}, {});

// First appearance in appStatusConfig decides where a label sits in the strip.
const LABEL_ORDER = TAB_ORDER.map((s) => appStatusConfig[s].labelKey).filter(
  (k, i, arr) => arr.indexOf(k) === i,
);

const FOLLOWER_BUCKETS = [
  { key: "nano", min: 0, max: 10_000 },
  { key: "micro", min: 10_000, max: 100_000 },
  { key: "macro", min: 100_000, max: 1_000_000 },
  { key: "mega", min: 1_000_000, max: Infinity },
];

const MATCH_BANDS = [
  { key: "strong", min: 75, max: 101 },
  { key: "fair", min: 45, max: 75 },
  { key: "weak", min: 0, max: 45 },
];

const SORTS = ["match", "followers", "engagement", "newest", "rateAsc"];

const norm = (s) => String(s || "").trim().toLowerCase();

// Wider than the campaign detail page's max-w-6xl on purpose. This is a
// list: a brand reading ninety applicants wants rows, and 1152px on a
// 1700px canvas left a third of the screen empty while the row content all
// piled up on the left. Still capped, so it does not stretch to unreadable
// line lengths on an ultrawide.
const SHELL = "max-w-[1480px] mx-auto";

// The most advanced figure on the row, and what it actually means. Showing
// a creator's ask next to a funded escrow amount under one label would read
// as the same number twice; these are three different commitments.
const pickMoney = (app) => {
  const agreed = Number(app?.final_agreed_rate) || 0;
  if (agreed > 0) return { key: "agreed", value: agreed };
  const offered = Number(app?.brand_offered_rate) || 0;
  if (offered > 0) return { key: "offered", value: offered };
  const proposed = Number(app?.proposed_rate) || 0;
  if (proposed > 0) return { key: "quoted", value: proposed };
  return null;
};

const CampaignApplicationsPage = () => {
  const t = useTranslations("BrandsCampaignId");
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [campaign, setCampaign] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state. `tab` is a LABEL key (see STATUSES_BY_LABEL), "all" for
  // everything.
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [bands, setBands] = useState([]);
  const [buckets, setBuckets] = useState([]);
  const [cats, setCats] = useState([]);
  const [cities, setCities] = useState([]);
  const [kitOnly, setKitOnly] = useState(false);
  const [sort, setSort] = useState("match");
  // Mobile only — the filter column is always on from `lg` up.
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = async () => {
    if (!user?.id || !id) return;
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase.functions.invoke("brand-campaigns", {
      body: { action: "get", campaignId: id, brandId: user.id },
    });
    if (err || data?.error) {
      setError(err?.message || data?.error || t("errors.loadFailed"));
      setLoading(false);
      return;
    }
    setCampaign(data.campaign);
    const apps = data.applications || [];
    setApplications(apps);
    setLoading(false);
    // No ratings query here any more: the only thing that read them was the
    // review panel, which now lives on its own page and fetches the one row
    // it needs. This list never displayed a rating.
  };

  useEffect(() => {
    if (!authLoading && user?.id && id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, id]);

  const matchTarget = useMemo(() => targetFromCampaign(campaign), [campaign]);

  // Score once per application, not once per render of every filter. The
  // score also feeds the band filter, so it has to exist before filtering.
  const scored = useMemo(() => {
    const ranked = campaign ? rankApplications(applications, campaign) : applications;
    return ranked.map((app) => ({
      app,
      match: scoreApplicant(creatorFromApplication(app), matchTarget),
      profile: app.influencer_profiles || {},
    }));
  }, [applications, campaign, matchTarget]);

  // Tab counts are computed off the UNFILTERED set, so a tab never reads
  // "0" because of a filter the brand set on another tab and forgot.
  const countsByLabel = useMemo(() => {
    const out = {};
    for (const { app } of scored) {
      const key = (appStatusConfig[app.status] || appStatusConfig.pending).labelKey;
      out[key] = (out[key] || 0) + 1;
    }
    return out;
  }, [scored]);

  // Only statuses that actually occur get a tab. Twelve tabs on a campaign
  // with three pending applicants is a strip the brand has to read past.
  const tabs = useMemo(
    () => ["all", ...LABEL_ORDER.filter((k) => countsByLabel[k] > 0)],
    [countsByLabel],
  );

  // Filter options come from the applicants in hand rather than the master
  // category list: offering "Pet Care" on a campaign nobody from pet care
  // applied to is a filter that can only ever return nothing.
  const catOptions = useMemo(() => {
    const seen = new Map();
    for (const { profile } of scored) {
      for (const c of profile.categories || []) {
        const v = String(c || "").trim();
        if (v) seen.set(norm(v), v);
      }
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }, [scored]);

  const cityOptions = useMemo(() => {
    const seen = new Map();
    for (const { profile } of scored) {
      // location is a scalar text column that multi-select surfaces
      // comma-join ("Mumbai, Pune"), so split it back out.
      for (const part of String(profile.location || "").split(",")) {
        const v = part.trim();
        if (v) seen.set(norm(v), v);
      }
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }, [scored]);

  const filtered = useMemo(() => {
    const q = norm(query);
    const rows = scored.filter(({ app, match, profile }) => {
      if (tab !== "all") {
        const statuses = STATUSES_BY_LABEL[tab] || [];
        if (!statuses.includes(app.status)) return false;
      }

      if (q) {
        const hay = [profile.full_name, profile.username, profile.instagram_handle, profile.location]
          .map(norm)
          .join(" ");
        if (!hay.includes(q)) return false;
      }

      // An unscoreable brief (no targeting at all) leaves percent null. Such
      // an applicant is excluded by a band filter rather than silently kept:
      // the brand asked for strong fits and we cannot claim this is one.
      if (bands.length) {
        const p = match.percent;
        if (p === null) return false;
        if (!bands.some((k) => {
          const b = MATCH_BANDS.find((x) => x.key === k);
          return b && p >= b.min && p < b.max;
        })) return false;
      }

      if (buckets.length) {
        const f = Number(profile.followers_count) || 0;
        if (!buckets.some((k) => {
          const b = FOLLOWER_BUCKETS.find((x) => x.key === k);
          return b && f >= b.min && f < b.max;
        })) return false;
      }

      if (cats.length) {
        const has = (profile.categories || []).map(norm);
        if (!cats.some((c) => has.includes(norm(c)))) return false;
      }

      if (cities.length) {
        const where = norm(profile.location);
        // Substring both ways, the same comparison the scorer and
        // list-influencers make, so "Mumbai" still matches "Mumbai, Pune".
        if (!cities.some((c) => where.includes(norm(c)) || norm(c).includes(where))) return false;
      }

      if (kitOnly && !profile.media_kit_published) return false;

      return true;
    });

    if (sort === "match") return rows; // already ranked
    const by = {
      followers: (a, b) => (Number(b.profile.followers_count) || 0) - (Number(a.profile.followers_count) || 0),
      engagement: (a, b) => (Number(b.profile.engagement_rate) || 0) - (Number(a.profile.engagement_rate) || 0),
      newest: (a, b) => new Date(b.app.created_at || 0) - new Date(a.app.created_at || 0),
      rateAsc: (a, b) =>
        (Number(a.app.proposed_rate) || Number.MAX_SAFE_INTEGER) -
        (Number(b.app.proposed_rate) || Number.MAX_SAFE_INTEGER),
    };
    return [...rows].sort(by[sort]);
  }, [scored, tab, query, bands, buckets, cats, cities, kitOnly, sort]);

  const toggle = (setter) => (value) =>
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  const activeFilterCount =
    bands.length + buckets.length + cats.length + cities.length + (kitOnly ? 1 : 0) + (query ? 1 : 0);

  const clearFilters = () => {
    setQuery("");
    setBands([]);
    setBuckets([]);
    setCats([]);
    setCities([]);
    setKitOnly(false);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#5851DB]" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-semibold text-gray-700">{error || t("errors.notFound")}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm font-semibold text-[#5851DB]">
          {t("actions.goBack")}
        </button>
      </div>
    );
  }

  const A = (key, values) => t(`allApplications.${key}`, values);

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-24">
      {/* Top bar */}
      <nav className="px-6 py-4 bg-white sticky top-0 z-40 border-b border-gray-100">
        <div className={`${SHELL} flex items-center gap-3`}>
          <Link
            href={`/brands/campaign/${campaign.id}`}
            className="p-2 -ml-2 rounded-full hover:bg-gray-50 cursor-pointer text-gray-700"
            aria-label={t("actions.goBack")}
          >
            <ArrowLeft size={22} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-extrabold text-gray-400 uppercase tracking-wider">{A("eyebrow")}</p>
            <h1 className="text-[15px] font-extrabold text-gray-900 truncate">{campaign.title}</h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer disabled:opacity-50"
            title={t("tooltips.refresh")}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Status tabs. Horizontally scrollable — on a busy campaign there
            are more of these than fit a phone, and wrapping them pushes the
            list itself below the fold. */}
        <div className={`${SHELL} mt-3 -mb-1 overflow-x-auto no-scrollbar`}>
          <div className="flex items-center gap-2 w-max pb-1">
            {tabs.map((key) => {
              const count = key === "all" ? scored.length : countsByLabel[key] || 0;
              const on = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[14px] font-bold border transition-colors cursor-pointer ${
                    on
                      ? "bg-[#5851DB] text-white border-[#5851DB]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-purple-200"
                  }`}
                >
                  {key === "all" ? A("tabAll") : t(`appStatus.${key}`)}
                  <span className={`ml-1.5 ${on ? "text-white/70" : "text-gray-400"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className={`px-6 pt-5 ${SHELL} grid grid-cols-1 lg:grid-cols-[272px_minmax(0,1fr)] gap-6 items-start`}>
        {/* ─── Filters ─── */}
        <div className="lg:sticky lg:top-32">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="lg:hidden w-full flex items-center justify-between rounded-2xl bg-white border border-gray-100 px-4 py-3 text-[15px] font-extrabold text-gray-700 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal size={16} />
              {A("filters")}
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[12px] bg-purple-100 text-[#5851DB]">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <ChevronRight size={16} className={`transition-transform ${filtersOpen ? "rotate-90" : ""}`} />
          </button>

          <div className={`${filtersOpen ? "block" : "hidden"} lg:block mt-3 lg:mt-0 space-y-4 bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm`}>
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-extrabold text-gray-400 uppercase tracking-wider">{A("filters")}</h2>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} type="button" className="text-[13px] font-bold text-[#5851DB] cursor-pointer hover:underline">
                  {A("clear")}
                </button>
              )}
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={A("searchPlaceholder")}
                className="w-full pl-8 pr-8 py-2 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:border-[#5851DB]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                  aria-label={A("clear")}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <FilterGroup title={A("groupMatch")}>
              {MATCH_BANDS.map((b) => (
                <Chip key={b.key} on={bands.includes(b.key)} onClick={() => toggle(setBands)(b.key)}>
                  {A(`band.${b.key}`)}
                </Chip>
              ))}
            </FilterGroup>

            <FilterGroup title={A("groupFollowers")}>
              {FOLLOWER_BUCKETS.map((b) => (
                <Chip key={b.key} on={buckets.includes(b.key)} onClick={() => toggle(setBuckets)(b.key)}>
                  {A(`bucket.${b.key}`)}
                </Chip>
              ))}
            </FilterGroup>

            {catOptions.length > 0 && (
              <FilterGroup title={A("groupCategories")}>
                {catOptions.map((c) => (
                  <Chip key={c} on={cats.includes(c)} onClick={() => toggle(setCats)(c)}>
                    {c}
                  </Chip>
                ))}
              </FilterGroup>
            )}

            {cityOptions.length > 0 && (
              <FilterGroup title={A("groupLocation")}>
                {cityOptions.map((c) => (
                  <Chip key={c} on={cities.includes(c)} onClick={() => toggle(setCities)(c)}>
                    {c}
                  </Chip>
                ))}
              </FilterGroup>
            )}

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={kitOnly}
                onChange={(e) => setKitOnly(e.target.checked)}
                className="w-4 h-4 accent-[#5851DB] cursor-pointer"
              />
              <span className="text-[14px] font-semibold text-gray-700">{A("mediaKitOnly")}</span>
            </label>
          </div>
        </div>

        {/* ─── List ─── */}
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-[14px] font-semibold text-gray-500">
              {A("showing", { shown: filtered.length, total: scored.length })}
            </p>
            <label className="flex items-center gap-2 shrink-0">
              <span className="text-[13px] font-bold text-gray-400 uppercase tracking-wider hidden sm:inline">{A("sortBy")}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[14px] font-semibold text-gray-700 cursor-pointer focus:outline-none focus:border-[#5851DB]"
              >
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {A(`sort.${s}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-gray-100 py-16 text-center">
              <Users size={28} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-600">
                {scored.length === 0 ? t("applications.empty") : A("noneMatch")}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {scored.length === 0 ? t("applications.emptyHint") : A("noneMatchHint")}
              </p>
              {scored.length > 0 && activeFilterCount > 0 && (
                <button onClick={clearFilters} type="button" className="mt-4 text-[14px] font-bold text-[#5851DB] cursor-pointer hover:underline">
                  {A("clear")}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map(({ app, match, profile }) => {
                const name = profile.full_name || profile.username || profile.instagram_handle || t("common.creator");
                const st = appStatusConfig[app.status] || appStatusConfig.pending;
                const reasons = match.dimensions.map((d) => `${VERDICT_MARK[d.verdict]} ${d.label}`);
                const money = pickMoney(app);
                return (
                  <Link
                    key={app.id}
                    href={`/brands/campaign/${campaign.id}/applications/${app.id}`}
                    className="block w-full text-left bg-white rounded-[20px] border border-gray-100 p-4 sm:px-5 hover:border-purple-200 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                        {profile.profile_photo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={profile.profile_photo_url} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          name.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-extrabold text-gray-900 truncate">{name}</p>
                          {match.percent !== null && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${MATCH_TONE_CLASS[matchTone(match.percent)]}`}
                              title={reasons.join(" · ")}
                            >
                              {A("matchBadge", { percent: match.percent })}
                            </span>
                          )}
                          {/* On a narrow screen the status rides with the
                              name; from `sm` up it moves to the right rail,
                              which is what keeps a 1400px row from being
                              empty on its right half. */}
                          <span className={`sm:hidden px-2 py-0.5 rounded-full text-[12px] font-bold ${st.bg}`}>
                            {t(`appStatus.${st.labelKey}`)}
                          </span>
                        </div>

                        {profile.instagram_handle && (
                          <p className="text-[13px] text-gray-400 truncate mt-0.5">@{profile.instagram_handle}</p>
                        )}

                        <div className="flex items-center gap-3 flex-wrap mt-2 text-[13px] text-gray-500 font-semibold">
                          <span className="inline-flex items-center gap-1">
                            <Users size={12} className="text-gray-400" />
                            {formatCount(profile.followers_count)}
                          </span>
                          {Number(profile.engagement_rate) > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <TrendingUp size={12} className="text-gray-400" />
                              {Number(profile.engagement_rate).toFixed(1)}%
                            </span>
                          )}
                          {profile.location && (
                            <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                              <MapPin size={12} className="text-gray-400" />
                              {profile.location}
                            </span>
                          )}
                          <span className="text-gray-400">{formatDate(app.created_at)}</span>
                        </div>

                        {/* The reasons behind the percentage, spelled out
                            rather than buried in a title attribute. "?" is
                            the one that matters: we do not hold that field
                            for this creator, which is not the same as them
                            failing it. */}
                        {reasons.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-2">
                            {match.dimensions.map((d) => (
                              <span
                                key={d.key}
                                className={`px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${
                                  d.verdict === "match"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : d.verdict === "miss"
                                      ? "bg-red-50 text-red-600"
                                      : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {VERDICT_MARK[d.verdict]} {d.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right rail — status, and whatever money has been
                          named so far. The money label changes with the
                          stage because the three columns mean different
                          things: a creator's ask, the brand's offer, and
                          the figure escrow was funded at. */}
                      <div className="shrink-0 flex items-center gap-3 self-center">
                        <div className="hidden sm:flex flex-col items-end gap-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-[12px] font-bold whitespace-nowrap ${st.bg}`}>
                            {t(`appStatus.${st.labelKey}`)}
                          </span>
                          {money && (
                            <span className="text-[13px] font-bold text-gray-700 whitespace-nowrap">
                              <span className="text-gray-400 font-semibold">{A(`money.${money.key}`)} </span>
                              ₹{money.value.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FilterGroup = ({ title, children }) => (
  <div>
    <p className="text-[12px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </div>
);

const Chip = ({ on, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1 rounded-full text-[13px] font-bold border transition-colors cursor-pointer ${
      on
        ? "bg-purple-50 text-[#5851DB] border-[#5851DB]"
        : "bg-white text-gray-600 border-gray-200 hover:border-purple-200"
    }`}
  >
    {children}
  </button>
);

export default CampaignApplicationsPage;
