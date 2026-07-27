-- Web + mobile push notifications — generic device registry + a single
-- notifications-table trigger that fans a new notification out to every one of
-- the recipient's registered devices (web-push subscriptions AND mobile FCM
-- tokens). The sender edge function branches per platform.
--
-- Design goal: ONE trigger + ONE registry that both web push and mobile FCM
-- share. Adding a platform later = a new `platform` value + a branch in the
-- send-push edge fn; no schema or trigger change.

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  platform    text not null check (platform in ('web', 'fcm')),
  -- Web Push subscription (platform = 'web'): endpoint + the two client keys.
  endpoint    text,
  p256dh      text,
  auth        text,
  -- Mobile (platform = 'fcm'): the Firebase token (covers Android + iOS, since
  -- Firebase maps the iOS APNs token to an FCM token).
  token       text,
  user_agent  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One row per browser (web endpoint) / per device (fcm token). Re-subscribing
-- upserts on these.
create unique index if not exists push_sub_web_endpoint_uniq
  on public.push_subscriptions (endpoint) where platform = 'web';
create unique index if not exists push_sub_fcm_token_uniq
  on public.push_subscriptions (token) where platform = 'fcm';
create index if not exists push_sub_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- The edge functions (service role) do all writes. Users may read + delete
-- their own rows so a "turn off notifications on this device" toggle works.
drop policy if exists "push_sub_read_own" on public.push_subscriptions;
create policy "push_sub_read_own" on public.push_subscriptions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "push_sub_delete_own" on public.push_subscriptions;
create policy "push_sub_delete_own" on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid());

grant select, delete on public.push_subscriptions to authenticated;

-- ── Notifications → push fan-out trigger ─────────────────────────────
-- On every new notification row, POST the payload to the `send-push` edge
-- function via pg_net (async, non-blocking). The endpoint URL + a shared secret
-- are read from database settings the operator sets ONCE (kept out of git):
--
--   alter database postgres
--     set app.push_endpoint = 'https://<ref>.supabase.co/functions/v1/send-push';
--   alter database postgres set app.push_secret = '<random-string>';
--
-- If the setting is absent, the trigger is a no-op — notifications still insert
-- normally, so this is safe to ship before push is configured. Any pg_net error
-- is swallowed so a push failure can never break a notification write.
create extension if not exists pg_net;

create or replace function public.tg_notifications_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  v_endpoint text := current_setting('app.push_endpoint', true);
  v_secret   text := current_setting('app.push_secret', true);
begin
  if v_endpoint is null or v_endpoint = '' then
    return new;
  end if;

  perform net.http_post(
    url := v_endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', coalesce(v_secret, '')
    ),
    body := jsonb_build_object(
      'userId', new.user_id,
      'type',   new.type,
      'title',  new.title,
      'body',   new.body
    )
  );
  return new;
exception when others then
  -- Never let a push hiccup abort the notification insert.
  return new;
end;
$$;

drop trigger if exists notifications_push_after_insert on public.notifications;
create trigger notifications_push_after_insert
  after insert on public.notifications
  for each row execute function public.tg_notifications_push();
