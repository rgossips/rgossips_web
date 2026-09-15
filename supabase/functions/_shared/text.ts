// Text helpers that cannot corrupt a database write.
//
// JavaScript strings are UTF-16. Most emoji are TWO code units (a surrogate
// pair), so `s.slice(0, 100)` can keep the first half of an emoji and drop
// the second. The result is a "lone surrogate": not valid Unicode, and
// PostgREST rejects any request body containing one with
// "Empty or invalid json" — failing the ENTIRE write, not just that field.
//
// That is exactly how @thecozyshot never had analytics saved: one reel
// caption with an emoji straddling character 100 sank every refresh.
//
// Rules:
//   * Shorten user / Instagram / AI text with truncateText, never .slice.
//   * Run anything that came from outside through wellFormed before a write.
//
// qa/checks/text-truncation.mjs fails the build on a new `.slice(0, N)` on
// text in an edge function. Mirrors: web src/lib/text.js, mobile src/lib/text.ts.

// A high surrogate not followed by a low one, or a low surrogate not preceded
// by a high one.
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

/** Replace lone surrogates with U+FFFD. A valid string comes back unchanged. */
export function toWellFormedString(s: string): string {
  return s.replace(LONE_SURROGATE, "�");
}

/**
 * First `max` characters of `value`, counted in code points so an emoji is
 * kept whole or dropped whole. null/undefined become "".
 *
 * Code points, not graphemes: a multi-part emoji (a family, a flag) can lose
 * its trailing parts, but what remains is still valid Unicode — which is the
 * property a database write needs. Intl.Segmenter would be exact but is not
 * available on every runtime these mirrors run on (Hermes).
 */
export function truncateText(value: unknown, max: number): string {
  if (value == null) return "";
  const s = toWellFormedString(String(value));
  // Fast path: under the limit in code units means under it in code points.
  if (s.length <= max) return s;
  return Array.from(s).slice(0, max).join("");
}

/**
 * Deep copy of `value` with every string made well-formed. Plain objects and
 * arrays are walked; everything else (numbers, dates, null) passes through.
 *
 * Use as a last line of defence on payloads built from external data, so a
 * missed truncation costs one replacement character instead of the write.
 */
export function wellFormed<T>(value: T): T {
  if (typeof value === "string") return toWellFormedString(value) as T;
  if (Array.isArray(value)) return value.map((v) => wellFormed(v)) as T;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = wellFormed(v);
    return out as T;
  }
  return value;
}
