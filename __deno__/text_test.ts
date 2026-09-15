/**
 * Emoji-safe truncation — the bug that kept @thecozyshot's media kit empty.
 *
 * refresh-instagram cut reel captions with `.slice(0, 100)`. An emoji sitting
 * across character 100 left a lone surrogate, and PostgREST refused the whole
 * profile update with "Empty or invalid json". Every refresh for that creator
 * failed silently for days.
 *
 * These pin the property a database write depends on: whatever we store is
 * well-formed Unicode, so JSON encoding can never produce a body PostgREST
 * rejects.
 */
import { assert, assertEquals } from "jsr:@std/assert@1";
import { toWellFormedString, truncateText, wellFormed } from "../supabase/functions/_shared/text.ts";

const LONE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
const isWellFormed = (s: string) => !LONE.test(s);

Deno.test("reproduces the original bug: .slice splits an emoji straddling the limit", () => {
  const caption = "a".repeat(99) + "😍 more";
  const broken = caption.slice(0, 100);
  assert(!isWellFormed(broken), "precondition: plain slice leaves a lone surrogate");
});

Deno.test("truncateText keeps an emoji whole or drops it whole", () => {
  const caption = "a".repeat(99) + "😍 more";
  const out = truncateText(caption, 100);
  assert(isWellFormed(out));
  assertEquals(out, "a".repeat(99) + "😍");
  assertEquals(Array.from(out).length, 100);
});

Deno.test("an emoji at every possible cut point stays well-formed", () => {
  const text = "🔥".repeat(60) + "tail";
  for (let n = 0; n <= 70; n++) {
    const out = truncateText(text, n);
    assert(isWellFormed(out), `cut at ${n} produced a lone surrogate`);
    assert(Array.from(out).length <= n);
  }
});

Deno.test("short, null and non-string input", () => {
  assertEquals(truncateText("hello", 100), "hello");
  assertEquals(truncateText(null, 10), "");
  assertEquals(truncateText(undefined, 10), "");
  assertEquals(truncateText(12345, 3), "123");
});

Deno.test("already-broken input is repaired, not passed through", () => {
  const bad = "ok\uD83D"; // high surrogate with nothing after it
  assertEquals(toWellFormedString(bad), "ok�");
  assert(isWellFormed(truncateText(bad, 100)));
  // A valid pair is left untouched.
  assertEquals(toWellFormedString("😍"), "😍");
});

Deno.test("wellFormed scrubs a refresh-instagram-shaped payload deeply", () => {
  const payload = {
    username: "thecozyshot",
    followers_count: 51094,
    engagement_rate: 0.45,
    instagram_refreshed_at: "2026-09-15T20:25:51.753Z",
    top_reels: [
      { id: "1", caption: "a".repeat(99) + "\uD83D", likes: 10 },
      { id: "2", caption: "fine 😍", likes: 5 },
    ],
    audience_demographics: { topCities: [{ name: "Kanpur\uDE0D", value: 3 }] },
    empty: null,
  };
  const clean = wellFormed(payload);
  const json = JSON.stringify(clean);
  assert(isWellFormed(json));
  assertEquals(clean.followers_count, 51094);
  assertEquals(clean.empty, null);
  assertEquals(clean.top_reels[1].caption, "fine 😍");
  assert(clean.top_reels[0].caption.endsWith("�"));
  // Input is not mutated.
  assert(!isWellFormed(payload.top_reels[0].caption));
});
