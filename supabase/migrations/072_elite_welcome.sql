-- 072: one-time "Welcome to Elite" popup.
--
-- The popup shows while effective plan = elite AND elite_welcome_seen_at is
-- null; the client stamps it via update-profile (eliteWelcomeSeen) when the
-- creator closes it.
--
-- Plans are granted from many places — razorpay-webhook, stripe-webhook,
-- reconcile-subscription, the IAP paths, the admin console. Rather than
-- remembering to reset the flag in each, a trigger clears it whenever a row
-- BECOMES elite. A lapse (elite → free) followed by a new Elite subscription
-- therefore shows the welcome again; a renewal (elite → elite) does not.
--
-- Existing rows start null, so a creator who is already Elite sees it once
-- on their next visit.

alter table public.influencer_profiles
  add column if not exists elite_welcome_seen_at timestamptz;

comment on column public.influencer_profiles.elite_welcome_seen_at is
  'When the creator dismissed the Welcome-to-Elite popup. Reset to null by trg_reset_elite_welcome each time the plan becomes elite.';

create or replace function public.reset_elite_welcome()
returns trigger
language plpgsql
as $$
begin
  if lower(coalesce(new.subscription_plan, '')) = 'elite'
     and lower(coalesce(old.subscription_plan, '')) <> 'elite' then
    new.elite_welcome_seen_at := null;
  end if;
  return new;
end;
$$;

-- Trigger functions are not callable as RPCs, but keep them off the API
-- surface anyway (see migrations 060/063 on PUBLIC vs anon grants).
revoke all on function public.reset_elite_welcome() from public, anon, authenticated;

drop trigger if exists trg_reset_elite_welcome on public.influencer_profiles;
create trigger trg_reset_elite_welcome
  before update of subscription_plan on public.influencer_profiles
  for each row
  execute function public.reset_elite_welcome();
