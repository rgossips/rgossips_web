import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import {
  formatFeatureValue,
  isWithinTrial,
  trialDaysLeft,
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

const NOW = Date.parse("2026-06-01T00:00:00.000Z");
const DAY = 86_400_000;
const daysAgo = (n) => new Date(NOW - n * DAY).toISOString();

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(NOW));
});
afterAll(() => jest.useRealTimers());

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
});

describe("isWithinTrial", () => {
  it("null / no date / invalid → false", () => {
    expect(isWithinTrial(null)).toBe(false);
    expect(isWithinTrial({})).toBe(false);
    expect(isWithinTrial({ created_at: "not-a-date" })).toBe(false);
  });
  it("explicit paid plan → false regardless of age", () => {
    expect(isWithinTrial({ subscription_plan: "pro", created_at: daysAgo(1) })).toBe(false);
  });
  it("boundaries: day 0 / 29 → true; day 30 / future → false", () => {
    expect(isWithinTrial({ created_at: daysAgo(0) })).toBe(true);
    expect(isWithinTrial({ created_at: daysAgo(29) })).toBe(true);
    expect(isWithinTrial({ created_at: daysAgo(30) })).toBe(false);
    expect(isWithinTrial({ created_at: daysAgo(-1) })).toBe(false); // future
  });
  it("'trial' plan string still counts, updated_at fallback works", () => {
    expect(isWithinTrial({ subscription_plan: "trial", updated_at: daysAgo(5) })).toBe(true);
  });
});

describe("trialDaysLeft", () => {
  it("counts down and floors at 0", () => {
    expect(trialDaysLeft({ created_at: daysAgo(0) })).toBe(30);
    expect(trialDaysLeft({ created_at: daysAgo(15) })).toBe(15);
    expect(trialDaysLeft({ created_at: daysAgo(30) })).toBe(0);
    expect(trialDaysLeft({ created_at: daysAgo(40) })).toBe(0);
    expect(trialDaysLeft(null)).toBe(0);
    expect(trialDaysLeft({})).toBe(0);
    expect(trialDaysLeft({ created_at: "not-a-date" })).toBe(0); // invalid → 0
  });
  it("uses updated_at when created_at is absent", () => {
    expect(trialDaysLeft({ updated_at: daysAgo(10) })).toBe(20);
  });
});

describe("getEffectivePlan", () => {
  it("null → starter", () => expect(getEffectivePlan(null)).toBe("starter"));
  it("explicit tiers (case-insensitive)", () => {
    expect(getEffectivePlan({ subscription_plan: "pro" })).toBe("pro");
    expect(getEffectivePlan({ subscription_plan: "ELITE" })).toBe("elite");
    expect(getEffectivePlan({ subscription_plan: "starter" })).toBe("starter");
  });
  it("in-trial (no explicit plan) → pro", () => {
    expect(getEffectivePlan({ created_at: daysAgo(3) })).toBe("pro");
    expect(getEffectivePlan({ subscription_plan: "trial", created_at: daysAgo(3) })).toBe("pro");
  });
  it("unknown plan or expired trial → starter", () => {
    expect(getEffectivePlan({ subscription_plan: "gold" })).toBe("starter");
    expect(getEffectivePlan({ created_at: daysAgo(40) })).toBe("starter");
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
  it("unknown key → false / null", () => {
    expect(hasFeature("starter", "nope")).toBe(false);
    expect(getFeatureValue("starter", "nope")).toBeNull();
  });
  it("raw tiered values", () => {
    expect(getFeatureValue("starter", "campaign_applications_limit")).toBe(3);
    expect(getFeatureValue("pro", "campaign_applications_limit")).toBe(15);
    expect(getFeatureValue("elite", "campaign_applications_limit")).toBe(Infinity);
  });
  it("profile wrappers resolve the plan (trial → pro features)", () => {
    expect(profileHasFeature({ created_at: daysAgo(3) }, "ai_match_coach")).toBe(true); // pro-only, granted in trial
    expect(profileHasFeature(null, "ai_match_coach")).toBe(false); // starter
    expect(profileFeatureValue({ subscription_plan: "elite" }, "ai_generations_limit")).toBe(Infinity);
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
  it("profile wrapper (trial → pro can use pro templates)", () => {
    expect(profileCanUseMediaKitTemplate({ created_at: daysAgo(3) }, "editorial_noir")).toBe(true);
    expect(profileCanUseMediaKitTemplate({ subscription_plan: "starter" }, "editorial_noir")).toBe(false);
  });
  it("change limits per plan", () => {
    expect(getMediaKitTemplateChangeLimit("starter")).toBe(0);
    expect(getMediaKitTemplateChangeLimit("pro")).toBe(3);
    expect(getMediaKitTemplateChangeLimit("elite")).toBe(Infinity);
    expect(getMediaKitTemplateChangeLimit("unknown")).toBe(0);
  });
  it("getProfileTemplateChangeUsage (elite ∞, pro over-limit clamp, camelCase)", () => {
    expect(getProfileTemplateChangeUsage({ subscription_plan: "elite", media_kit_template_changes: 5 })).toEqual({
      used: 5, limit: Infinity, remaining: Infinity, plan: "elite",
    });
    expect(getProfileTemplateChangeUsage({ subscription_plan: "pro", media_kit_template_changes: 5 })).toEqual({
      used: 5, limit: 3, remaining: 0, plan: "pro",
    });
    expect(getProfileTemplateChangeUsage({ subscription_plan: "pro", mediaKitTemplateChanges: 1 }).remaining).toBe(2);
    expect(getProfileTemplateChangeUsage({ subscription_plan: "starter" }).used).toBe(0);
  });
});

describe("getAiUsageStatus", () => {
  it("per-plan quotas, clamping and default arg", () => {
    expect(getAiUsageStatus({ subscription_plan: "starter" })).toEqual({ used: 0, limit: 25, remaining: 25, unlimited: false, plan: "starter" });
    expect(getAiUsageStatus({ subscription_plan: "pro" }, 100)).toEqual({ used: 100, limit: 150, remaining: 50, unlimited: false, plan: "pro" });
    const elite = getAiUsageStatus({ subscription_plan: "elite" }, 999);
    expect(elite.unlimited).toBe(true);
    expect(elite.remaining).toBe(Infinity);
    expect(getAiUsageStatus({ subscription_plan: "starter" }, 30).remaining).toBe(0); // over-limit clamp
  });
});
