import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { fetchServiceBySlug, fetchServices, formatINR, iconForName } from "@/lib/services";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = originalKey;
  jest.restoreAllMocks();
  delete global.fetch;
});

function installFetch(result) {
  global.fetch = jest.fn().mockResolvedValue({ json: jest.fn().mockResolvedValue(result) });
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = "public-key";
}

describe("services API helpers", () => {
  it("returns services and sends the expected edge-function request", async () => {
    const services = [{ slug: "reel", name: "Reel" }];
    installFetch({ services });

    await expect(fetchServices()).resolves.toEqual(services);
    expect(fetch).toHaveBeenCalledWith("https://project.supabase.co/functions/v1/list-services", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: "public-key", Authorization: "Bearer public-key" },
      body: "{}",
    });
  });

  it("returns an empty list for malformed responses and transport/JSON failures", async () => {
    installFetch({ services: { not: "an array" } });
    await expect(fetchServices()).resolves.toEqual([]);
    global.fetch.mockRejectedValueOnce(new Error("offline"));
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(fetchServices()).resolves.toEqual([]);
    expect(log).toHaveBeenCalledWith("fetchServices failed:", expect.any(Error));
  });

  it("fetches one service by slug and returns null for a missing or failed response", async () => {
    installFetch({ service: { slug: "reel" } });
    await expect(fetchServiceBySlug("reel")).resolves.toEqual({ slug: "reel" });
    expect(fetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ body: JSON.stringify({ slug: "reel" }) }));
    global.fetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({}) });
    await expect(fetchServiceBySlug("absent")).resolves.toBeNull();
    global.fetch.mockRejectedValueOnce(new Error("offline"));
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(fetchServiceBySlug("reel")).resolves.toBeNull();
    expect(log).toHaveBeenCalledWith("fetchServiceBySlug failed:", expect.any(Error));
  });
});

describe("services presentation helpers", () => {
  it("formats non-numeric values and uses a known icon or the Sparkles fallback", () => {
    expect(formatINR(undefined)).toBe("\u20b9NaN");
    expect(iconForName("Camera")).toBeTruthy();
    const fallback = iconForName("missing");
    expect(fallback).toBe(iconForName());
    expect(fallback).toBeTruthy();
  });
});
