// When is a campaign's application window actually shut?
//
// Single owner for the rule, because it was computed in two places that must
// agree — list-campaigns (creator visibility + the "Closed" status) and
// list-brands (the "N active campaigns" count on a brand card) — and will now
// also gate creation and invites in brand-campaigns.
//
// THE BUG THIS EXISTS FOR
//
// `application_deadline` is a DAY, not an instant: the column stores midnight
// (e.g. "2026-10-14T00:00:00"). Both copies compared it with a raw
//
//     new Date(deadline).getTime() < Date.now()
//
// so a campaign whose applications close TODAY read as already closed from
// 00:00:01 that morning. A brand would create a campaign with today's
// deadline, an admin would approve it, and it would show "APPLICATIONS
// CLOSED" and never reach a single creator. Worse, countdown() a few lines
// above the comparison in list-campaigns reported that same date as "Today"
// and not past — so the UI said one thing and the filter did another.
//
// Applications stay open until the END of the deadline day.
//
// TIMEZONE: edge functions run in UTC, so "end of day" here is 23:59:59.999
// UTC, which is 05:29 IST the following morning. Deliberately the generous
// direction — a creator in India gets the whole of their day, and the error,
// if any, is a few extra hours rather than a campaign that was never
// openable. Do not "fix" this to a hard UTC cutoff without converting to IST
// first; cutting it short is the failure that caused the original bug.

/**
 * Last millisecond of the day a date falls on, or null for no date.
 *
 * The calendar date is read out of the STRING rather than via `new Date()`
 * plus a UTC setter. The stored values carry no timezone
 * ("2026-10-14T00:00:00"), so `new Date()` interprets them in the runtime's
 * local zone: correct on the edge runtime, which is UTC, but a day out when
 * the same code runs anywhere east of Greenwich — a test on an IST machine
 * reported a deadline of today as already passed, which is the very bug this
 * module exists to kill. Parsing the parts makes the answer identical
 * everywhere.
 */
export function endOfDayMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ymd = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    return Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), 23, 59, 59, 999);
  }
  // Anything else (an ISO string with an explicit offset, say) — fall back to
  // the parsed instant and extend to the end of its UTC day.
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    23,
    59,
    59,
    999,
  );
}

/** True once the application window has shut. No deadline = never shuts. */
export function applicationDeadlinePassed(
  applicationDeadline: string | null | undefined,
  now: number = Date.now(),
): boolean {
  const end = endOfDayMs(applicationDeadline);
  return end !== null && end < now;
}

/**
 * True once the campaign itself is over. Prefers the delivery end date and
 * falls back to the application deadline when there is no end date — the
 * same precedence list-campaigns' `isExpired` has always used.
 */
export function campaignEnded(
  campaignEndDate: string | null | undefined,
  applicationDeadline: string | null | undefined,
  now: number = Date.now(),
): boolean {
  const end = endOfDayMs(campaignEndDate || applicationDeadline);
  return end !== null && end < now;
}

/**
 * Can a creator still apply? Both gates, which is what the brand-card count
 * and the invite guard care about.
 */
export function openForApplications(
  campaign: {
    application_deadline?: string | null;
    campaign_end_date?: string | null;
  },
  now: number = Date.now(),
): boolean {
  if (applicationDeadlinePassed(campaign.application_deadline, now)) return false;
  if (campaignEnded(campaign.campaign_end_date, campaign.application_deadline, now)) return false;
  return true;
}
