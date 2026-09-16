// Is this creator's Instagram token dead?
//
// Two signals, either is enough:
//   * instagram_token_invalid_at — refresh-instagram got OAuth error 190
//     (password change, revoked access, expiry). Set server-side.
//   * instagram_token_expires_at in the past — a long-lived token that was
//     not refreshed in time. Checked live on 2026-09-16: every row with a past
//     expiry was also rejected by Instagram, so the date is trustworthy.
//
// check-profile returns both fields (the raw token itself is stripped).
// Mirrors mobile src/lib/instagramToken.ts.
export function isInstagramTokenExpired(profile) {
  if (!profile?.instagram_connected) return false;
  if (profile.instagram_token_invalid_at) return true;
  const raw = profile.instagram_token_expires_at;
  if (!raw) return false;
  const at = Date.parse(raw);
  return Number.isFinite(at) && at < Date.now();
}

// Connected, token fine, but the creator switched off the insights permission
// when connecting — so reach/views can never load until they reconnect with it
// on. Set by refresh-instagram (migration 073), cleared by a refresh that gets
// insights. Only meaningful when the token itself is healthy.
export function isInstagramInsightsNotGranted(profile) {
  if (!profile?.instagram_connected) return false;
  return !!profile.instagram_insights_denied_at && !isInstagramTokenExpired(profile);
}
