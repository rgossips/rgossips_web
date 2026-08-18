// Marks browser sessions that were handed off from the mobile app.
//
// Plan management lives on the web, so the app sends users out to
// rgossips.com (e.g. "Manage plan" → /influencer/pricing). Those users
// obviously already have the app installed, so the "for a better experience
// use our mobile app" nudge in <OpenInAppGate /> is noise at best and
// confusing at worst — it asks them to open the app they just came from.
//
// The app appends `?from=app`. We latch that into sessionStorage on the
// first page load because it does not survive navigation: ProtectedRoute
// bounces logged-out visitors with `loginUrlFor(pathname)`, and Next's
// usePathname() drops the query string — so by the time the gate renders on
// /login the param is long gone. sessionStorage is per-tab, which is exactly
// the scope we want: it covers this hand-off and nothing else.

export const APP_HANDOFF_PARAM = "from";
export const APP_HANDOFF_VALUE = "app";
export const APP_HANDOFF_KEY = "rg-came-from-app";

// Copies `?from=app` into sessionStorage. Safe to call repeatedly; call it
// as early as possible in the tree so it wins the race against redirects.
export function latchAppHandoff() {
  if (typeof window === "undefined") return;
  try {
    const value = new URLSearchParams(window.location.search).get(APP_HANDOFF_PARAM);
    if (value === APP_HANDOFF_VALUE) {
      sessionStorage.setItem(APP_HANDOFF_KEY, "1");
    }
  } catch {
    // Private-mode Safari throws on sessionStorage. Falling through just
    // means the nudge may show — never a crash.
  }
}

// True when this tab was opened by the mobile app. Also reads the live URL
// so a direct hit on /login?from=app works even before the latch runs.
export function cameFromApp() {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get(APP_HANDOFF_PARAM) === APP_HANDOFF_VALUE) {
      return true;
    }
    return sessionStorage.getItem(APP_HANDOFF_KEY) === "1";
  } catch {
    return false;
  }
}
