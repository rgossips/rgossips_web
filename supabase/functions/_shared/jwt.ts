// Cheap, UNVERIFIED peek at a bearer token's `role` claim.
//
// NEVER use this to grant anything — a JWT's payload is trivially forged. It
// only answers "is it worth asking Supabase Auth about this token?", so a
// function can skip a network call that is guaranteed to fail:
//
//   * The web app calls the list-* functions with the PUBLISHABLE key as the
//     bearer. resolveViewerId() used to hand that to auth.getUser(), which
//     always answers 403 — one wasted Auth request (and a 403 in the API logs)
//     per campaign/brand/influencer listing.
//   * isServiceRoleCaller() probed auth.admin.listUsers() with every caller's
//     token, so an ordinary signed-in creator cost an extra failing admin call
//     (401) before the normal getUser path ran.
//
// Returns null for anything that is not a three-part JWT with a readable
// payload — which includes the new non-JWT `sb_publishable_…` / `sb_secret_…`
// keys, so callers must still handle those explicitly.
export function unverifiedJwtRole(token: string | null | undefined): string | null {
  const t = String(token || "").trim();
  if (!t || t.startsWith("sb_")) return null;
  const parts = t.split(".");
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)));
    return typeof claims?.role === "string" ? claims.role : null;
  } catch {
    return null;
  }
}
