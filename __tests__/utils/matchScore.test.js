import { describe, it, expect } from "@jest/globals";
import {
  explainBrandMatch,
  calculateBrandMatchScore,
  scoreCampaignForUser,
  explainCampaignMatch,
  calculateCampaignMatchScore,
} from "@/utils/matchScore";

// ── fixture builders ──────────────────────────────────────────────
const profile = (o = {}) => ({ categories: ["Beauty & Skincare"], ...o });
const brand = (o = {}) => ({ category: "Beauty", platforms: ["instagram"], ...o });
const campaign = (o = {}) => ({ tags: ["Beauty & Skincare"], ...o });
const pts = (bd, key) => bd.find((b) => b.key === key)?.points;
const status = (bd, key) => bd.find((b) => b.key === key)?.status;

describe("explainBrandMatch", () => {
  it("null profile → zero, empty breakdown", () => {
    expect(explainBrandMatch(null, brand())).toEqual({ score: 0, breakdown: [] });
    expect(explainBrandMatch(undefined, brand())).toEqual({ score: 0, breakdown: [] });
  });

  it("all-strong brand → 100 (40+25+20+15)", () => {
    const r = explainBrandMatch(
      profile({ instagram_handle: "x", followers_count: 20000 }),
      brand({ isVerified: true, rating: 4.8 }),
    );
    expect(r.score).toBe(100);
    expect(pts(r.breakdown, "category")).toBe(40);
    expect(pts(r.breakdown, "platform")).toBe(25);
    expect(pts(r.breakdown, "reach")).toBe(20);
    expect(pts(r.breakdown, "quality")).toBe(15);
    expect(status(r.breakdown, "category")).toBe("strong");
  });

  it("category via CATEGORY_MAP overlap vs no-overlap (40 vs 10)", () => {
    expect(pts(explainBrandMatch(profile(), brand({ category: "Beauty" })).breakdown, "category")).toBe(40);
    const none = explainBrandMatch(profile({ categories: ["Automobile & Mobility"] }), brand({ category: "Beauty" }));
    expect(pts(none.breakdown, "category")).toBe(10);
    expect(status(none.breakdown, "category")).toBe("weak");
  });

  it("category via first-word substring path", () => {
    const r = explainBrandMatch(profile({ categories: ["Fashion & Lifestyle"] }), brand({ category: "Fashion Trends" }));
    expect(pts(r.breakdown, "category")).toBe(40);
  });

  it("no brand.category still yields base 10", () => {
    const r = explainBrandMatch(profile(), brand({ category: "" }));
    expect(pts(r.breakdown, "category")).toBe(10);
  });

  it("platform: 25 only with instagram in platforms AND a handle (snake or camel)", () => {
    expect(pts(explainBrandMatch(profile({ instagram_handle: "a" }), brand()).breakdown, "platform")).toBe(25);
    expect(pts(explainBrandMatch(profile({ instagramHandle: "a" }), brand()).breakdown, "platform")).toBe(25);
    expect(pts(explainBrandMatch(profile(), brand()).breakdown, "platform")).toBe(5); // no handle
    expect(pts(explainBrandMatch(profile({ instagram_handle: "a" }), brand({ platforms: [] })).breakdown, "platform")).toBe(5);
  });

  it("reach boundaries (20/15/10/5)", () => {
    const reach = (n) => pts(explainBrandMatch(profile({ followers_count: n }), brand()).breakdown, "reach");
    expect(reach(10000)).toBe(20);
    expect(reach(9999)).toBe(15);
    expect(reach(5000)).toBe(15);
    expect(reach(4999)).toBe(10);
    expect(reach(1000)).toBe(10);
    expect(reach(999)).toBe(5);
    expect(reach(0)).toBe(5);
    expect(pts(explainBrandMatch(profile(), brand()).breakdown, "reach")).toBe(5); // undefined
    expect(pts(explainBrandMatch(profile({ followersCount: 20000 }), brand()).breakdown, "reach")).toBe(20); // camelCase
  });

  it("brand quality combinations (verified + rating tiers)", () => {
    const q = (o) => pts(explainBrandMatch(profile(), brand(o)).breakdown, "quality");
    expect(q({})).toBe(0);
    expect(q({ isVerified: true })).toBe(8);
    expect(q({ rating: 4.5 })).toBe(7);
    expect(q({ rating: 4.49 })).toBe(4);
    expect(q({ rating: 4.0 })).toBe(4);
    expect(q({ rating: 3.99 })).toBe(0);
    expect(q({ isVerified: true, rating: 4.5 })).toBe(15);
    expect(q({ isVerified: true, rating: 4.0 })).toBe(12);
  });

  it("band() thresholds strong/ok/weak", () => {
    // reach: 20=strong(≥15), 15=strong(≥15), 10=ok(≥9), 5=weak
    expect(status(explainBrandMatch(profile({ followers_count: 10000 }), brand()).breakdown, "reach")).toBe("strong");
    expect(status(explainBrandMatch(profile({ followers_count: 1000 }), brand()).breakdown, "reach")).toBe("ok");
    expect(status(explainBrandMatch(profile({ followers_count: 0 }), brand()).breakdown, "reach")).toBe("weak");
  });
});

describe("calculateBrandMatchScore", () => {
  it("null → 0; else mirrors explain score", () => {
    expect(calculateBrandMatchScore(null, brand())).toBe(0);
    const p = profile({ instagram_handle: "x", followers_count: 20000 });
    expect(calculateBrandMatchScore(p, brand({ isVerified: true, rating: 4.8 }))).toBe(
      explainBrandMatch(p, brand({ isVerified: true, rating: 4.8 })).score,
    );
  });
});

describe("scoreCampaignForUser", () => {
  it("null profile → {0,0}", () => {
    expect(scoreCampaignForUser(null, campaign())).toEqual({ score: 0, categoryTier: 0 });
  });

  it("category tiers → points 65/45/28/10", () => {
    // exact (3)
    expect(scoreCampaignForUser(profile(), campaign({ tags: ["Beauty & Skincare"] })).categoryTier).toBe(3);
    // partial (2): user "beauty & skincare" contains tag "beauty"
    expect(scoreCampaignForUser(profile(), campaign({ tags: ["Beauty"] })).categoryTier).toBe(2);
    // indirect (1): related-category adjacency
    expect(
      scoreCampaignForUser(profile({ categories: ["Education & Career"] }), campaign({ tags: ["Entrepreneurship & Business"] }))
        .categoryTier,
    ).toBe(1);
    // none (0)
    expect(scoreCampaignForUser(profile(), campaign({ tags: ["Automobile & Mobility"] })).categoryTier).toBe(0);
    // empty categories → 0
    expect(scoreCampaignForUser(profile({ categories: [] }), campaign()).categoryTier).toBe(0);
  });

  it("budget branch: no data → neutral (+20)", () => {
    // exact tier (65) + neutral (20) = 85
    expect(scoreCampaignForUser(profile(), campaign({ tags: ["Beauty & Skincare"] })).score).toBe(85);
  });

  it("budget boundaries against the creator's reel rate", () => {
    const p = profile({ service_rates: { reels: 10000 }, categories: ["Beauty & Skincare"] });
    const s = (budget) => scoreCampaignForUser(p, campaign({ tags: ["Beauty & Skincare"], budget })).score;
    expect(s("₹10,000")).toBe(100); // ≥ rate → +35 → 65+35
    expect(s("₹6,000")).toBe(89); // ≥ 0.6× rate → +24 → 65+24
    expect(s("₹5,999")).toBe(75); // below → +10 → 65+10
  });

  it("parseBudgetMidpoint (indirectly): ranges, suffixes, commas, junk", () => {
    const p = profile({ service_rates: { reels: 10000 } });
    const c = (budget) => campaign({ tags: ["Automobile & Mobility"], budget }); // tier 0 → base 10
    // range midpoint 10000 ≥ rate → +35 → 45
    expect(scoreCampaignForUser(p, c("₹5K-15K")).score).toBe(45);
    expect(scoreCampaignForUser(p, c("₹5K–15K")).score).toBe(45); // en-dash
    // "₹2.5L" = 250000 ≥ rate → 45
    expect(scoreCampaignForUser(p, c("₹2.5L")).score).toBe(45);
    // "₹3,500" = 3500 < 0.6*10000 → +10 → 20
    expect(scoreCampaignForUser(p, c("₹3,500")).score).toBe(20);
    // junk / empty → parsed 0 → neutral +20 → 30
    expect(scoreCampaignForUser(p, c("abc")).score).toBe(30);
    expect(scoreCampaignForUser(p, c("")).score).toBe(30);
  });

  it("score is clamped to ≤100 and rounded", () => {
    const p = profile({ service_rates: { reels: 1 } });
    const r = scoreCampaignForUser(p, campaign({ tags: ["Beauty & Skincare"], budget: "₹99,999" }));
    expect(r.score).toBe(100); // 65 + 35
    expect(Number.isInteger(r.score)).toBe(true);
  });
});

describe("explainCampaignMatch", () => {
  const strongProfile = profile({
    categories: ["Beauty & Skincare"],
    engagement_rate: 7,
    services: ["reels", "stories"],
    city: "Mumbai",
    instagram_handle: "x",
    followers_count: 20000,
  });
  const strongCampaign = campaign({
    tags: ["Beauty & Skincare"],
    deliverables: "2 Reels + 2 Stories",
    location: "Mumbai",
    platforms: ["instagram"],
  });

  it("null profile → zero", () => {
    expect(explainCampaignMatch(null, strongCampaign)).toEqual({ score: 0, breakdown: [] });
  });

  it("all-strong campaign → high score with expected sub-points", () => {
    const r = explainCampaignMatch(strongProfile, strongCampaign);
    expect(pts(r.breakdown, "category")).toBe(40);
    expect(pts(r.breakdown, "engagement")).toBe(15);
    expect(pts(r.breakdown, "deliverables")).toBe(15);
    expect(pts(r.breakdown, "location")).toBe(10);
    expect(pts(r.breakdown, "platform")).toBe(8);
    expect(pts(r.breakdown, "reach")).toBe(10);
    expect(r.score).toBe(98);
  });

  it("category: 0 tags → open (12); partial fraction; none", () => {
    expect(pts(explainCampaignMatch(strongProfile, campaign({ tags: [] })).breakdown, "category")).toBe(12);
    // 1 of 2 tags matches → round(0.5*40)=20
    const partial = explainCampaignMatch(strongProfile, campaign({ tags: ["Beauty & Skincare", "Automobile & Mobility"] }));
    expect(pts(partial.breakdown, "category")).toBe(20);
    const none = explainCampaignMatch(profile({ categories: ["Automobile & Mobility"] }), campaign({ tags: ["Beauty & Skincare"] }));
    expect(pts(none.breakdown, "category")).toBe(0);
  });

  it("engagement boundaries (8 for none / 15 / 11 / 7 / 4)", () => {
    const er = (v) => pts(explainCampaignMatch(profile({ engagement_rate: v }), campaign()).breakdown, "engagement");
    expect(er(0)).toBe(8); // falsy → "not synced"
    expect(er(6)).toBe(15);
    expect(er(3)).toBe(11);
    expect(er(1.5)).toBe(7);
    expect(er(1)).toBe(4);
    expect(pts(explainCampaignMatch(profile({ engagementRate: 6 }), campaign()).breakdown, "engagement")).toBe(15); // camelCase
  });

  it("deliverables vs services (multi/single/zero + video→ugc, stor→stories)", () => {
    const del = (services, deliverables) => pts(explainCampaignMatch(profile({ services }), campaign({ deliverables })).breakdown, "deliverables");
    expect(del(["reels", "stories"], "2 Reels + 2 Stories")).toBe(15);
    expect(del(["reels"], "2 Reels")).toBe(9);
    expect(del([], "2 Reels")).toBe(4);
    expect(del(["ugc"], "1 Video")).toBe(9); // video → ugc
    expect(del(["stories"], "3 Stories")).toBe(9); // stor → stories
  });

  it("location: open / no-user-loc / substring / mismatch", () => {
    const loc = (campLoc, userLoc) =>
      pts(explainCampaignMatch(profile({ location: userLoc }), campaign({ location: campLoc })).breakdown, "location");
    expect(loc("All India", "Delhi")).toBe(10); // open keyword
    expect(loc("", "Delhi")).toBe(10); // no campaign location → open
    expect(loc("Mumbai", "")).toBe(6); // campaign targets, user has none
    expect(loc("Mumbai", "Mumbai")).toBe(10); // exact substring
    expect(loc("MUMBAI", "  mumbai ")).toBe(10); // case + trim
    expect(loc("Mumbai", "Delhi")).toBe(4); // mismatch
  });

  it("platform: ig / yt / both / neither", () => {
    const plat = (p, c) => pts(explainCampaignMatch(p, campaign({ platforms: c })).breakdown, "platform");
    expect(plat(profile({ instagram_handle: "x" }), ["instagram"])).toBe(8);
    expect(plat(profile({ services: ["shorts"] }), ["youtube"])).toBe(2);
    expect(plat(profile({ instagram_handle: "x", services: ["shorts"] }), ["instagram", "youtube"])).toBe(10);
    expect(plat(profile(), ["tiktok"])).toBe(3); // neither → base 3
  });

  it("reach boundaries (10/8/6/3)", () => {
    const reach = (n) => pts(explainCampaignMatch(profile({ followers_count: n }), campaign()).breakdown, "reach");
    expect(reach(10000)).toBe(10);
    expect(reach(5000)).toBe(8);
    expect(reach(4999)).toBe(6);
    expect(reach(1000)).toBe(6);
    expect(reach(999)).toBe(3);
    expect(reach(0)).toBe(3);
  });
});

describe("calculateCampaignMatchScore", () => {
  it("null → 0; else mirrors explain score", () => {
    expect(calculateCampaignMatchScore(null, campaign())).toBe(0);
    const p = profile({ engagement_rate: 5 });
    expect(calculateCampaignMatchScore(p, campaign())).toBe(explainCampaignMatch(p, campaign()).score);
  });
});
