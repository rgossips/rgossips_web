import { describe, it, expect } from "@jest/globals";
import { toWellFormedString, truncateText } from "@/lib/text";

// Mirrors __deno__/text_test.ts for the web copy of the helper.
const LONE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

describe("truncateText", () => {
  it("never splits an emoji at the limit (the .slice bug)", () => {
    const caption = "a".repeat(99) + "😍 more";
    expect(LONE.test(caption.slice(0, 100))).toBe(true); // the old behaviour
    const out = truncateText(caption, 100);
    expect(LONE.test(out)).toBe(false);
    expect(out).toBe("a".repeat(99) + "😍");
  });

  it("stays well-formed at every cut point", () => {
    const text = "🔥".repeat(30);
    for (let n = 0; n <= 32; n++) expect(LONE.test(truncateText(text, n))).toBe(false);
  });

  it("handles short, null and non-string input", () => {
    expect(truncateText("hi", 10)).toBe("hi");
    expect(truncateText(null, 10)).toBe("");
    expect(truncateText(undefined, 10)).toBe("");
    expect(truncateText(12345, 3)).toBe("123");
  });

  it("repairs an already-broken string", () => {
    expect(toWellFormedString("ok\uD83D")).toBe("ok�");
    expect(toWellFormedString("😍")).toBe("😍");
  });
});
