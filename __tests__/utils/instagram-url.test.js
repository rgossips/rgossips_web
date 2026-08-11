import { describe, it, expect } from "@jest/globals";
import {
  detectInstagramLinkType,
  labelForLinkType,
  expectedLinkType,
  normaliseInstagramUrl,
} from "@/utils/instagram-url";

describe("detectInstagramLinkType", () => {
  it("empty / non-URL (no protocol) / non-instagram host → unknown", () => {
    expect(detectInstagramLinkType("")).toBe("unknown");
    expect(detectInstagramLinkType(null)).toBe("unknown");
    expect(detectInstagramLinkType("instagram.com/reel/x")).toBe("unknown"); // no protocol → URL throws
    expect(detectInstagramLinkType("https://example.com/reel/x")).toBe("unknown");
  });
  it("classifies each path type", () => {
    expect(detectInstagramLinkType("https://www.instagram.com/reel/Cxyz/")).toBe("reel");
    expect(detectInstagramLinkType("https://instagram.com/reels/Cxyz")).toBe("reel");
    expect(detectInstagramLinkType("https://instagram.com/stories/user/123")).toBe("story");
    expect(detectInstagramLinkType("https://instagram.com/tv/Cxyz")).toBe("igtv"); // tv → igtv
    expect(detectInstagramLinkType("https://instagram.com/p/Cxyz")).toBe("post");
    expect(detectInstagramLinkType("https://instagram.com/someuser/")).toBe("unknown");
  });
  it("case-insensitive host + query params", () => {
    expect(detectInstagramLinkType("https://INSTAGRAM.COM/reel/x")).toBe("reel");
    expect(detectInstagramLinkType("https://instagram.com/reel/x/?utm=1")).toBe("reel");
  });
});

describe("labelForLinkType", () => {
  it("maps types to labels (tv & igtv → IGTV, default → Link)", () => {
    expect(labelForLinkType("reel")).toBe("Reel");
    expect(labelForLinkType("post")).toBe("Post");
    expect(labelForLinkType("story")).toBe("Story");
    expect(labelForLinkType("igtv")).toBe("IGTV");
    expect(labelForLinkType("tv")).toBe("IGTV");
    expect(labelForLinkType("unknown")).toBe("Link");
    expect(labelForLinkType("anything")).toBe("Link");
  });
});

describe("expectedLinkType", () => {
  it("maps deliverable names to the expected type", () => {
    expect(expectedLinkType("reels")).toBe("reel");
    expect(expectedLinkType("stories")).toBe("story");
    expect(expectedLinkType("posts")).toBe("post");
    expect(expectedLinkType("carousel")).toBe("post");
    expect(expectedLinkType("static")).toBe("post");
    expect(expectedLinkType("igtv")).toBe("igtv");
    expect(expectedLinkType("tv")).toBe("igtv");
    expect(expectedLinkType("")).toBeNull();
    expect(expectedLinkType(null)).toBeNull();
    expect(expectedLinkType("unknown")).toBeNull();
  });
});

describe("normaliseInstagramUrl", () => {
  it("empty → empty; non-URL → trimmed lowercase fallback", () => {
    expect(normaliseInstagramUrl("")).toBe("");
    expect(normaliseInstagramUrl(null)).toBe("");
    expect(normaliseInstagramUrl("  NOT a Url ")).toBe("not a url");
  });
  it("desktop and mobile forms normalise equal (www + trailing slash + query stripped)", () => {
    const a = normaliseInstagramUrl("https://www.instagram.com/reel/Cxyz/");
    const b = normaliseInstagramUrl("https://instagram.com/reel/Cxyz");
    const c = normaliseInstagramUrl("https://instagram.com/reel/Cxyz/?utm_source=ig");
    expect(a).toBe("instagram.com/reel/cxyz");
    expect(a).toBe(b);
    expect(a).toBe(c);
  });
});
