-- 073: remember when a creator's Instagram connection lacks the insights permission.
--
-- Instagram Business Login lets a creator switch off individual permissions on
-- the consent screen. Someone who turns off "insights" connects fine, but every
-- /me/insights call answers "Application does not have permission for this
-- action" (code 10). refresh-instagram used to try — and log two warnings —
-- on every refresh, forever: 15 creators, all new sign-ups, 30 error_logs rows
-- in one day, while their reach/views stayed empty. The app-level permission is
-- fine: 212 of 227 creators refreshed that day got insights.
--
-- Set by refresh-instagram on the first permission refusal (logged once), and
-- cleared by the next refresh that gets insights — i.e. after the creator
-- reconnects and leaves insights on. Drives the consumer app's "reconnect to
-- show your reach and views" banner and the admin portal's badge. Like
-- instagram_token_invalid_at, it never blocks anything.

alter table public.influencer_profiles
  add column if not exists instagram_insights_denied_at timestamptz;

comment on column public.influencer_profiles.instagram_insights_denied_at is
  'When Instagram refused insights for this creator''s token (permission not granted); null once a refresh gets insights.';

-- Backfill from what refresh-instagram already logged, so the banner reaches
-- the creators who hit this before the flag existed. Only where the refusal is
-- newer than any insights we hold for them.
update public.influencer_profiles p
set instagram_insights_denied_at = f.last_at
from (
  select user_id, max(occurred_at) as last_at
  from public.error_logs
  where event = 'instagram.refresh.insights_failed'
    and message ilike '%does not have permission%'
    and occurred_at > now() - interval '30 days'
    and user_id is not null
  group by user_id
) f
where p.influencer_id = f.user_id
  and p.instagram_insights_denied_at is null
  and (
    p.instagram_insights is null
    or (p.instagram_insights ->> 'until') is null
    or (p.instagram_insights ->> 'until')::timestamptz < f.last_at
  );
