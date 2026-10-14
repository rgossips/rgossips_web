-- Record WHICH device a callback request was submitted from.
--
-- Support's first question on every one of these is "iOS, Android or web?",
-- and nothing on the row answered it. The admin portal could only guess, by
-- finding a device_sessions row whose active window covered the request's
-- created_at — which is exact for a single-device user and a coin flip for
-- anyone else. Measured against the four requests on record at the time:
-- two matched one session, two matched several.
--
-- One column settles it, because the native app already overrides
-- navigator.userAgent with "RGossipsApp/ios-26.5" (that is how
-- device_sessions tells app sessions from browser ones). So the same value
-- the browser reports distinguishes app from web, and names the in-app
-- webviews too — Instagram's accounts for 53 of the 184 distinct user
-- agents on record, and a webview is exactly the sort of place a button
-- stops responding.
--
-- Nullable with no default and no backfill: a row written before this
-- shipped genuinely has no device on it, and inventing one from the
-- session guess would turn an inference into a recorded fact. The admin
-- portal still shows that guess for old rows, clearly marked as a guess.
--
-- No RLS change needed: support_callbacks_insert_own checks
-- `auth.uid() = user_id` and does not restrict columns.

alter table public.support_callbacks
  add column if not exists user_agent text;

comment on column public.support_callbacks.user_agent is
  'navigator.userAgent at submit time. "RGossipsApp/<os>-<ver>" for the native app, a normal browser UA otherwise. Null for rows predating migration 086.';
