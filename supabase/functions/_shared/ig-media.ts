// Looking up a creator's own Instagram posts by link.
//
// Instagram's API only exposes media owned by the connected account, newest
// first, 100 per page. Top reels a creator picks by hand are often months old
// — @alifestyledition's sat between her 156th and 433rd posts — so reading
// only the latest 25–50 (what public-media-kit and resolve-reel-thumbnails
// used to do) left every one of them without a thumbnail.

import { truncateText } from "./text.ts";

/** Shortcode from any post/reel link: /p/X, /reel/X, /reels/X, /tv/X. */
export function reelShortcode(url: unknown): string {
  return String(url || "").match(/\/(p|reel|reels|tv)\/([^/?&#]+)/)?.[2] || "";
}

/**
 * A hand-picked list (set from the media-kit editor) rather than the automatic
 * "most liked recent posts" one refresh-instagram builds. Editor saves carry
 * `curated: true`; older saves are recognisable by their placeholder ids.
 * refresh-instagram must never overwrite a curated list.
 */
export function isCuratedReels(reels: unknown): boolean {
  if (!Array.isArray(reels) || reels.length === 0) return false;
  return reels.some(
    (r: any) => r?.curated === true || /^(reel|custom)_\d+$/.test(String(r?.id || "")),
  );
}

export interface MediaLookup {
  byShortcode: Record<string, any>;
  username: string;
  /** Posts read. */
  scanned: number;
  /** The whole history was read — an unmatched link is definitely not theirs. */
  searchedAll: boolean;
  /** Stopped at the post limit with older posts left unread. */
  limitReached: boolean;
  /** Instagram refused the token (expired / revoked / password change). */
  tokenRejected: boolean;
}

export interface LookupBudget {
  /** Most recent posts to read. */
  maxPosts?: number;
  /** Stop paging after this long, whatever maxPosts says. */
  timeBudgetMs?: number;
}

/**
 * Product rule (2026-09): top reels can only come from a creator's LATEST 50
 * posts, so brands always see recent, up-to-date work. The editor refuses
 * anything older with a message saying so. One request, ~1 s.
 */
export const TOP_REELS_POST_LIMIT = 50;
export const EDITOR_BUDGET: LookupBudget = { maxPosts: TOP_REELS_POST_LIMIT, timeBudgetMs: 10_000 };
/**
 * Page views (public kit, refresh) use the same window for reels that have no
 * stored media id yet; reels with an id are fetched directly regardless of age.
 */
export const VIEW_BUDGET: LookupBudget = { maxPosts: TOP_REELS_POST_LIMIT, timeBudgetMs: 8_000 };

/**
 * Find the creator's own posts by shortcode among their most recent
 * `budget.maxPosts` posts.
 *
 * Instagram has no "look up by link" endpoint for the Instagram-Login API,
 * so the only route is reading the account's media newest-first. The scan asks
 * for id + permalink only, stops as soon as every wanted post is found, then
 * fetches full details for just the matches. Never throws; says whether the
 * whole history was read (`searchedAll`) or the post limit cut it short
 * (`limitReached`).
 */
export async function findMediaByShortcode(
  accessToken: string,
  shortcodes: string[],
  budget: LookupBudget = VIEW_BUDGET,
): Promise<MediaLookup> {
  const wanted = new Set(shortcodes.filter(Boolean));
  const idByShortcode: Record<string, string> = {};
  const result: MediaLookup = {
    byShortcode: {},
    username: "",
    scanned: 0,
    searchedAll: false,
    limitReached: false,
    tokenRejected: false,
  };
  if (!accessToken || wanted.size === 0) return result;

  const maxPosts = budget.maxPosts ?? TOP_REELS_POST_LIMIT;
  const deadline = Date.now() + (budget.timeBudgetMs ?? 8_000);
  let next: string | null =
    `https://graph.instagram.com/v22.0/me/media?fields=id,permalink,username&limit=${Math.min(100, maxPosts)}&access_token=${encodeURIComponent(accessToken)}`;
  try {
    while (next && result.scanned < maxPosts && Date.now() < deadline) {
      const data = await (await fetch(next)).json();
      if (data?.error) {
        if (Number(data.error.code) === 190) result.tokenRejected = true;
        break;
      }
      for (const m of data?.data || []) {
        if (result.scanned >= maxPosts) break;
        result.scanned++;
        result.username = result.username || m.username || "";
        const sc = reelShortcode(m.permalink);
        if (sc && wanted.has(sc)) idByShortcode[sc] = m.id;
      }
      next = data?.paging?.next || null;
      if (!next) result.searchedAll = true;
      if ([...wanted].every((sc) => idByShortcode[sc])) break;
    }
  } catch {
    // Network hiccup — return the partial result.
  }
  // Older posts exist beyond what we were allowed to read.
  result.limitReached = !result.searchedAll && !!next && result.scanned >= maxPosts;

  // Full details for the matches only, in parallel.
  await Promise.all(
    Object.entries(idByShortcode).map(async ([sc, id]) => {
      try {
        const m = await (await fetch(
          `https://graph.instagram.com/v22.0/${id}?fields=${MEDIA_FIELDS}&access_token=${encodeURIComponent(accessToken)}`,
        )).json();
        result.byShortcode[sc] = m?.error ? { id, permalink: "" } : m;
      } catch {
        result.byShortcode[sc] = { id, permalink: "" };
      }
    }),
  );
  return result;
}

const MEDIA_FIELDS =
  "id,media_type,thumbnail_url,media_url,permalink,caption,like_count,comments_count";
const isMediaId = (id: unknown) => /^\d{6,}$/.test(String(id || ""));

/**
 * Fresh thumbnails/stats for a stored reel list, fast.
 *
 * Reels already matched once carry Instagram's numeric media id, so they are
 * fetched directly and in parallel (one quick call each). Only reels without
 * an id fall back to paging the account's history — slow (≈15 s to reach a
 * post 450 back) but needed just once: `changed` tells the caller to persist
 * the list so the ids stick and the next view is fast.
 */
export async function refreshReels(
  accessToken: string,
  reels: any[],
): Promise<{ reels: any[]; changed: boolean }> {
  if (!accessToken || !Array.isArray(reels) || reels.length === 0) {
    return { reels: reels || [], changed: false };
  }
  const byId = await Promise.all(
    reels.map(async (r) => {
      if (!isMediaId(r?.id)) return null;
      try {
        const m = await (await fetch(
          `https://graph.instagram.com/v22.0/${r.id}?fields=${MEDIA_FIELDS}&access_token=${encodeURIComponent(accessToken)}`,
        )).json();
        return m?.error ? null : m;
      } catch {
        return null;
      }
    }),
  );
  const missing = reels
    .map((r, i) => (byId[i] ? "" : reelShortcode(r?.permalink)))
    .filter(Boolean);
  const { byShortcode } = missing.length
    ? await findMediaByShortcode(accessToken, missing)
    : { byShortcode: {} as Record<string, any> };

  let changed = false;
  const out = reels.map((r, i) => {
    const fresh = byId[i] || byShortcode[reelShortcode(r?.permalink)];
    if (fresh && fresh.id && fresh.id !== r?.id) changed = true;
    return enrichReel(r, fresh);
  });
  return { reels: out, changed };
}

/**
 * Merge fresh Instagram data into a stored reel entry, keeping the creator's
 * own link. Returns the entry unchanged when there is no match.
 */
export function enrichReel(reel: any, fresh: any): any {
  if (!fresh) return reel;
  const thumb = fresh.thumbnail_url || fresh.media_url || "";
  return {
    ...reel,
    id: fresh.id || reel.id,
    thumbnail: thumb || reel.thumbnail || "",
    thumbnailUrl: thumb || reel.thumbnailUrl || "",
    mediaUrl: fresh.media_url || reel.mediaUrl || "",
    mediaType: fresh.media_type || reel.mediaType || "VIDEO",
    likes: fresh.like_count ?? reel.likes ?? 0,
    comments: fresh.comments_count ?? reel.comments ?? 0,
    caption: truncateText(fresh.caption, 100) || reel.caption || "",
  };
}
