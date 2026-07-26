-- Brand → influencer campaign invites (tracking spine).
--
-- Lets a brand proactively invite hand-picked creators to a campaign and track
-- how many responded (= applied). Kept in its OWN table rather than reusing
-- campaign_applications because an 'invited' application row would (1) collide
-- with the UNIQUE(campaign_id, influencer_id) index and block the creator's real
-- apply, (2) burn their monthly apply cap, and (3) surface as a phantom applicant
-- in the brand review UI. This table never touches the application/escrow pipeline.
--
-- status: 'sent' → 'responded' (flipped by apply-campaign when the invitee
-- applies). 'viewed'/'declined' are reserved for a future richer-tracking pass.
-- All writes are service-role only (edge functions); reads are scoped by RLS.
-- Mirrors the posture of 035_rls_critical_tables.sql / 053_brand_review_gates.sql.

create table if not exists public.campaign_invitations (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null,
  brand_id      uuid not null,          -- denormalised for RLS + cheap brand reads
  influencer_id uuid not null,          -- auth.users id of a REGISTERED creator only
  status        text not null default 'sent',
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  constraint campaign_invitations_status_chk
    check (status in ('sent','viewed','responded','declined')),
  constraint campaign_invitations_uniq unique (campaign_id, influencer_id)
);

create index if not exists idx_campaign_invitations_campaign
  on public.campaign_invitations (campaign_id);
create index if not exists idx_campaign_invitations_influencer
  on public.campaign_invitations (influencer_id, status);
create index if not exists idx_campaign_invitations_brand
  on public.campaign_invitations (brand_id);

alter table public.campaign_invitations enable row level security;

-- Brand reads its own invitations (denormalised brand_id).
drop policy if exists "invites_brand_read_own" on public.campaign_invitations;
create policy "invites_brand_read_own" on public.campaign_invitations
  for select to authenticated using (brand_id = auth.uid());

-- Influencer reads invitations addressed to them.
drop policy if exists "invites_influencer_read_own" on public.campaign_invitations;
create policy "invites_influencer_read_own" on public.campaign_invitations
  for select to authenticated using (influencer_id = auth.uid());

-- All writes service-role only (edge functions). No authenticated write policy
-- => clients cannot write directly; service_role bypasses RLS.

grant select on public.campaign_invitations to authenticated;

-- Extend the notification-preference trigger (migration 014) so the new
-- `campaign_invite` type is gated by the same `campaignUpdates` toggle as
-- `campaign_match` / `new_campaign`. The invitation ROW is always recorded
-- (tracking must stay complete); only the in-app notification is suppressed
-- when the creator turned campaign updates off.
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
    when new.type in ('campaign_match', 'new_campaign', 'campaign_invite') then 'campaignUpdates'
    else null
  end;

  if pref_key is null then
    return new;
  end if;

  select notification_prefs into prefs
    from public.user_preferences
    where user_id = new.user_id;

  if prefs is null then
    return new;
  end if;

  if coalesce((prefs->>pref_key)::boolean, true) = false then
    return null;
  end if;

  return new;
end;
$$;
