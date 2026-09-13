import { describe, it, expect } from "@jest/globals";
import {
  formatFeatureValue,
  isSubscribed,
  getFreeApplicationStatus,
  FREE_BARTER_APPLICATIONS,
  FEATURE_MATRIX,
  getEffectivePlan,
  hasFeature,
  getFeatureValue,
  profileHasFeature,
  profileFeatureValue,
  canUseMediaKitTemplate,
  profileCanUseMediaKitTemplate,
  getMediaKitTemplateChangeLimit,
  getProfileTemplateChangeUsage,
  getAiUsageStatus,
} from "@/lib/plans";

// Signup age used to decide entitlement. It no longer does — these dates are
// kept only so the "age buys nothing" cases are asserted explicitly rather
// than implied by their absence.
const DAY = 86_400_000;
const daysAgo = (n) => new Date(Date.now() - n * DAY).toISOString();

describe("formatFeatureValue", () => {
  it("covers every value shape", () => {
    expect(formatFeatureValue(true)).toBe("✓");
    expect(formatFeatureValue(false)).toBe("—");
    expect(formatFeatureValue(undefined)).toBe("—");
    expect(formatFeatureValue(null)).toBe("—");
    expect(formatFeatureValue(Infinity)).toBe("Unlimited");
    expect(formatFeatureValue(25)).toBe("25/month");
    expect(formatFeatureValue(0)).toBe("0/month");
    expect(formatFeatureValue("monthly")).toBe("Monthly");
    expect(formatFeatureValue("Classic only")).toBe("Classic only");
    expect(formatFeatureValue({})).toBe("[object Object]"); // fallback String()
  });

  it("relabels the free applications cell — lifetime and barter-only", () => {
    // "3/month" would misdescribe it in two separate ways.
    expect(formatFeatureValue(3, { plan: "free", key: "campaign_applications_limit" })).toBe(
      "3 barter, one-time",
    );
    // Every other free cell still gets the generic formatting.
    expect(formatFeatureValue(0, { plan: "free", key: "ai_generations_limit" })).toBe("0/month");
    // The override is scoped to the free column.
    expect(formatFeatureValue(3, { plan: "starter", key: "campaign_applications_limit" })).toBe(
      "3/month",
    );
  });
});

describe("isSubscribed", () => {
  it("only the three paid tiers count", () => {
    expect(isSubscribed({ subscription_plan: "starter" })).toBe(true);
    expect(isSubscribed({ subscription_plan: "pro" })).toBe(true);
    expect(isSubscribed({ subscription_plan: "ELITE" })).toBe(true);
  });

  it("everything else is free, including the legacy trial string", () => {
    // Most existing rows literally store "trial" — it was the signup default.
    // The trial is gone, so that string must buy nothing, and neither must a
    // recent created_at.
    expect(isSubscribed({ subscription_plan: "trial", created_at: daysAgo(1) })).toBe(false);
    expect(isSubscribed({ subscription_plan: "free" })).toBe(false);
    expect(isSubscribed({ subscription_plan: "gold" })).toBe(false);
    expect(isSubscribed({ created_at: daysAgo(0) })).toBe(false);
    expect(isSubscribed({})).toBe(false);
    expect(isSubscribed(null)).toBe(false);
  });
});

describe("getFreeApplicationStatus", () => {
  it("counts down the lifetime allowance and clamps at zero", () => {
    expect(getFreeApplicationStatus({}, 0)).toEqual({
      subscribed: false,
      used: 0,
      limit: 3,
      remaining: 3,
      exhausted: false,
    });
    expect(getFreeApplicationStatus({}, 2).remaining).toBe(1);
    expect(getFreeApplicationStatus({}, 3).exhausted).toBe(true);
    expect(getFreeApplicationStatus({}, 9).remaining).toBe(0);
  });

  it("a subscriber is never exhausted", () => {
    const status = getFreeApplicationStatus({ subscription_plan: "starter" }, 99);
    expect(status.subscribed).toBe(true);
    expect(status.remaining).toBe(Infinity);
    expect(status.exhausted).toBe(false);
  });

  it("the advertised allowance is three", () => {
    expect(FREE_BARTER_APPLICATIONS).toBe(3);
  });
});

describe("getEffectivePlan", () => {
  it("null becomes free", () => expect(getEffectivePlan(null)).toBe("free"));

  it("explicit tiers, case-insensitive", () => {
    expect(getEffectivePlan({ subscription_plan: "pro" })).toBe("pro");
    expect(getEffectivePlan({ subscription_plan: "ELITE" })).toBe("elite");
    expect(getEffectivePlan({ subscription_plan: "starter" })).toBe("starter");
  });

  it("no trial: signup age buys nothing", () => {
    expect(getEffectivePlan({ created_at: daysAgo(3) })).toBe("free");
    expect(getEffectivePlan({ subscription_plan: "trial", created_at: daysAgo(3) })).toBe("free");
    expect(getEffectivePlan({ created_at: daysAgo(40) })).toBe("free");
  });

  it("unknown plan becomes free", () => {
    expect(getEffectivePlan({ subscription_plan: "gold" })).toBe("free");
  });
});

describe("hasFeature / getFeatureValue", () => {
  it("boolean, numeric, string and Infinity cells", () => {
    expect(hasFeature("starter", "campaign_applications_limit")).toBe(true); // 3 > 0
    expect(hasFeature("elite", "ai_generations_limit")).toBe(true); // Infinity
    expect(hasFeature("starter", "discovery_priority")).toBe(false); // false cell
    expect(hasFeature("pro", "analytics_fake_follower_audit")).toBe(true); // "monthly"
    expect(hasFeature("starter", "media_kit_designer_templates")).toBe(true); // "Classic only"
  });

  it("unknown key becomes false / null", () => {
    expect(hasFeature("starter", "nope")).toBe(false);
    expect(getFeatureValue("starter", "nope")).toBeNull();
  });

  it("raw tiered values", () => {
    expect(getFeatureValue("starter", "campaign_applications_limit")).toBe(3);
    expect(getFeatureValue("pro", "campaign_applications_limit")).toBe(15);
    expect(getFeatureValue("elite", "campaign_applications_limit")).toBe(Infinity);
  });

  it("free unlocks the barter applications and discovery, nothing else", () => {
    expect(getFeatureValue("free", "campaign_applications_limit")).toBe(3);
    expect(hasFeature("free", "discovery_listed")).toBe(true);
    expect(hasFeature("free", "badge_verified_eligible")).toBe(true);
    // Everything a creator would be paying for is off.
    expect(getFeatureValue("free", "ai_generations_limit")).toBe(0);
    expect(getFeatureValue("free", "brand_dms_limit")).toBe(0);
    expect(hasFeature("free", "ai_content_studio")).toBe(false);
    expect(hasFeature("free", "media_kit_share_link")).toBe(false);
    expect(hasFeature("free", "media_kit_designer_templates")).toBe(false);
    expect(hasFeature("free", "analytics_basic")).toBe(false);
    expect(hasFeature("free", "early_access_deals")).toBe(false);
    expect(hasFeature("free", "support_priority")).toBe(false);
  });

  it("a feature added later defaults to locked on free", () => {
    // The free column is derived from an allowlist, so omission means denied.
    // This pins the whole allowlist: if it ever grows by accident, a paid
    // feature has silently become free and this fails.
    const unlocked = Object.entries(FEATURE_MATRIX)
      .filter(([, row]) => row.free !== false && row.free !== 0)
      .map(([key]) => key)
      .sort();
    expect(unlocked).toEqual([
      "badge_verified_eligible",
      "campaign_applications_limit",
      "discovery_listed",
      "support_standard",
    ]);
  });

  it("profile wrappers resolve the plan", () => {
    expect(profileHasFeature({ created_at: daysAgo(3) }, "ai_match_coach")).toBe(false);
    expect(profileHasFeature(null, "ai_match_coach")).toBe(false);
    expect(profileHasFeature({ subscription_plan: "pro" }, "ai_match_coach")).toBe(true);
    expect(profileFeatureValue({ subscription_plan: "elite" }, "ai_generations_limit")).toBe(
      Infinity,
    );
  });
});

describe("media-kit template access + change limits", () => {
  it("rank gating", () => {
    expect(canUseMediaKitTemplate("starter", "classic")).toBe(true);
    expect(canUseMediaKitTemplate("starter", "glass_blue")).toBe(false);
    expect(canUseMediaKitTemplate("pro", "editorial_noir")).toBe(true);
    expect(canUseMediaKitTemplate("elite", "neo_brutalist")).toBe(true);
    expect(canUseMediaKitTemplate("starter", "does_not_exist")).toBe(false);
    expect(canUseMediaKitTemplate("unknown", "classic")).toBe(false); // rank 0
  });

  it("an unsubscribed creator can use no template at all", () => {
    // The media kit is a subscriber feature. Free holds no rank, so every
    // template — Classic included — sits above it.
    expect(canUseMediaKitTemplate("free", "classic")).toBe(false);
    expect(getMediaKitTemplateChangeLimit("free")).toBe(0);
    expect(profileCanUseMediaKitTemplate({ created_at: daysAgo(3) }, "classic")).toBe(false);
    expect(profileCanUseMediaKitTemplate({ subscription_plan: "trial" }, "editorial_noir")).toBe(
      false,
    );
    // A paid plan still behaves exactly as before.
    expect(profileCanUseMediaKitTemplate({ subscription_plan: "starter" }, "classic")).toBe(true);
    expect(profileCanUseMediaKitTemplate({ subscription_plan: "starter" }, "editorial_noir")).toBe(
      false,
    );
  });

  it("change limits per plan", () => {
    expect(getMediaKitTemplateChangeLimit("starter")).toBe(0);
    expect(getMediaKitTemplateChangeLimit("pro")).toBe(3);
    expect(getMediaKitTemplateChangeLimit("elite")).toBe(Infinity);
    expect(getMediaKitTemplateChangeLimit("unknown")).toBe(0);
  });

  it("getProfileTemplateChangeUsage (elite unlimited, pro over-limit clamp, camelCase)", () => {
    expect(
      getProfileTemplateChangeUsage({ subscription_plan: "elite", media_kit_template_changes: 5 }),
    ).toEqual({ used: 5, limit: Infinity, remaining: Infinity, plan: "elite" });
    expect(
      getProfileTemplateChangeUsage({ subscription_plan: "pro", media_kit_template_changes: 5 }),
    ).toEqual({ used: 5, limit: 3, remaining: 0, plan: "pro" });
    expect(
      getProfileTemplateChangeUsage({ subscription_plan: "pro", mediaKitTemplateChanges: 1 })
        .remaining,
    ).toBe(2);
    expect(getProfileTemplateChangeUsage({ subscription_plan: "starter" }).used).toBe(0);
  });
});

describe("getAiUsageStatus", () => {
  it("per-plan quotas, clamping and default arg", () => {
    expect(getAiUsageStatus({ subscription_plan: "starter" })).toEqual({
      used: 0,
      limit: 25,
      remaining: 25,
      unlimited: false,
      plan: "starter",
    });
    expect(getAiUsageStatus({ subscription_plan: "pro" }, 100)).toEqual({
      used: 100,
      limit: 150,
      remaining: 50,
      unlimited: false,
      plan: "pro",
    });
    const elite = getAiUsageStatus({ subscription_plan: "elite" }, 999);
    expect(elite.unlimited).toBe(true);
    expect(elite.remaining).toBe(Infinity);
    expect(getAiUsageStatus({ subscription_plan: "starter" }, 30).remaining).toBe(0); // clamp
  });

  it("free has no AI quota to spend", () => {
    expect(getAiUsageStatus({ subscription_plan: "trial" })).toEqual({
      used: 0,
      limit: 0,
      remaining: 0,
      unlimited: false,
      plan: "free",
    });
  });
});
