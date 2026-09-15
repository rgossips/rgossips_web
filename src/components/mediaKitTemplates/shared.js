// Shared helpers + normalisation used by every media-kit template. Keeps
// each template file focused on its own visual language while the data
// shape stays consistent.

export const SERVICE_LABELS = {
  reels: "Reels",
  stories: "Stories",
  shorts: "YouTube Shorts",
  posts: "Static Posts",
  ugc: "UGC Videos",
};

export const toServiceLabel = (id) => SERVICE_LABELS[id] || id;

export const formatCount = (n) => {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
};

// Pulls the typical fields out of either snake_case (DB) or camelCase
// (older callers) so each template can treat the resulting object as a
// flat, predictable shape.
export function readProfile(profile) {
  const name = profile?.full_name || profile?.fullName || "Creator";
  const handle =
    profile?.username ||
    profile?.instagram_handle ||
    profile?.instagramHandle ||
    "creator";
  const photo =
    profile?.custom_profile_photo_url ||
    profile?.customProfilePhotoUrl ||
    profile?.profile_photo_url ||
    profile?.profilePhotoUrl ||
    null;
  const categories = Array.isArray(profile?.categories) ? profile.categories : [];
  const contentLanguages = Array.isArray(
    profile?.content_languages || profile?.contentLanguages,
  )
    ? profile.content_languages || profile.contentLanguages
    : [];
  const bio =
    profile?.bio ||
    "Passionate content creator helping brands connect with audiences through authentic storytelling and creative content.";
  const location = profile?.location || "";
  const followers = profile?.followers_count || profile?.followersCount || 0;
  const following = profile?.follows_count || profile?.followsCount || 0;
  const posts = profile?.media_count || profile?.mediaCount || 0;
  const services = Array.isArray(profile?.services) ? profile.services : [];
  const serviceRates =
    profile?.service_rates || profile?.serviceRates || {};
  const engagementRate =
    profile?.engagement_rate || profile?.engagementRate || 0;
  const avgLikes = profile?.avg_likes || profile?.avgLikes || 0;
  const avgComments = profile?.avg_comments || profile?.avgComments || 0;
  const totalImpressions =
    profile?.total_impressions || profile?.totalImpressions || 0;
  const totalReach = profile?.total_reach || profile?.totalReach || 0;
  const topReels = Array.isArray(profile?.top_reels || profile?.topReels)
    ? profile.top_reels || profile.topReels
    : [];
  const demographics =
    profile?.audience_demographics || profile?.audienceDemographics || {};
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  // Comma-join — category names already contain "&" ("Fashion & Lifestyle"),
  // so an "&" separator read as one garbled category.
  const primaryCategory = categories.slice(0, 2).join(", ") || "Creator";
  const nonFollowerReachPct =
    totalReach && followers ? Math.round((totalReach / followers) * 100) : 0;

  return {
    name,
    handle,
    photo,
    categories,
    contentLanguages,
    bio,
    location,
    followers,
    following,
    posts,
    services,
    serviceRates,
    engagementRate,
    avgLikes,
    avgComments,
    totalImpressions,
    totalReach,
    topReels,
    demographics,
    initials,
    primaryCategory,
    nonFollowerReachPct,
  };
}

// Default demographic placeholders so every template renders even when
// Instagram demographics haven't synced yet.
export function readDemographics(d, location) {
  const topCities =
    d?.topCities?.length > 0
      ? d.topCities
      : [{ name: location || "—", pct: 0 }];
  const ageRanges =
    d?.ageRanges?.length > 0
      ? d.ageRanges
      : [
          { range: "18-24", pct: 0 },
          { range: "25-34", pct: 0 },
          { range: "35-44", pct: 0 },
          { range: "45+", pct: 0 },
        ];
  const gender = normaliseGender(d?.gender);
  const topCountries = (d?.topCountries || []).map((c) => ({ ...c, name: countryName(c.name) }));
  return { topCities, ageRanges, gender, topCountries };
}

// Gender as Instagram reports it: split over KNOWN gender only. Rows saved
// before 2026-09 carry Instagram's "unknown" bucket as `other` — often most
// of the audience — which made every kit disagree with Instagram. Re-split
// those here so old data reads right without waiting for a refresh.
export function normaliseGender(g) {
  const male = Number(g?.male) || 0;
  const female = Number(g?.female) || 0;
  const other = Number(g?.other) || 0;
  if (other > 0 && g?.unknownPct === undefined && male + female > 0) {
    const known = male + female;
    return {
      male: Math.round((male / known) * 1000) / 10,
      female: Math.round((female / known) * 1000) / 10,
      other: 0,
    };
  }
  return { male, female, other };
}

// "IN" → "India". Older rows stored ISO codes; newer ones store names.
let regionNames = null;
try {
  regionNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  regionNames = null;
}
export function countryName(value) {
  const v = String(value || "");
  if (!/^[A-Z]{2}$/.test(v)) return v;
  try {
    return regionNames?.of(v) || v;
  } catch {
    return v;
  }
}

// Instagram's 30-day account totals (refresh-instagram → instagram_insights)
// plus how fresh they are. Every template renders the same set, in its own
// style, from this one reader. Labels live in the "MediaKitInsights" i18n
// namespace so all five templates say the same thing.
// Reel views, viewers and likes are the headline stats (readHeadlineStats),
// so the "Last 30 days" block carries the rest and nothing shows twice.
export const INSIGHT_KEYS = ["comments", "shares", "saves", "reposts"];

// The four headline stats every template shows in its performance slot:
// Reel views, Viewers, Posts, Likes. Replaced Accounts Reached / Engagement
// Rate / Non-Follower Reach / Interactions (2026-09) to match what
// Instagram's own report leads with.
//   reelViews, likes — 30-day totals from instagram_insights
//   viewers          — 30-day unique reach (falls back to total_reach)
//   posts            — lifetime post count (media_count)
// A metric Instagram has not returned shows "—", never a fabricated 0.
export function readHeadlineStats(profile) {
  const raw = profile?.instagram_insights || profile?.instagramInsights || null;
  const pick = (v) => (v === null || v === undefined || v === "" ? null : Number(v) || 0);
  const reach = pick(raw?.reach) ?? pick(profile?.total_reach ?? profile?.totalReach);
  const posts = pick(profile?.media_count ?? profile?.mediaCount);
  const stat = (value) => ({ value, display: value === null ? "—" : formatCount(value) });
  return {
    reelViews: stat(pick(raw?.reelViews)),
    viewers: stat(reach),
    posts: stat(posts),
    likes: stat(pick(raw?.likes)),
  };
}
export const STALE_AFTER_DAYS = 30;

export function readInsights(profile) {
  const raw = profile?.instagram_insights || profile?.instagramInsights || null;
  const updatedRaw = profile?.instagram_refreshed_at || profile?.analyticsUpdatedAt || null;
  const tokenInvalid = !!(profile?.instagram_token_invalid_at || profile?.instagramTokenInvalid);

  const updatedAt = updatedRaw ? new Date(updatedRaw) : null;
  const validUpdated = updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt : null;
  const ageDays = validUpdated ? Math.floor((Date.now() - validUpdated.getTime()) / 86_400_000) : null;

  // Fixed month names: toLocaleDateString("en-IN") prints "Sept", and would
  // differ between the server render and the browser. Mirrors mobile.
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmtDate = (d, withYear) => `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? " " + d.getFullYear() : ""}`;
  const since = raw?.since ? new Date(raw.since) : null;
  const until = raw?.until ? new Date(raw.until) : null;
  const rangeLabel =
    since && until && !Number.isNaN(since.getTime()) && !Number.isNaN(until.getTime())
      ? `${fmtDate(since, false)} – ${fmtDate(until, true)}`
      : null;

  // A metric Instagram did not return is left out, never shown as 0.
  const items = raw
    ? INSIGHT_KEYS.filter((k) => raw[k] !== null && raw[k] !== undefined).map((k) => ({
        key: k,
        value: Number(raw[k]) || 0,
        display: formatCount(Number(raw[k]) || 0),
      }))
    : [];

  return {
    hasData: items.length > 0,
    items,
    days: raw?.days || 30,
    rangeLabel,
    updatedLabel: validUpdated ? fmtDate(validUpdated, true) : null,
    ageDays,
    // Old analytics, or Instagram has rejected the token so they cannot update.
    stale: tokenInvalid || (ageDays !== null && ageDays > STALE_AFTER_DAYS),
    tokenInvalid,
  };
}

// 4-channel social rollup that all templates surface — keeps the
// follower count handy and lets each template skin it differently.
export function readSocials(followers) {
  return [
    { key: "instagram", label: "Instagram", sub: "Followers", value: formatCount(followers) },
    { key: "tiktok", label: "TikTok", sub: "Followers", value: "—" },
    { key: "youtube", label: "YouTube", sub: "Subscribers", value: "—" },
    { key: "facebook", label: "Facebook", sub: "Followers", value: "—" },
  ];
}
