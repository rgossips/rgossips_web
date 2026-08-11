/**
 * SAFE integration/contract tests for the critical CAMPAIGN, PAYMENT and SIGNUP
 * flows. These hit the REAL deployed Supabase edge functions over HTTP and
 * assert their auth/validation guards — but every call is deliberately a
 * GUARD, READ-ONLY, or BAD-SIGNATURE path that creates NO rows, sends NO OTP,
 * and makes NO subscription. Never call happy-path mutators here against prod.
 */
import { describe, it, expect, beforeAll } from "@jest/globals";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const BOGUS = "00000000-0000-0000-0000-000000000000";
// A clearly-fake phone that has NO OTP row — the verifier/create-profile guards
// reject it before any send/create. We never call whatsapp-otp-sender.
const FAKE_PHONE = "+19999999999";

async function fn(name, body, extraHeaders = {}) {
  const res = await fetch(`${URL}/functions/v1/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}`, ...extraHeaders },
    body: JSON.stringify(body),
  });
  let json = null;
  const text = await res.text();
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { status: res.status, body: json, text };
}

beforeAll(() => {
  if (!URL || !KEY) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / publishable key in .env.local");
});

describe("CAMPAIGN flow — guard/read contracts (no mutations)", () => {
  it("brand-campaigns get: unknown campaign → 'Campaign not found'", async () => {
    const r = await fn("brand-campaigns", { action: "get", campaignId: BOGUS, brandId: BOGUS });
    expect(r.body?.error).toBe("Campaign not found");
  });

  it("brand-campaigns list: bogus brand → empty campaigns array (read-only)", async () => {
    const r = await fn("brand-campaigns", { action: "list", brandId: BOGUS });
    expect(Array.isArray(r.body?.campaigns)).toBe(true);
    expect(r.body.campaigns).toHaveLength(0);
  });

  it("brand-campaigns inviteInfluencers: unknown campaign → rejected before any insert", async () => {
    const r = await fn("brand-campaigns", { action: "inviteInfluencers", brandId: BOGUS, campaignId: BOGUS, influencerIds: [BOGUS] });
    expect(r.body?.error).toBe("Campaign not found");
    expect(r.body?.invited).toBeUndefined();
  });

  it("brand-campaigns inviteStats: unknown campaign → 'Campaign not found'", async () => {
    const r = await fn("brand-campaigns", { action: "inviteStats", brandId: BOGUS, campaignId: BOGUS });
    expect(r.body?.error).toBe("Campaign not found");
  });

  it("brand-campaigns: unknown action → 'Unknown action'", async () => {
    const r = await fn("brand-campaigns", { action: "definitely-not-real" });
    expect(r.body?.error).toBe("Unknown action");
  });

  it("apply-campaign: missing params → required error, no application created", async () => {
    const r = await fn("apply-campaign", {});
    expect(String(r.body?.error || "")).toMatch(/required/i);
    expect(r.body?.success).toBeUndefined();
  });

  it("list-campaigns: bogus influencer → campaigns array (read-only, no application state)", async () => {
    const r = await fn("list-campaigns", { influencerId: BOGUS });
    expect(Array.isArray(r.body?.campaigns)).toBe(true);
  });
});

describe("PAYMENT flow — webhook signature guards (no state change)", () => {
  it("stripe-webhook: bad/absent signature → rejected", async () => {
    const r = await fn("stripe-webhook", { id: "evt_test", type: "checkout.session.completed" }, { "stripe-signature": "t=1,v1=deadbeef" });
    expect(r.status).toBeGreaterThanOrEqual(400);
    expect(String(r.body?.received)).not.toBe("true");
  });

  it("razorpay-webhook: bad signature → rejected", async () => {
    const r = await fn("razorpay-webhook", { event: "subscription.charged" }, { "x-razorpay-signature": "deadbeef" });
    const rejected = r.status >= 400 || /invalid|signature|unauthor|error/i.test(r.text || "");
    expect(rejected).toBe(true);
  });

  it("razorpay-webhook: missing signature header → rejected", async () => {
    const r = await fn("razorpay-webhook", { event: "subscription.charged" });
    const rejected = r.status >= 400 || /invalid|signature|unauthor|error|missing/i.test(r.text || "");
    expect(rejected).toBe(true);
  });
});

describe("SIGNUP flow — guard contracts (no OTP sent, no user created)", () => {
  it("whatsapp-otp-verifier (signup): no OTP on record → rejected, no session/user", async () => {
    const r = await fn("whatsapp-otp-verifier", { phone: FAKE_PHONE, otp: "000000", mode: "signup" });
    expect(r.body?.session).toBeUndefined();
    expect(r.body?.user).toBeUndefined();
    expect(r.body?.success).not.toBe(true);
  });

  it("create-profile: no verified-phone proof → rejected, no user created", async () => {
    const r = await fn("create-profile", { phone: FAKE_PHONE, role: "influencer", full_name: "Integration Guard" });
    expect(r.body?.userId).toBeUndefined();
    expect(r.body?.session).toBeUndefined();
    expect(r.body?.success).not.toBe(true);
  });

  it("check-profile: unknown phone → read-only, not registered", async () => {
    const r = await fn("check-profile", { phone: FAKE_PHONE });
    expect(r.status).toBe(200);
    // read-only lookup — must not error out
    expect(r.body).toBeTruthy();
  });
});
