// How closely an applicant fits the brief they applied to.
//
// Applications arrive newest-first, which tells a brand nothing about who is
// worth reading first. This scores each applicant against the campaign's own
// targeting so the best fits lead, and says WHY — a ranking a brand cannot
// interrogate is one they will not trust.
//
// HAND-SYNCED with rsgossips_admin/src/lib/application-match.ts, the same way
// plans.js mirrors subscription-plans.ts. Mirror any change there.
//
// Three outcomes per dimension, and that is the load-bearing part:
//
//   match    — full weight
//   miss     — zero
//   unknown  — HALF weight, and said out loud
//
// Measured on the live table (500 profiles): followers_count and
// engagement_rate are 100% filled, location 14%, categories 12%. "Missing"
// is the common case, so a scorer that could not tell "does not match" from
// "we do not know" would rank on how complete a profile is rather than on
// fit — and a brand acts on this order.
//
// ONE DELIBERATE DIFFERENCE from the admin copy: gender is not scored here.
// brand-campaigns' get action does not return a creator's gender (see its
// influencer_profiles select), and it should not start to just for a sort —
// apply-campaign already refuses a wrong-gender application outright, so by
// the time a brand sees an applicant the brief's gender rule has been
// enforced. The admin copy scores it because the portal already holds it.

const WEIGHTS = {
  followers: 35,
  categories: 30,
  location: 12,
  engagement: 8,
};

const NEAR_CREDIT = 0.6;
const NEAR_DRIFT = 0.5;

const norm = (s) => String(s || "").trim().toLowerCase();

// "All India" is the brief saying "anywhere"; as a city name it matches nobody.
const WILDCARD_CITIES = new Set(["all india", "all", "anywhere", "pan india", "any"]);

/**
 * @param {{followersCount?: number|null, categories?: string[]|null, location?: string|null, engagementRate?: number|null}} creator
 * @param {{categories?: string[]|null, cities?: string[]|null, followerMin?: number|null, followerMax?: number|null, minEngagementRate?: number|null}} target
 */
export function scoreApplicant(creator, target) {
  const dimensions = [];
  let earned = 0;
  let achievable = 0;
  let belowFollowerMin = false;

  const add = (key, label, verdict, weight) => {
    achievable += weight;
    if (verdict === "match") earned += weight;
    else if (verdict === "unknown") earned += weight / 2;
    dimensions.push({ key, label, verdict });
  };

  // ── Followers ──────────────────────────────────────────────────────────
  const min = Number(target.followerMin) || 0;
  const max = Number(target.followerMax) || 0;
  if (min || max) {
    const f = Number(creator.followersCount);
    if (!Number.isFinite(f) || f <= 0) {
      add("followers", "follower count unknown", "unknown", WEIGHTS.followers);
    } else {
      const inBand = (!min || f >= min) && (!max || f <= max);
      if (inBand) {
        add("followers", "in the follower range", "match", WEIGHTS.followers);
      } else {
        const edge = f < min ? min : max;
        const drift = edge > 0 ? Math.abs(f - edge) / edge : 1;
        if (f < min) belowFollowerMin = true;
        if (drift <= NEAR_DRIFT) {
          // A near miss keeps most of the weight: a creator at 11k on a
          // 1-10k brief is someone a brand would want to see.
          achievable += WEIGHTS.followers;
          earned += WEIGHTS.followers * NEAR_CREDIT;
          dimensions.push({
            key: "followers",
            label: f < min ? "just under the follower range" : "just over the follower range",
            verdict: "miss",
          });
        } else {
          add(
            "followers",
            f < min ? "well under the follower range" : "well over the follower range",
            "miss",
            WEIGHTS.followers,
          );
        }
      }
    }
  }

  // ── Categories ─────────────────────────────────────────────────────────
  const wantedCats = (target.categories || []).map(norm).filter(Boolean);
  if (wantedCats.length) {
    const has = (creator.categories || []).map(norm).filter(Boolean);
    if (!has.length) {
      add("categories", "no categories on file", "unknown", WEIGHTS.categories);
    } else {
      // Substring both ways, the same comparison list-influencers makes.
      const hits = wantedCats.filter((w) => has.some((h) => h === w || h.includes(w) || w.includes(h)));
      if (hits.length) {
        add(
          "categories",
          hits.length === 1 ? "category match" : `${hits.length} category matches`,
          "match",
          WEIGHTS.categories,
        );
      } else {
        add("categories", "different categories", "miss", WEIGHTS.categories);
      }
    }
  }

  // ── Location ───────────────────────────────────────────────────────────
  const cities = (target.cities || []).map(norm).filter((c) => c && !WILDCARD_CITIES.has(c));
  if (cities.length) {
    const where = norm(creator.location);
    if (!where) {
      add("location", "location not on file", "unknown", WEIGHTS.location);
    } else if (cities.some((city) => where.includes(city) || city.includes(where))) {
      add("location", "city match", "match", WEIGHTS.location);
    } else {
      add("location", "different city", "miss", WEIGHTS.location);
    }
  }

  // ── Engagement ─────────────────────────────────────────────────────────
  const minEr = Number(target.minEngagementRate) || 0;
  if (minEr > 0) {
    const er = Number(creator.engagementRate);
    if (!Number.isFinite(er) || er <= 0) {
      add("engagement", "engagement unknown", "unknown", WEIGHTS.engagement);
    } else if (er >= minEr) {
      add("engagement", `${er.toFixed(1)}% engagement`, "match", WEIGHTS.engagement);
    } else {
      add("engagement", `${er.toFixed(1)}% engagement, brief wants ${minEr}%`, "miss", WEIGHTS.engagement);
    }
  }

  return {
    // No targeting at all means every applicant is an equally good answer; a
    // fabricated 100% would read as a judgement nobody made.
    percent: achievable > 0 ? Math.round((earned / achievable) * 100) : null,
    dimensions,
    belowFollowerMin,
  };
}

/**
 * Build the scorer's creator input from an application row as
 * brand-campaigns returns it (snake_case, profile nested).
 */
export function creatorFromApplication(app) {
  const p = app?.influencer_profiles || {};
  return {
    followersCount: p.followers_count,
    categories: p.categories,
    location: p.location,
    engagementRate: p.engagement_rate,
  };
}

/** Build the scorer's target from the campaign object the get action returns. */
export function targetFromCampaign(campaign) {
  return {
    categories: campaign?.categories || null,
    cities: campaign?.targetCities || null,
    followerMin: campaign?.targetFollowerMin || null,
    followerMax: campaign?.targetFollowerMax || null,
    minEngagementRate: campaign?.minEngagementRate || null,
  };
}

/**
 * Order applicants best-fit first.
 *
 * Ties break on follower count, then on the original order, so the sort is
 * stable and a re-render does not reshuffle equally-scoring rows.
 */
export function rankApplications(applications, campaign) {
  const target = targetFromCampaign(campaign);
  return applications
    .map((app, index) => ({
      app,
      index,
      result: scoreApplicant(creatorFromApplication(app), target),
      f: Number(app?.influencer_profiles?.followers_count) || 0,
    }))
    .sort((a, b) => {
      const ap = a.result.percent;
      const bp = b.result.percent;
      // An unscoreable brief leaves everyone equal — fall through to the
      // original order rather than inventing a ranking.
      if (ap !== null && bp !== null && ap !== bp) return bp - ap;
      if (a.f !== b.f) return b.f - a.f;
      return a.index - b.index;
    })
    .map((x) => x.app);
}

/** A badge tone for a percentage. */
export function matchTone(percent) {
  if (percent === null || percent === undefined) return "none";
  if (percent >= 75) return "strong";
  if (percent >= 45) return "fair";
  return "weak";
}
