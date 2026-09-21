import { describe, it, expect } from "@jest/globals";
import { checkReelLink, checkReelLinks, reelKey, serverProblems } from "@/lib/reelLinks";

describe("checkReelLink", () => {
  it("accepts post, reel, reels and tv links, with or without tracking params", () => {
    for (const url of [
      "https://www.instagram.com/reel/DY9VbsiS0lr/",
      "https://www.instagram.com/reels/DY9VbsiS0lr/",
      "https://www.instagram.com/p/DZHJrrLE1oZ/?igsh=abc",
      "https://instagram.com/reel/DcnQoUFyVok/?stkn=MWRsd3Zqb2pxcHNrbA==",
      "instagram.com/tv/ABC123",
      "https://www.instagram.com/alifestyledition/reel/DY9VbsiS0lr/",
    ]) {
      expect(checkReelLink(url)).toBeNull();
    }
  });

  it("names what is wrong with other links", () => {
    expect(checkReelLink("https://youtube.com/watch?v=x")).toBe("notInstagram");
    expect(checkReelLink("not a url at all")).toBe("notInstagram");
    expect(checkReelLink("https://www.instagram.com/stories/someone/123/")).toBe("story");
    expect(checkReelLink("https://www.instagram.com/share/reel/BAabc123/")).toBe("share");
    expect(checkReelLink("https://www.instagram.com/alifestyledition/")).toBe("profile");
    expect(checkReelLink("https://www.instagram.com/explore/tags/food/")).toBe("notPost");
  });

  it("ignores empty input", () => {
    expect(checkReelLink("   ")).toBeNull();
  });
});

describe("checkReelLinks", () => {
  it("flags the second copy of the same post as a duplicate, even with different params", () => {
    const res = checkReelLinks([
      "https://www.instagram.com/reel/DY9VbsiS0lr/?a=1",
      "https://www.instagram.com/reels/DY9VbsiS0lr/",
      "",
    ]);
    expect(res).toEqual([null, "duplicate", null]);
  });

  it("reelKey is the shortcode", () => {
    expect(reelKey("https://www.instagram.com/reel/DY9VbsiS0lr/?x=1")).toBe("DY9VbsiS0lr");
  });
});

describe("serverProblems", () => {
  it("maps server reasons to editor problem codes by url", () => {
    const m = serverProblems([
      { url: "u1", reason: "not_found" },
      { url: "u2", reason: "not_reached" },
      { url: "u3", reason: "not_a_post" },
      { url: "u4", reason: "too_old" },
    ]);
    expect(m.get("u4")).toBe("tooOld");
    expect(m.get("u1")).toBe("notFound");
    expect(m.get("u2")).toBe("notReached");
    expect(m.get("u3")).toBe("notPost");
  });
});
