/**
 * F-01 — Escrow functions rely on hand-rolled inline authorisation (S1)
 * F-03 — Select-star queries pull the Instagram access token into memory (S1)
 *
 * These are the two S1 items the strategy says must close before Phase 2 begins.
 * Both are asserted here as the DESIRED state.
 *
 * F-01 nuance worth knowing before reading a red or green result: the strategy
 * describes escrow-fund and escrow-release as running with "platform JWT
 * verification disabled". The deployed configuration read on 2026-08-20 shows
 * `verify_jwt: true` on both, so the platform-level half of that finding may
 * already be closed. The behavioural assertion below is the one that matters
 * either way — a caller holding only the publishable key must not get past the
 * gate — because that is the property F-01 is really about, and it stays true
 * regardless of which layer enforces it.
 *
 * SAFETY: the escrow calls use { guarded: true }. They carry bogus ids and are
 * refused at the auth or ownership gate, so no gateway order is created and no
 * money moves. See ALLOW_GUARDED in __integration__/safety.js.
 */
import { describe, it, expect, beforeAll } from "@jest/globals";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fn, requireEnv, BOGUS } from "../__integration__/safety.js";

beforeAll(() => requireEnv());

describe("F-01 — escrow money movement is unreachable with the publishable key", () => {
  it("escrow-fund refuses a publishable-key bearer (A-02)", async () => {
    const r = await fn(
      "escrow-fund",
      { applicationId: BOGUS, brandId: BOGUS, amount: 100 },
      { guarded: true },
    );
    // Must not reach the funding path. Any 2xx that looks like an order was
    // created is the failure this assertion exists to catch.
    const created = r.status < 300 && /order|razorpay_order|success/i.test(r.text || "");
    expect({ escrowFundReachable: created }).toEqual({ escrowFundReachable: false });
  });

  it("escrow-release refuses a publishable-key bearer (A-02)", async () => {
    const r = await fn("escrow-release", { applicationId: BOGUS, brandId: BOGUS }, { guarded: true });
    const released = r.status < 300 && /released|payout|success/i.test(r.text || "");
    expect({ escrowReleaseReachable: released }).toEqual({ escrowReleaseReachable: false });
  });
});

describe("F-03 — no select-star against the profile tables (A-33)", () => {
  // Static, not live: the risk is the token reaching function memory at all, so
  // the assertion belongs at the source, not at a response.
  const FN_DIR = "supabase/functions";
  const PROFILE_TABLES = ["influencer_profiles", "brand_profiles"];

  function edgeFunctionSources() {
    if (!existsSync(FN_DIR)) return [];
    const out = [];
    for (const dir of readdirSync(FN_DIR)) {
      const file = join(FN_DIR, dir, "index.ts");
      if (existsSync(file)) out.push([dir, readFileSync(file, "utf8")]);
      const shared = join(FN_DIR, dir);
      if (dir === "_shared") {
        for (const f of readdirSync(shared).filter((f) => f.endsWith(".ts"))) {
          out.push([`_shared/${f}`, readFileSync(join(shared, f), "utf8")]);
        }
      }
    }
    return out;
  }

  it("no edge function selects * from a profile table", () => {
    const offenders = [];
    for (const [name, src] of edgeFunctionSources()) {
      for (const table of PROFILE_TABLES) {
        // .from("influencer_profiles").select("*")  — allowing whitespace/newlines
        const re = new RegExp(`from\\(\\s*["'\`]${table}["'\`]\\s*\\)[\\s\\S]{0,80}?\\.select\\(\\s*["'\`]\\*`, "m");
        if (re.test(src)) offenders.push(`${name} → ${table}`);
      }
    }
    expect({ offenders }).toEqual({ offenders: [] });
  });

  it("no edge function returns instagram_access_token to a caller", () => {
    const offenders = [];
    for (const [name, src] of edgeFunctionSources()) {
      // Selecting the column is legitimate for functions that USE the token
      // (refresh-instagram, instagram-connect). Returning it is not.
      const returnsToken =
        /instagram_access_token/.test(src) &&
        /JSON\.stringify\([^)]*instagram_access_token/.test(src);
      if (returnsToken) offenders.push(name);
    }
    expect({ offenders }).toEqual({ offenders: [] });
  });
});
