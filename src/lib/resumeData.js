// Build the creator résumé PDF's data from a real influencer profile.
//
// The résumé used to be a prototype: the page, the viewer and the "generate"
// button all carried hardcoded data for a creator called Rohan Sharma, and
// `resume_pdf_url` — which both apps tried to open — is not a column on
// influencer_profiles at all. This module replaces the invented numbers with
// the ones the media kit already shows, read through the same helpers so a
// creator's résumé and kit can never disagree.
//
// Rule for this file: never invent a metric. Anything Instagram has not given
// us comes back null/empty and the template drops that section, because this
// document goes to brands as a statement of fact.

import {
  formatCount,
  normaliseGender,
  readDemographics,
  readHeadlineStats,
  readProfile,
  toServiceLabel,
} from "@/components/mediaKitTemplates/shared";

const pct = (n) => {
  const v = Number(n) || 0;
  return v > 0 ? `${v.toFixed(1)}%` : null;
};

export function buildResumeData(profile) {
  if (!profile) return null;

  const p = readProfile(profile);
  const headline = readHeadlineStats(profile);
  const insights = profile?.instagram_insights || profile?.instagramInsights || null;
  const demo = readDemographics(
    profile?.audience_demographics || profile?.audienceDemographics,
    p.location,
  );

  const topCountries = (demo.topCountries || [])
    .filter((c) => c?.name && Number(c.pct) > 0)
    .slice(0, 5)
    .map((c) => ({ country: c.name, percent: Math.round(Number(c.pct)) }));

  const gender = normaliseGender(
    (profile?.audience_demographics || profile?.audienceDemographics)?.gender,
  );

  // Curated or auto top reels, whichever the profile carries. Instagram gives
  // us likes per media, not views, so the row is labelled by what it holds.
  const topPosts = (Array.isArray(profile?.top_reels) ? profile.top_reels : [])
    .filter((r) => r?.permalink)
    .slice(0, 5)
    .map((r) => ({
      title: (r.caption || "").trim().slice(0, 60) || p.handle,
      likes: formatCount(Number(r.likes) || 0),
    }));

  const rates = (Array.isArray(p.services) ? p.services : [])
    .map((id) => ({ label: toServiceLabel(id), price: Number(p.serviceRates?.[id]) || 0 }))
    .filter((r) => r.price > 0)
    .map((r) => ({ ...r, price: `₹${r.price.toLocaleString("en-IN")}` }));

  return {
    name: p.name,
    handle: p.handle,
    niche: p.categories[0] || "",
    avatar: p.photo || null,
    location: p.location || "",

    // Headline. `reelViews` is a 30-day total, not an average — the label in
    // the template says so.
    followers: formatCount(p.followers),
    engagement: pct(p.engagementRate),
    reelViews: headline.reelViews.value === null ? null : headline.reelViews.display,

    summary: p.bio || "",

    // Averages that are genuinely averages (stored columns), plus 30-day
    // totals kept separate so nothing is mislabelled.
    avgLikes: p.avgLikes > 0 ? formatCount(p.avgLikes) : null,
    avgComments: p.avgComments > 0 ? formatCount(p.avgComments) : null,
    saves30d: insights?.saves ? formatCount(Number(insights.saves)) : null,
    reach30d: headline.viewers.value === null ? null : headline.viewers.display,

    topics: p.categories || [],
    audience: topCountries,
    gender: { male: gender.male, female: gender.female },
    topPosts,
    rates,
  };
}

export default buildResumeData;
