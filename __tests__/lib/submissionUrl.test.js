/**
 * Deliverable-link identity — the rules that decide "same link".
 *
 * These run against the vectors in
 * supabase/functions/_shared/submission-url.vectors.json, which is the
 * contract the mobile mirror is held to as well. The implementation is
 * imported THROUGH src/utils/instagram-url so this also proves the web app's
 * re-export of the shared edge-function module resolves.
 *
 * The bug these exist for: the key was host + path with the query dropped.
 * Right for Instagram (the media id is in the path), wrong for a draft link
 * (a Drive file IS its query), so seven distinct Drive files all keyed to
 * "drive.google.com/open" and the creator was told they had submitted the
 * same link twice — first by the form, and after that was fixed, by the
 * server, which had its own copy of the same mistake.
 */
import { describe, it, expect } from "@jest/globals";
import { isInstagramUrl, normaliseInstagramUrl } from "@/utils/instagram-url";
import vectors from "../../supabase/functions/_shared/submission-url.vectors.json";

const key = (u) => normaliseInstagramUrl(u);

describe("submission URL identity", () => {
  it.each(vectors.sameLink.map((v) => [v.why, v.a, v.b]))(
    "same link — %s",
    (_why, a, b) => {
      expect(key(a)).toBe(key(b));
    },
  );

  it.each(vectors.differentLinks.map((v) => [v.why, v.a, v.b]))(
    "different links — %s",
    (_why, a, b) => {
      expect(key(a)).not.toBe(key(b));
    },
  );

  it.each(vectors.isInstagram.map((v) => [v.url, v.expected]))(
    "isInstagramUrl(%s) === %s",
    (url, expected) => {
      expect(isInstagramUrl(url)).toBe(expected);
    },
  );

  it("never returns a truthy key for an empty link", () => {
    expect(key("")).toBe("");
    expect(key(null)).toBe("");
    expect(key(undefined)).toBe("");
  });

  it("is not an Instagram test, which is why isInstagramUrl exists", () => {
    // The original mistake: !!normaliseInstagramUrl(driveLink) is true, so
    // the "Instagram links aren't needed for drafts" hint showed under every
    // pasted link.
    const drive = "https://drive.google.com/open?id=ABC";
    expect(key(drive)).toBeTruthy();
    expect(isInstagramUrl(drive)).toBe(false);
  });
});
