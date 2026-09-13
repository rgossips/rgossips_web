"use client";

// Invoke an edge function that authenticates the CALLER, refreshing the
// session once if the access token turns out to be dead.
//
// Those functions do their own `supabase.auth.getUser(token)`.
// `getSession()` hands back a STORED session without proving the token is
// still live, so a tab left open long enough posts an expired token and the
// function answers 401 — which in the UI is indistinguishable from "not
// signed in". Confirmed once from a real 401 on escrow-release: the response
// carried OUR function's CORS headers, so the request had reached it and
// getUser rejected the token.
//
// Passing the header explicitly also sidesteps the shared-cookie problem
// noted in CLAUDE.md, where `functions.invoke()` can fall back to sending the
// publishable key as the Bearer.
//
// Returns invoke's { data, error }, or { needsLogin: true } when even a
// refresh cannot produce a live token.
export async function invokeAuthed(supabase, fn, body) {
  const send = (token) =>
    supabase.functions.invoke(fn, { body, headers: { Authorization: `Bearer ${token}` } });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return { needsLogin: true };

  const first = await send(session.access_token);
  // supabase-js collapses non-2xx into a generic message, so branch on the
  // status from error.context rather than trying to read the text.
  if (first?.error?.context?.status !== 401) return first;

  const { data: refreshed } = await supabase.auth.refreshSession();
  const token = refreshed?.session?.access_token;
  if (!token) return { needsLogin: true };
  return send(token);
}

export default invokeAuthed;
