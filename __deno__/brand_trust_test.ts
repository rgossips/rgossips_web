/**
 * Brand Trust Score — pins the shape of the ONE implementation.
 *
 * This score existed in four places at once: the web dashboard, the mobile
 * app (3 pillars, 0–1000, LOW/GOOD/HIGH), list-brands (communication pinned
 * at neutral) and a stray band-label ladder in the mobile brand card. A brand
 * could see three different numbers for itself and creators saw a fourth.
 *
 * These tests exist so a fifth copy cannot appear quietly: they pin the
 * weights, the scale, the band cutoffs, the cold-start cap and the two
 * derivations that feed the score, so anyone reimplementing them elsewhere
 * has to change a test to do it.
 */
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  COLD_START_CAP,
  COLD_START_THRESHOLD,
  PILLAR_WEIGHTS,
  SCALE_MAX,
  SCALE_MIN,
  bandFor,
  computeBrandTrustScore,
  executionFromApplications,
  getProfileCompletion,
  historyMetrics,
} from "../supabase/functions/_shared/brand-trust.ts";

const DELIVERED = {
  approvedCount: 10,
  finalAcceptedCount: 10,
  abandonedAfterApproval: 0,
  reachedDraftCount: 10,
  totalRevisions: 10,
};

Deno.test("pillar weights are the documented 30/25/20/15/10 and sum to 1", () => {
  assertEquals(PILLAR_WEIGHTS.reviews, 0.30);
  assertEquals(PILLAR_WEIGHTS.execution, 0.25);
  assertEquals(PILLAR_WEIGHTS.verification, 0.20);
  assertEquals(PILLAR_WEIGHTS.communication, 0.15);
  assertEquals(PILLAR_WEIGHTS.engagement, 0.10);
  const total = Object.values(PILLAR_WEIGHTS).reduce((s, v) => s + v, 0);
  assert(Math.abs(total - 1) < 1e-9, `weights sum to ${total}`);
});

Deno.test("the scale is 300–900, never 0–1000", () => {
  assertEquals(SCALE_MIN, 300);
  assertEquals(SCALE_MAX, 900);

  // A brand with nothing at all still floors at 300, not 0.
  const empty = computeBrandTrustScore({});
  assert(empty.score >= 300, `empty brand scored ${empty.score}`);
  assertEquals(empty.scaleMin, 300);
  assertEquals(empty.scaleMax, 900);
});

Deno.test("bands use the non-punitive labels, at the documented cutoffs", () => {
  assertEquals(bandFor(900), "Elite");
  assertEquals(bandFor(800), "Elite");
  assertEquals(bandFor(799), "Trusted");
  assertEquals(bandFor(740), "Trusted");
  assertEquals(bandFor(739), "Established");
  assertEquals(bandFor(670), "Established");
  assertEquals(bandFor(669), "Emerging");
  assertEquals(bandFor(580), "Emerging");
  assertEquals(bandFor(579), "Building Trust");
  assertEquals(bandFor(300), "Building Trust");

  // The retired labels must not come back.
  for (const score of [300, 579, 580, 669, 670, 739, 740, 799, 800, 900]) {
    const band = bandFor(score);
    assert(
      !["Excellent", "Very Good", "Good", "Fair", "Poor", "LOW", "GOOD", "HIGH"].includes(band),
      `retired label resurfaced: ${band}`,
    );
  }
});

Deno.test("cold start caps an otherwise strong brand until 3 completed campaigns", () => {
  const strong = {
    profile: {
      categories: ["Beauty"],
      full_description: "x",
      logo_url: "x",
      website_url: "x",
      contact_email: "x",
      contact_phone: "x",
      instagram_username: "x",
    },
    reviews: [{ target_rating: 5, brief_clarity: 5, fairness: 5, created_at: new Date().toISOString() }],
    verification: { emailVerified: true, phoneVerified: true, gstin: "27AAPFU0939F1ZV" },
    communication: { avgApplicationDecisionHrs: 1, avgDraftFeedbackHrs: 1, feedbackRichnessRatio: 1 },
    engagement: { lastLoginAt: new Date().toISOString(), campaignsLast90d: 5 },
  };

  const cold = computeBrandTrustScore({
    ...strong,
    execution: { ...DELIVERED, finalAcceptedCount: COLD_START_THRESHOLD - 1 },
  });
  assert(cold.coldStart, "should be cold-start with 2 completed campaigns");
  assertEquals(cold.score, COLD_START_CAP);

  const warm = computeBrandTrustScore({
    ...strong,
    execution: { ...DELIVERED, finalAcceptedCount: COLD_START_THRESHOLD },
  });
  assert(!warm.coldStart, "3 completed campaigns clears cold start");
  assert(warm.score > COLD_START_CAP, `expected above the cap, got ${warm.score}`);
});

Deno.test("no data scores neutral rather than zero", () => {
  const blank = computeBrandTrustScore({});
  assertEquals(blank.breakdown.influencerReviews.percent, 50);
  assertEquals(blank.breakdown.communication.percent, 50);
  assert(!blank.breakdown.influencerReviews.hasData);
});

Deno.test("penalties are applied and capped", () => {
  const base = computeBrandTrustScore({ execution: DELIVERED });
  const penalised = computeBrandTrustScore({ execution: DELIVERED, penaltyPoints: 50 });
  assertEquals(penalised.penaltyApplied, 50);
  assert(penalised.score <= base.score);

  const absurd = computeBrandTrustScore({ execution: DELIVERED, penaltyPoints: 99_999 });
  assertEquals(absurd.penaltyApplied, 400);
  assert(absurd.score >= SCALE_MIN);
});

Deno.test("profile completion counts Instagram as the social link, not dead columns", () => {
  // brand_profiles has no facebook_url / linkedin_url / twitter_url columns;
  // the old test read them and silently cost every brand the point.
  const withInstagram = getProfileCompletion({ instagram_username: "acme" });
  assert(withInstagram.filled.includes("Social links"));

  const withUrlOnly = getProfileCompletion({ instagram_url: "https://instagram.com/acme" });
  assert(withUrlOnly.filled.includes("Social links"));

  const none = getProfileCompletion({ facebook_url: "https://fb.com/acme" });
  assert(none.missing.includes("Social links"));
});

Deno.test("execution: an approved application on a live campaign is in flight, not abandoned", () => {
  const campaigns = [
    { campaign_id: "live", status: "active", campaign_end_date: null },
    { campaign_id: "over", status: "completed", campaign_end_date: null },
  ];
  const e = executionFromApplications(
    [
      { id: "1", campaign_id: "live", status: "approved" },
      { id: "2", campaign_id: "over", status: "approved" },
      { id: "3", campaign_id: "over", status: "completed" },
      { id: "4", campaign_id: "live", status: "pending" },
    ],
    campaigns,
  );
  assertEquals(e.abandonedAfterApproval, 1); // only the one on the finished campaign
  assertEquals(e.finalAcceptedCount, 1);
  assertEquals(e.approvedCount, 3); // pending does not count as approved
});

Deno.test("execution: an unanswered offer is not an approval", () => {
  const e = executionFromApplications(
    [
      { id: "1", campaign_id: "c", status: "offer_sent" },
      { id: "2", campaign_id: "c", status: "offer_accepted" },
    ],
    [{ campaign_id: "c", status: "active" }],
  );
  assertEquals(e.approvedCount, 0);
});

Deno.test("history: SLA latency is the gap to the previous transition, and richness needs a reason", () => {
  const t0 = new Date("2026-01-01T00:00:00Z").toISOString();
  const t24 = new Date("2026-01-02T00:00:00Z").toISOString();
  const { totalRevisions, communication } = historyMetrics([
    { application_id: "a", from_status: null, to_status: "pending", created_at: t0 },
    {
      application_id: "a",
      from_status: "pending",
      to_status: "approved",
      changed_by_role: "brand",
      reason: "Looks great",
      created_at: t24,
    },
    {
      application_id: "a",
      from_status: "submitted",
      to_status: "revision_needed",
      changed_by_role: "brand",
      reason: "",
      created_at: t24,
    },
  ]);

  assertEquals(totalRevisions, 1);
  assertEquals(communication.avgApplicationDecisionHrs, 24);
  // Two brand decisions, one carried a written reason.
  assertEquals(communication.feedbackRichnessRatio, 0.5);
  // Negotiation is not modelled as a status, so it stays null rather than
  // dragging the SLA average toward a number we never measured.
  assertEquals(communication.avgNegotiationHrs, null);
});

Deno.test("the same inputs always produce the same score (a card cannot disagree with a dashboard)", () => {
  const input = {
    profile: { categories: ["Tech"], logo_url: "x", instagram_username: "x" },
    reviews: [{ target_rating: 4, created_at: new Date().toISOString() }],
    execution: DELIVERED,
    verification: { emailVerified: true, phoneVerified: false, gstin: "27AAPFU0939F1ZV" },
    communication: { avgApplicationDecisionHrs: 10, feedbackRichnessRatio: 0.5 },
    engagement: { lastLoginAt: new Date().toISOString(), campaignsLast90d: 2 },
  };
  const a = computeBrandTrustScore(input);
  const b = computeBrandTrustScore(input);
  assertEquals(a.score, b.score);
  assertEquals(a.band, b.band);
});
