// Block-aware filtering for the list-* discovery endpoints.
//
// Play's UGC policy and Apple Guideline 1.2 require a block to actually take
// effect, not just record a preference — so every surface where one user sees
// another's content has to honour it. blocked_user_ids() (migration 059)
// returns ids in BOTH directions: the people this user blocked, and the people
// who blocked them. Hiding only one way would blind the person who pressed
// Block while leaving them fully visible to the person they blocked.
//
// Filtering happens on the result array rather than inside each function's
// query builder. The list-* functions build their queries in several branches
// with their own pagination, and threading a NOT IN through all of them would
// be a large, risky change for a filter that removes a handful of rows at
// most. The tradeoff is that a page can come back slightly short when a block
// is present — acceptable, because blocks are rare and the alternative is
// showing content the policy says must be hidden.

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Ids the viewer must not see, in either direction.
 * Returns an empty Set for an anonymous viewer, or if the lookup fails —
 * discovery degrading to unfiltered beats discovery breaking outright.
 */
export async function getBlockedIds(
  supabase: SupabaseClient,
  viewerId?: string | null,
): Promise<Set<string>> {
  if (!viewerId) return new Set();
  try {
    const { data, error } = await supabase.rpc("blocked_user_ids", {
      p_user: viewerId,
    });
    if (error) {
      console.error("blocked_user_ids rpc failed:", error.message);
      return new Set();
    }
    // The function returns setof uuid, which supabase-js surfaces either as a
    // bare array of strings or as [{ blocked_user_ids: "…" }] depending on
    // version. Handle both so a client upgrade can't silently disable blocks.
    const ids = (data || []).map((row: unknown) =>
      typeof row === "string" ? row : (row as Record<string, string>)?.blocked_user_ids,
    );
    return new Set(ids.filter(Boolean) as string[]);
  } catch (e) {
    console.error("blocked_user_ids threw:", e);
    return new Set();
  }
}

/**
 * Resolve the viewer from the request's bearer token, falling back to an id
 * supplied in the body.
 *
 * The list-* functions historically scope by a body-supplied id and do not
 * authenticate. Preferring the JWT tightens that where a token is present,
 * while the fallback keeps every existing caller working — including the
 * public/anonymous ones.
 */
export async function resolveViewerId(
  supabase: SupabaseClient,
  req: Request,
  bodyUserId?: string | null,
): Promise<string | null> {
  const authHeader = req.headers.get("authorization") || "";
  const jwt = authHeader.replace("Bearer ", "").trim();
  if (jwt) {
    try {
      const { data } = await supabase.auth.getUser(jwt);
      if (data?.user?.id) return data.user.id;
    } catch {
      // Anon key in the header, or an expired token — fall through.
    }
  }
  return bodyUserId || null;
}

/** Drop rows whose owner id is blocked. `key` names the owner column. */
export function filterBlocked<T extends Record<string, unknown>>(
  rows: T[] | null | undefined,
  blocked: Set<string>,
  key: string,
): T[] {
  if (!rows?.length || blocked.size === 0) return rows || [];
  return rows.filter((r) => {
    const owner = r?.[key];
    return typeof owner === "string" ? !blocked.has(owner) : true;
  });
}
