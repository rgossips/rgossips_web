// The trust-score pillars used to be tested here. They moved to
// supabase/functions/_shared/brand-trust.ts, which is now the one
// implementation — this file covers only the pure UI helpers that stayed.
import { describe, it, expect } from "@jest/globals";
import {
  isValidGstOrPan,
  classifyGstPan,
  getProfileCompletion,
} from "@/lib/brandProfile";

const PAN = "ABCDE1234F";
const GSTIN = "27ABCDE1234F1Z5"; // embeds ABCDE1234F at positions 2..12

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
      // brand_profiles only has Instagram — the facebook/linkedin/twitter
      // columns this used to pass do not exist on the table.
      instagram_username: "acme",
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
