// Checking the links a creator pastes into the media-kit "Top reels" editor,
// before anything is sent to the server. Shared by both editors
// (mediaKitTemplates/EditOverlay.jsx and TemplateClassic.jsx) so the rules and
// the wording never drift apart. Messages live in the "MediaKitReels" i18n
// namespace; each problem code below maps to `MediaKitReels.errors.<code>`.

const POST_PATH = /\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+/;

/** Canonical form for duplicate detection: host + /reel/<shortcode>. */
export function reelKey(url) {
  const m = String(url || "").match(/\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return m ? m[2] : String(url || "").trim().toLowerCase();
}

/**
 * Problem with one pasted link, or null when it is a usable post/reel link.
 *   notInstagram — not an instagram.com link at all
 *   story        — /stories/…: disappears in 24 h, can't be shown later
 *   share        — /share/…: Instagram's short share link; needs the real link
 *   profile      — a profile or highlights page, not a single post
 *   notPost      — some other instagram.com page
 */
export function checkReelLink(raw) {
  const url = String(raw || "").trim();
  if (!url) return null;
  let parsed;
  try {
    parsed = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
  } catch {
    return "notInstagram";
  }
  if (!/(^|\.)instagram\.com$|(^|\.)instagr\.am$/i.test(parsed.hostname)) return "notInstagram";
  const path = parsed.pathname;
  if (/^\/stories\//i.test(path)) return "story";
  if (/^\/share\//i.test(path)) return "share";
  if (POST_PATH.test(path)) return null;
  if (/^\/[^/]+\/?$/.test(path) || /^\/stories\/highlights\//i.test(path)) return "profile";
  return "notPost";
}

/**
 * Per-index problems for the whole list: format problems first, then
 * duplicates (the second and later copies of the same post).
 */
export function checkReelLinks(links) {
  const seen = new Set();
  return links.map((raw) => {
    const url = String(raw || "").trim();
    if (!url) return null;
    const problem = checkReelLink(url);
    if (problem) return problem;
    const key = reelKey(url);
    if (seen.has(key)) return "duplicate";
    seen.add(key);
    return null;
  });
}

/** Top reels can only come from a creator's latest this-many posts. Mirrors
 *  TOP_REELS_POST_LIMIT in supabase/functions/_shared/ig-media.ts. */
export const TOP_REELS_POST_LIMIT = 50;

/**
 * Server refusal → per-link problem codes the editor can show under each
 * input. `details` comes from resolve-reel-thumbnails.
 */
export function serverProblems(details) {
  const byUrl = new Map();
  for (const d of details || []) {
    byUrl.set(
      String(d.url || "").trim(),
      d.reason === "too_old"
        ? "tooOld"
        : d.reason === "not_found"
          ? "notFound"
          : d.reason === "not_reached"
            ? "notReached"
            : "notPost",
    );
  }
  return byUrl;
}
