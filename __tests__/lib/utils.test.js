import { describe, it, expect, jest } from "@jest/globals";
import { cn, navigateOrRefresh, parseUtc } from "@/lib/utils";

describe("cn", () => {
  it("merges + dedupes conflicting tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("filters falsy values + supports conditional objects/arrays", () => {
    expect(cn("a", false && "b", null, undefined, "c")).toBe("a c");
    expect(cn({ active: true, off: false })).toBe("active");
    expect(cn(["x", "y"])).toBe("x y");
  });
});

describe("navigateOrRefresh", () => {
  const mkRouter = () => ({ refresh: jest.fn(), push: jest.fn() });

  it("no target → does nothing", () => {
    const r = mkRouter();
    navigateOrRefresh(r, "/a", "");
    expect(r.refresh).not.toHaveBeenCalled();
    expect(r.push).not.toHaveBeenCalled();
  });
  it("same path (query/hash ignored) → refresh", () => {
    const r = mkRouter();
    navigateOrRefresh(r, "/campaigns", "/campaigns?x=1#y");
    expect(r.refresh).toHaveBeenCalledTimes(1);
    expect(r.push).not.toHaveBeenCalled();
  });
  it("different path → push(target)", () => {
    const r = mkRouter();
    navigateOrRefresh(r, "/home", "/campaigns/42");
    expect(r.push).toHaveBeenCalledWith("/campaigns/42");
    expect(r.refresh).not.toHaveBeenCalled();
  });
});

describe("parseUtc", () => {
  it("null / empty → null", () => {
    expect(parseUtc(null)).toBeNull();
    expect(parseUtc("")).toBeNull();
  });
  it("bare timestamp is interpreted as UTC", () => {
    expect(parseUtc("2026-06-08T06:30:00").getTime()).toBe(Date.parse("2026-06-08T06:30:00Z"));
  });
  it("already-Z is parsed as-is", () => {
    expect(parseUtc("2026-06-08T06:30:00Z").getTime()).toBe(Date.parse("2026-06-08T06:30:00Z"));
  });
  it("explicit +05:30 offset is respected (not re-UTC'd)", () => {
    expect(parseUtc("2026-06-08T12:00:00+05:30").getTime()).toBe(Date.parse("2026-06-08T12:00:00+05:30"));
  });
  it("invalid string → Invalid Date", () => {
    expect(Number.isNaN(parseUtc("nonsense").getTime())).toBe(true);
  });
});
