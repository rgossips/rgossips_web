"use client";

// Client-side mirror of supabase/functions/_shared/campaign-dates.ts.
//
// An application deadline is a DAY, not an instant. The column stores
// midnight ("2026-10-14T00:00:00"), so a raw
//
//     new Date(deadline).getTime() < Date.now()
//
// marks a campaign closed from 00:00:01 on the morning of its own deadline.
// That shipped in four places — the brand campaign card, the brand campaign
// detail page, and both mobile equivalents — so a brand who created a
// campaign today, published it and had it approved saw "Applications Closed"
// on it minutes later, while creators could not see it at all.
//
// The calendar date is read out of the STRING rather than via `new Date()`
// plus a setter: these values carry no timezone, so `new Date()` resolves
// them in the viewer's zone and a browser east of Greenwich lands a day out.
// Parsing the parts makes every device agree with the server.
//
// TIMEZONE: "end of day" is 23:59:59.999 UTC, which is 05:29 IST the next
// morning — deliberately the generous direction, matching the server. Do not
// tighten it without converting to IST first; cutting it short is the bug.

/** Last millisecond of the day a date falls on, or null when there is none. */
export function endOfDayMs(value) {
  if (!value) return null;
  const ymd = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    return Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), 23, 59, 59, 999);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999);
}

/** True once the application window has shut. No deadline never shuts. */
export function applicationDeadlinePassed(applicationDeadline, now = Date.now()) {
  const end = endOfDayMs(applicationDeadline);
  return end !== null && end < now;
}

/** True once the campaign is over — end date, falling back to the deadline. */
export function campaignEnded(campaignEndDate, applicationDeadline, now = Date.now()) {
  const end = endOfDayMs(campaignEndDate || applicationDeadline);
  return end !== null && end < now;
}
