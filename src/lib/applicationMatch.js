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
// engagement_rate are 100% filled, gender 51%, location 14%, categories
// 12%. "Missing" is the common case, so a scorer that could not tell "does
// not match" from "we do not know" would rank on how complete a profile is
// rather than on fit — and a brand acts on this order.
//
// The score is a percentage of what was ACHIEVABLE for that brief, so a
// campaign that only sets a follower range produces numbers comparable to
// one that sets everything.
//
// ── Every parameter on the brief, and what this does with it ───────────
//
// SCORED, because the brief states it and the profile holds it:
//   target_follower_min / _max   followers_count
//   target_categories            categories
//   target_gender                gender        (see the deploy note below)
//   target_cities                location
//   min_engagement_rate          engagement_rate
//
// NOT SCORED, deliberately, each for a different reason:
//   target_influencer_tier   Redundant. CreateCampaignDialog's TIER_RANGES
//                            writes the follower min/max FROM the tier, so
//                            scoring both counts one fact twice and would
//                            quietly make followers worth 50 points.
//   target_languages         influencer_profiles has no `languages` column
//                            — selecting one 42703s. Language data exists
//                            only on invitation notes, which an applicant
//                            does not have. Nothing to compare against.
//   platforms                Every registered creator here is an Instagram
//                            creator; we hold no YouTube/X presence to test
//                            against. A dimension every applicant passes
//                            adds no ordering, only a bigger denominator.
//   content_types_required,  Obligations the creator takes on AFTER being
//   usage_rights,            picked, not attributes they either have or do
//   exclusivity_days, …      not. Applying IS the agreement to them.
//
// DEPLOY NOTE on gender: brand-campaigns' `get` action must include `gender`
// in its influencer_profiles select for that dimension to run. Until that
// deploy lands the field arrives `undefined` and the dimension is SKIPPED
// rather than scored "unknown" — a tooltip telling every brand "gender not
// on file" when the server simply never sent it would be a lie, and halving
// one weight across every applicant alike moves the percentages without
// moving the order.

import { genderExcludes, genderLabel, requiredGender } from "@/lib/gender-target";

// Followers lead because it is the one thing every brief states and every
// profile has. Engagement is a tie-breaker, not a qualifier.
const WEIGHTS = {
  followers: 35,
  categories: 30,
  gender: 15,
  location: 12,
  engagement: 8,
};

// A near miss still earns most of the weight: a creator at 11k on a 1-10k
// brief is someone a brand would want to see, not someone to bury.
const NEAR_CREDIT = 0.6;
// How far outside the band still counts as near, as a fraction of the edge.
const NEAR_DRIFT = 0.5;

const norm = (s) => String(s || "").trim().toLowerCase();

// "All India" is the brief saying "anywhere"; as a city name it matches nobody.
const WILDCARD_CITIES = new Set(["all india", "all", "anywhere", "pan india", "any"]);

/**
 * @param {{followersCount?: number|null, categories?: string[]|null, location?: string|null, engagementRate?: number|null, gender?: string|null}} creator
 * @param {{categories?: string[]|null, cities?: string[]|null, followerMin?: number|null, followerMax?: number|null, gender?: string[]|null, minEngagementRate?: number|null}} target
 */
export function scoreApplicant(creator, target) {
  const dimensions = [];
  let earned = 0;
  let achievable = 0;
  let belowFollowerMin = false;
  let genderMismatch = false;
  let locationMismatch = false;

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

  // ── Gender ─────────────────────────────────────────────────────────────
  //
  // Only scored when the brief actually restricts — requiredGender returns
  // null for "Any", for both named, and for absent, which is 66 of the 75
  // live campaigns. A mismatch is flagged, never hidden: this creator has
  // already applied, and making an in-flight application vanish from the
  // brand's list would be a worse answer than showing them a poor score.
  //
  // `undefined` means the CALLER does not supply the field (see the deploy
  // note at the top); null or "" means the creator has none on file. Only
  // the second is something to say out loud.
  const needGender = requiredGender(target.gender);
  if (needGender && creator.gender !== undefined) {
    const theirs = norm(creator.gender);
    if (!theirs) {
      add("gender", "gender not on file", "unknown", WEIGHTS.gender);
    } else if (theirs === needGender) {
      add("gender", `${genderLabel(theirs) || theirs} — matches brief`, "match", WEIGHTS.gender);
    } else {
      // The FLAG and the SCORE answer different questions, so they are set
      // from different rules on purpose.
      //
      // Score: "not stated" against a brief that names a gender is a weaker
      // fit than a confirmed match, so it earns nothing and ranks lower.
      //
      // Flag: genderExcludes is the owner, mirroring the rule apply-campaign
      // enforces — only a KNOWN, OPPOSITE gender is an exclusion. non_binary
      // and prefer_not_to_say are not a contradiction and apply-campaign
      // accepts them; flagging them would let a filter hide a creator the
      // product deliberately allowed in.
      genderMismatch = genderExcludes(needGender, theirs);
      add("gender", `${genderLabel(theirs) || theirs} — brief asks for ${needGender}`, "miss", WEIGHTS.gender);
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
      locationMismatch = true;
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
    genderMismatch,
    locationMismatch,
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
    // Stays undefined — not null — when the function predates the select
    // that returns it, which is exactly what skips the dimension.
    gender: p.gender,
  };
}

/** Build the scorer's target from the campaign object the get action returns. */
export function targetFromCampaign(campaign) {
  return {
    categories: campaign?.categories || null,
    cities: campaign?.targetCities || null,
    followerMin: campaign?.targetFollowerMin || null,
    followerMax: campaign?.targetFollowerMax || null,
    gender: campaign?.targetGender || null,
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
