import { describe, it, expect } from "@jest/globals";
import { INDIAN_CITIES, INDIAN_CITIES_SORTED, matchesAnyCity } from "@/utils/indianCities";
import { parseDeviceName } from "@/utils/device-session";
import { formatINR, iconForName } from "@/lib/services";
import { CATEGORIES } from "@/utils/categories";
import { CONTENT_LANGUAGES } from "@/utils/contentLanguages";

describe("indianCities", () => {
  it("matchesAnyCity (both directions, empty guards)", () => {
    expect(matchesAnyCity("", ["Mumbai"])).toBe(false);
    expect(matchesAnyCity("Mumbai", [])).toBe(false);
    expect(matchesAnyCity(null, ["Mumbai"])).toBe(false);
    expect(matchesAnyCity("Mumbai", null)).toBe(false);
    expect(matchesAnyCity("Mumbai, Pune", ["mumbai"])).toBe(true); // stored contains wanted
    expect(matchesAnyCity("Mumbai", ["Mumbai, Maharashtra"])).toBe(true); // wanted contains stored
    expect(matchesAnyCity("Delhi", ["Mumbai"])).toBe(false);
  });
  it("INDIAN_CITIES_SORTED is deduped and sorted", () => {
    expect(INDIAN_CITIES_SORTED.length).toBeLessThan(INDIAN_CITIES.length); // duplicates removed
    expect(new Set(INDIAN_CITIES_SORTED).size).toBe(INDIAN_CITIES_SORTED.length); // unique
    for (let i = 1; i < INDIAN_CITIES_SORTED.length; i++) {
      expect(INDIAN_CITIES_SORTED[i - 1].localeCompare(INDIAN_CITIES_SORTED[i])).toBeLessThanOrEqual(0);
    }
  });
});

describe("parseDeviceName", () => {
  it("empty UA → Device", () => {
    expect(parseDeviceName("")).toBe("Device");
    expect(parseDeviceName()).toBe("Device");
  });
  it("OS × browser matrix", () => {
    expect(parseDeviceName("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605 Version/16 Safari/604")).toBe("iPhone · Safari");
    expect(parseDeviceName("Mozilla/5.0 (Windows NT 10.0; Win64) AppleWebKit/537 Chrome/120 Safari/537")).toBe("Windows · Chrome");
    expect(parseDeviceName("Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537 Edg/120")).toBe("Windows · Edge");
    expect(parseDeviceName("Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile Safari/537")).toBe("Android · Chrome");
    expect(parseDeviceName("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Version/16 Safari/605")).toBe("Mac · Safari");
    expect(parseDeviceName("Mozilla/5.0 (X11; Linux x86_64; rv:120) Firefox/120")).toBe("Linux · Firefox");
  });
  it("OS with unrecognised browser → OS only", () => {
    expect(parseDeviceName("Mozilla/5.0 (Windows NT 10.0) SomeBot/1.0")).toBe("Windows");
  });
});

describe("services helpers", () => {
  it("formatINR formats rupees", () => {
    expect(formatINR(2500)).toBe("₹2,500");
    expect(formatINR("1234")).toBe("₹1,234");
    expect(formatINR(0)).toBe("₹0");
    expect(formatINR(NaN)).toBe("₹NaN");
  });
  it("iconForName returns a component, falling back to Sparkles", () => {
    expect(typeof iconForName("Instagram")).toBe("object"); // lucide forwardRef component
    const fallback = iconForName("Nope");
    expect(fallback).toBe(iconForName(undefined)); // both → Sparkles
    expect(fallback).toBeTruthy();
  });
});

describe("static data lists", () => {
  it("CATEGORIES: 15 unique entries", () => {
    expect(CATEGORIES).toHaveLength(15);
    expect(new Set(CATEGORIES).size).toBe(15);
  });
  it("CONTENT_LANGUAGES: non-empty + unique", () => {
    expect(CONTENT_LANGUAGES.length).toBeGreaterThan(0);
    expect(new Set(CONTENT_LANGUAGES).size).toBe(CONTENT_LANGUAGES.length);
  });
});
