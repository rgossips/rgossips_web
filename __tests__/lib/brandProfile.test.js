import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import {
  isValidGstOrPan,
  classifyGstPan,
  getProfileCompletion,
  getInfluencerReviewsScore,
  getInfluencerRatingScore,
  getCampaignExecutionScore,
  getVerificationScore,
  getCommunicationScore,
  getEngagementScore,
  computeBrandTrustScore,
  getCampaignDeliveryRatio,
} from "@/lib/brandProfile";

const PAN = "ABCDE1234F";
const GSTIN = "27ABCDE1234F1Z5"; // embeds ABCDE1234F at positions 2..12
const NOW = Date.parse("2026-06-01T00:00:00.000Z");
const iso = (msAgo = 0) => new Date(NOW - msAgo).toISOString();
const DAY = 86_400_000;

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(NOW));
});
afterAll(() => jest.useRealTimers());

describe("isValidGstOrPan / classifyGstPan", () => {
  it("valid PAN + GSTIN (case-insensitive, trimmed)", () => {
    expect(isValidGstOrPan(PAN)).toBe(true);
    expect(isValidGstOrPan(GSTIN)).toBe(true);
    expect(isValidGstOrPan("  abcde1234f  ")).toBe(true);
  });
  it("invalid / empty", () => {
    expect(isValidGstOrPan("")).toBe(false);
    expect(isValidGstOrPan(null)).toBe(false);
    expect(isValidGstOrPan("NOTAPAN")).toBe(false);
  });
  it("classify branches", () => {
    expect(classifyGstPan("")).toEqual({ kind: "empty", valid: false });
    expect(classifyGstPan(PAN)).toEqual({ kind: "pan", valid: true });
    expect(classifyGstPan(GSTIN)).toEqual({ kind: "gst", valid: true });
    expect(classifyGstPan("ABCDE12345")).toEqual({ kind: "pan", valid: false }); // len 10, bad shape
    expect(classifyGstPan("270000000000000")).toEqual({ kind: "gst", valid: false }); // len 15
    expect(classifyGstPan("ABCDE")).toEqual({ kind: "unknown", valid: false });
  });
});

describe("getProfileCompletion", () => {
  it("null → 0% and all fields missing", () => {
    const r = getProfileCompletion(null);
    expect(r.percent).toBe(0);
    expect(r.filled).toEqual([]);
    expect(r.missing.length).toBe(7);
  });
  it("all 7 fields (with column-name gotchas) → 100%", () => {
    const r = getProfileCompletion({
      categories: ["Beauty"],
      short_description: "hi", // about falls back to short_description
      logo_url: "l",
      website_url: "w",
      contact_email: "e",
      contact_phone: "p",
      linkedin_url: "in", // any one social counts
    });
    expect(r.percent).toBe(100);
    expect(r.missing).toEqual([]);
  });
  it("partial → rounded percent", () => {
    const r = getProfileCompletion({ categories: ["A"], logo_url: "l", website_url: "w" }); // 3/7
    expect(r.percent).toBe(43);
    expect(r.filled).toContain("Categories");
    expect(r.missing).toContain("Contact email");
  });
  it("empty categories array does NOT count", () => {
    expect(getProfileCompletion({ categories: [] }).percent).toBe(0);
  });
});

describe("getInfluencerReviewsScore", () => {
  it("no reviews → neutral 50, no data", () => {
    expect(getInfluencerReviewsScore()).toEqual({ percent: 50, count: 0, axes: null, hasData: false });
    expect(getInfluencerReviewsScore({ reviews: [] }).hasData).toBe(false);
  });
  it("single 5★ review (missing axes fall back to target)", () => {
    const r = getInfluencerReviewsScore({ reviews: [{ target_rating: 5, created_at: iso() }] });
    expect(r.percent).toBe(100);
    expect(r.count).toBe(1);
    expect(r.hasData).toBe(true);
  });
  it("recency-weights a recent review above an old one", () => {
    const r = getInfluencerReviewsScore({
      reviews: [
        { target_rating: 5, created_at: iso() },
        { target_rating: 1, created_at: iso(360 * DAY) }, // half-life 180d → weight 0.25
      ],
    });
    expect(r.percent).toBe(84); // weighted 4.2/5, not the simple-average 60
  });
  it("target_rating ≤ 0 is skipped → 0%", () => {
    const r = getInfluencerReviewsScore({ reviews: [{ target_rating: 0, created_at: iso() }] });
    expect(r.percent).toBe(0);
    expect(r.hasData).toBe(true);
  });
  it("rating clamped at 5", () => {
    expect(getInfluencerReviewsScore({ reviews: [{ target_rating: 6, created_at: iso() }] }).percent).toBe(100);
  });
  it("getInfluencerRatingScore delegates (empty → neutral)", () => {
    expect(getInfluencerRatingScore()).toEqual({ percent: 50, count: 0, axes: null, hasData: false });
    expect(getInfluencerRatingScore({ reviews: [{ target_rating: 5, created_at: iso() }] }).percent).toBe(100);
  });
});

describe("getCampaignExecutionScore", () => {
  it("all-null → neutral 54, no data", () => {
    const r = getCampaignExecutionScore();
    expect(r.percent).toBe(54);
    expect(r.hasData).toBe(false);
  });
  it("revision bands (avg 0 / 2 / 4 / 5)", () => {
    const rev = (finalAcceptedCount, totalRevisions) =>
      getCampaignExecutionScore({ finalAcceptedCount, totalRevisions, abandonedAfterApproval: 0, approvedCount: finalAcceptedCount, reachedDraftCount: finalAcceptedCount });
    // completion 100 + draft 100 + revisionScore*0.2
    expect(rev(2, 0).percent).toBe(94); // avg 0 → 70 → 50+30+14
    expect(rev(2, 4).percent).toBe(100); // avg 2 → 100
    expect(rev(2, 8).percent).toBe(92); // avg 4 → 60 → 50+30+12
    expect(rev(2, 10).percent).toBe(86); // avg 5 → 30 → 50+30+6
  });
  it("completion + draft funnel ratios", () => {
    const r = getCampaignExecutionScore({ approvedCount: 4, finalAcceptedCount: 3, abandonedAfterApproval: 1, reachedDraftCount: 2, totalRevisions: 6 });
    expect(r.completionRatio).toBeCloseTo(0.75);
    expect(r.draftRatio).toBeCloseTo(0.5);
    expect(r.percent).toBe(73); // round(75*.5 + 50*.3 + 100*.2)
    expect(r.hasData).toBe(true);
  });
});

describe("getVerificationScore", () => {
  it("nothing → 0", () => {
    expect(getVerificationScore().percent).toBe(0);
  });
  it("all four → 100", () => {
    expect(getVerificationScore({ emailVerified: true, phoneVerified: true, pan: PAN, gstin: GSTIN }).percent).toBe(100);
  });
  it("PAN credited from a valid GSTIN alone", () => {
    const r = getVerificationScore({ gstin: GSTIN });
    expect(r.items.panProvided).toBe(true);
    expect(r.items.gstinVerified).toBe(true);
    expect(r.percent).toBe(50); // pan 25 + gstin 25
  });
  it("standalone PAN, no GSTIN → 25", () => {
    const r = getVerificationScore({ pan: PAN });
    expect(r.items.panProvided).toBe(true);
    expect(r.items.gstinVerified).toBe(false);
    expect(r.percent).toBe(25);
  });
  it("invalid identifiers → not credited", () => {
    expect(getVerificationScore({ pan: "BAD", gstin: "BAD" }).percent).toBe(0);
  });
});

describe("getCommunicationScore", () => {
  it("all-null → neutral 50, no data", () => {
    const r = getCommunicationScore();
    expect(r.percent).toBe(50);
    expect(r.hasData).toBe(false);
  });
  it("SLA bands on the decision target (48h)", () => {
    const p = (hrs) => getCommunicationScore({ avgApplicationDecisionHrs: hrs }).percent; // richness null → 50
    expect(p(48)).toBe(85); // 100 → .7*100 + .3*50
    expect(p(96)).toBe(64); // 70
    expect(p(192)).toBe(43); // 40
    expect(p(300)).toBe(22); // 10
  });
  it("richness contributes (0 vs 1), hasData when richness present", () => {
    expect(getCommunicationScore({ feedbackRichnessRatio: 0 }).percent).toBe(35); // response neutral 50 → 35 + 0
    expect(getCommunicationScore({ feedbackRichnessRatio: 1 }).percent).toBe(65); // 35 + 30
    expect(getCommunicationScore({ feedbackRichnessRatio: 0 }).hasData).toBe(true);
  });
});

describe("getEngagementScore", () => {
  const full = { categories: ["A"], short_description: "x", logo_url: "l", website_url: "w", contact_email: "e", contact_phone: "p", linkedin_url: "in" };
  it("everything fresh → 100", () => {
    expect(getEngagementScore({ lastLoginAt: iso(1 * DAY), campaignsLast90d: 3, profile: full }).percent).toBe(100);
  });
  it("login recency bands", () => {
    const login = (msAgo) => getEngagementScore({ lastLoginAt: iso(msAgo), campaignsLast90d: 0, profile: null }).loginScore;
    expect(login(1 * DAY)).toBe(100);
    expect(login(8 * DAY)).toBe(85);
    expect(login(45 * DAY)).toBe(65);
    expect(login(75 * DAY)).toBe(45);
    expect(login(120 * DAY)).toBe(25);
    expect(login(300 * DAY)).toBe(10);
  });
  it("no login / future login → neutral 50", () => {
    expect(getEngagementScore({ campaignsLast90d: 0 }).loginScore).toBe(50);
    expect(getEngagementScore({ lastLoginAt: iso(-1 * DAY) }).loginScore).toBe(50); // future
  });
  it("activity tiers", () => {
    const act = (n) => getEngagementScore({ campaignsLast90d: n }).activityScore;
    expect(act(3)).toBe(100);
    expect(act(2)).toBe(80);
    expect(act(1)).toBe(60);
    expect(act(0)).toBe(30);
  });
});

describe("computeBrandTrustScore", () => {
  const maxInputs = (finalAcceptedCount) => ({
    profile: { categories: ["A"], short_description: "x", logo_url: "l", website_url: "w", contact_email: "e", contact_phone: "p", linkedin_url: "in" },
    reviews: [{ target_rating: 5, brief_clarity: 5, fairness: 5, feedback_quality: 5, created_at: iso() }],
    execution: { approvedCount: finalAcceptedCount, finalAcceptedCount, abandonedAfterApproval: 0, reachedDraftCount: finalAcceptedCount, totalRevisions: finalAcceptedCount * 2 },
    verification: { emailVerified: true, phoneVerified: true, pan: PAN, gstin: GSTIN },
    communication: { avgApplicationDecisionHrs: 1, avgNegotiationHrs: 1, avgDraftFeedbackHrs: 1, avgFinalAcceptanceHrs: 1, feedbackRichnessRatio: 1 },
    engagement: { lastLoginAt: iso(1 * DAY), campaignsLast90d: 3 },
  });

  it("cold-start caps a perfect brand at 720 (final < 3)", () => {
    const r = computeBrandTrustScore(maxInputs(2));
    expect(r.overallPercent).toBe(100);
    expect(r.coldStart).toBe(true);
    expect(r.score).toBe(720);
    expect(r.band).toBe("Established");
    expect(r.scaleMin).toBe(300);
    expect(r.scaleMax).toBe(900);
  });
  it("no cold-start (final ≥ 3) → 900 / Elite", () => {
    const r = computeBrandTrustScore(maxInputs(3));
    expect(r.coldStart).toBe(false);
    expect(r.score).toBe(900);
    expect(r.band).toBe("Elite");
  });
  it("penalty is clamped at 400", () => {
    const r = computeBrandTrustScore({ ...maxInputs(3), penaltyPoints: 1000 });
    expect(r.penaltyApplied).toBe(400);
    expect(r.score).toBe(500); // 900 - 400
    expect(r.band).toBe("Building Trust");
  });
  it("score is floored at 300", () => {
    const r = computeBrandTrustScore({ penaltyPoints: 1000 }); // weak pillars + big penalty
    expect(r.score).toBe(300);
    expect(r.penaltyApplied).toBe(400);
  });
  it("GSTIN falls back to profile.gstin for verification", () => {
    const r = computeBrandTrustScore({ profile: { gstin: GSTIN }, verification: { emailVerified: false, phoneVerified: false } });
    expect(r.breakdown.verification.items.panProvided).toBe(true);
    expect(r.breakdown.verification.items.gstinVerified).toBe(true);
  });
});

describe("getCampaignDeliveryRatio (legacy shim)", () => {
  it("0/0 → 0; all complete → 100; mixed → 50", () => {
    expect(getCampaignDeliveryRatio().percent).toBe(0);
    expect(getCampaignDeliveryRatio({ completedCount: 3 }).percent).toBe(100);
    expect(getCampaignDeliveryRatio({ completedCount: 1, staleCount: 1 }).percent).toBe(50);
  });
});
