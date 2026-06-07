import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Click handler for notification items: navigate to `target`, or if we're
// already on that path, hard-refresh so freshly-changed data on the page
// re-fetches. Without this, a "drafts accepted" notification clicked
// while already on the campaign page would do nothing visible.
export function navigateOrRefresh(router, currentPath, target) {
  if (!target) return;
  // Compare ignoring query/hash — the path is what matters.
  const targetPath = target.split("?")[0].split("#")[0];
  if (currentPath === targetPath) {
    router.refresh();
  } else {
    router.push(target);
  }
}

// Parse a Supabase / Postgres timestamp string into a Date that's always
// interpreted as UTC. Why this exists: when a column is `timestamp without
// time zone`, Postgres emits the value WITHOUT a TZ marker (e.g.
// "2026-06-08T06:30:00"). `new Date(...)` in a browser then treats that
// as LOCAL time, which on an IST machine shifts the timestamp 5:30 hours
// into the future and makes "x ago" displays show negative / wrong values.
// If the string already has a "Z" or "±HH:MM" suffix it's parsed as-is.
export function parseUtc(dateStr) {
  if (!dateStr) return null;
  // Already carries a timezone — trust it.
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(dateStr)) return new Date(dateStr);
  // No marker: assume the DB stored UTC and append Z.
  return new Date(dateStr + "Z");
}
