// Emoji-safe text shortening. Mirrors supabase/functions/_shared/text.ts
// (read the rationale there) and mobile src/lib/text.ts.
//
// `s.slice(0, n)` counts UTF-16 units and can cut an emoji in half. On
// screen that renders as "�"; sent to the server it makes PostgREST reject
// the whole write as "Empty or invalid json". Use truncateText instead.

const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

/** Replace lone surrogates with U+FFFD. A valid string comes back unchanged. */
export function toWellFormedString(s) {
  return String(s).replace(LONE_SURROGATE, "�");
}

/** First `max` characters, counted in code points. null/undefined → "". */
export function truncateText(value, max) {
  if (value == null) return "";
  const s = toWellFormedString(value);
  if (s.length <= max) return s;
  return Array.from(s).slice(0, max).join("");
}
