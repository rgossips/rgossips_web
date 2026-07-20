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
  const gender = d?.gender || { male: 0, female: 0, other: 0 };
  const topCountries = d?.topCountries || [];
  return { topCities, ageRanges, gender, topCountries };
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
