-- User preferences: per-user notification + privacy toggles.
-- Keyed by auth.users.id so the same row works for both influencers and brands.
-- A user with no row is treated as "all defaults on" by the trigger below.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notification_prefs jsonb not null default jsonb_build_object(
    'campaignUpdates', true,
    'applicationStatus', true,
    'deadlineReminders', true,
    'paymentAlerts', true
  ),
  privacy_prefs jsonb not null default jsonb_build_object(
    'publicProfile', true,
    'showEmail', false,
    'searchIndexing', true,
    'twoFactor', true
  ),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "user_preferences_read_own" on public.user_preferences;
create policy "user_preferences_read_own" on public.user_preferences
  for select using (auth.uid() = user_id);

drop policy if exists "user_preferences_upsert_own" on public.user_preferences;
create policy "user_preferences_upsert_own" on public.user_preferences
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own" on public.user_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notification-type → preference-key mapping. Returning NULL from a BEFORE
-- INSERT trigger silently drops the row. Types not in the map (welcome,
-- profile_incomplete, deliverables_submitted, …) always pass through —
-- they're operational signals the user can't opt out of.
create or replace function public.check_notification_pref()
returns trigger
language plpgsql
security definer
as $$
declare
  prefs jsonb;
  pref_key text;
begin
  pref_key := case
    when new.type like 'app_%' or new.type in ('new_application', 'application_status') then 'applicationStatus'
    when new.type in ('service_advance_paid', 'service_final_paid', 'payment_released', 'payment_received') then 'paymentAlerts'
    when new.type like 'deadline%' then 'deadlineReminders'
    when new.type in ('campaign_match', 'new_campaign') then 'campaignUpdates'
    else null
  end;

  if pref_key is null then
    return new;
  end if;

  select notification_prefs into prefs
    from public.user_preferences
    where user_id = new.user_id;

  -- No prefs row → defaults apply, nothing is suppressed.
  if prefs is null then
    return new;
  end if;

  if coalesce((prefs->>pref_key)::boolean, true) = false then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists notifications_pref_filter on public.notifications;
create trigger notifications_pref_filter
  before insert on public.notifications
  for each row
  execute function public.check_notification_pref();
