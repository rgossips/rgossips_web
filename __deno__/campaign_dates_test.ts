// The rule that decides whether a campaign is still open for applications.
//
// THE BUG THESE PIN
//
// `application_deadline` stores midnight ("2026-10-14T00:00:00"), and both
// list-campaigns and list-brands compared it with a raw `< Date.now()`. A
// campaign whose applications closed TODAY therefore read as closed from
// 00:00:01 that morning: a brand published it, an admin approved it, the
// creator feed hid it, and the brand saw "APPLICATIONS CLOSED" on a campaign
// created minutes earlier. Caught live on 14 Oct 2026 — "Services
// explanation video for Sus…", deadline 2026-10-14.
//
// The second trap is timezone. The stored strings carry no offset, so
// `new Date(value)` resolves in the RUNTIME's zone — UTC on the edge, IST on
// a developer machine. The first version of endOfDayMs parsed locally and
// then called setUTCHours, which was a day out east of Greenwich and
// reported today's deadline as passed. The date parts are now read from the
// string so every runtime agrees. `todayIsNotPast` below is that regression.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  applicationDeadlinePassed,
  campaignEnded,
  endOfDayMs,
  openForApplications,
} from "../supabase/functions/_shared/campaign-dates.ts";

// A fixed "now" so these never go stale: midday UTC on 14 Oct 2026.
const NOW = Date.UTC(2026, 9, 14, 12, 0, 0);

Deno.test("todayIsNotPast — a deadline of today is still open all day", () => {
  assertEquals(applicationDeadlinePassed("2026-10-14T00:00:00", NOW), false);
  assertEquals(applicationDeadlinePassed("2026-10-14", NOW), false);
});

Deno.test("a deadline of today is open at one minute to midnight UTC", () => {
  const almost = Date.UTC(2026, 9, 14, 23, 58, 0);
  assertEquals(applicationDeadlinePassed("2026-10-14", almost), false);
});

Deno.test("yesterday's deadline has passed", () => {
  assertEquals(applicationDeadlinePassed("2026-10-13T00:00:00", NOW), true);
});

Deno.test("tomorrow's deadline has not", () => {
  assertEquals(applicationDeadlinePassed("2026-10-15T00:00:00", NOW), false);
});

Deno.test("no deadline never shuts", () => {
  assertEquals(applicationDeadlinePassed(null, NOW), false);
  assertEquals(applicationDeadlinePassed(undefined, NOW), false);
});

Deno.test("an unparseable date never shuts — it must not silently close a campaign", () => {
  assertEquals(endOfDayMs("not-a-date"), null);
  assertEquals(applicationDeadlinePassed("not-a-date", NOW), false);
});

Deno.test("endOfDayMs is the last millisecond of that UTC day", () => {
  assertEquals(endOfDayMs("2026-10-14"), Date.UTC(2026, 9, 14, 23, 59, 59, 999));
  // Same answer whichever shape the column hands us.
  assertEquals(endOfDayMs("2026-10-14T00:00:00"), endOfDayMs("2026-10-14"));
});

Deno.test("campaignEnded prefers the end date and falls back to the deadline", () => {
  // Deadline long gone, delivery still running — the campaign has NOT ended.
  assertEquals(campaignEnded("2026-12-01", "2026-09-01", NOW), false);
  // No end date, so the deadline decides.
  assertEquals(campaignEnded(null, "2026-10-13", NOW), true);
  assertEquals(campaignEnded(null, "2026-10-14", NOW), false);
});

Deno.test("openForApplications needs both gates", () => {
  assertEquals(
    openForApplications(
      { application_deadline: "2026-10-14T00:00:00", campaign_end_date: "2026-10-14" },
      NOW,
    ),
    true,
  );
  assertEquals(
    openForApplications(
      { application_deadline: "2026-10-13", campaign_end_date: "2026-12-01" },
      NOW,
    ),
    false,
  );
  assertEquals(
    openForApplications(
      { application_deadline: "2026-12-01", campaign_end_date: "2026-10-13" },
      NOW,
    ),
    false,
  );
});
