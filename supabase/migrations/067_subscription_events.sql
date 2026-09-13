-- Subscription event log.
--
-- influencer_profiles only holds the CURRENT entitlement (subscription_plan,
-- billing_cycle, payment_gateway, *_subscription_id). Nothing recorded WHEN a
-- creator subscribed, so the admin console could not answer "how many new
-- subscriptions today?". payments/invoices are unused, and the plan_upgraded
-- notification only fires for Razorpay upgrades to Pro+.
--
-- Rather than touch every writer (razorpay-webhook, stripe-webhook,
-- iap-notifications, iap-expiry-sweep, reconcile-subscription, the admin
-- plan override), a trigger on influencer_profiles appends one row whenever
-- the entitlement columns change. Every rail is covered, including ones added
-- later, without a redeploy.
--
-- is_new_purchase — what the admin "new subscriptions" stat counts:
--   * the row lands on a paid tier (starter/pro/elite), AND
--   * the gateway is a real payment rail (not 'admin' comps, not NULL), AND
--   * either the previous plan was NOT paid (trial/free/NULL → paid), or a
--     NEW external subscription id appeared (resubscribe, gateway switch,
--     upgrade purchased as a new subscription).
--   Renewals keep the same subscription id → not counted. Cancellations drop
--   to 'starter' without a new id → not counted.
--
-- RLS on, no policies: service role only, same posture as error_logs.

create table if not exists public.subscription_events (
  id               uuid primary key default gen_random_uuid(),
  occurred_at      timestamptz not null default now(),
  user_id          uuid not null,          -- no FK: history survives a user delete
  old_plan         text,
  new_plan         text,
  old_cycle        text,
  new_cycle        text,
  old_gateway      text,
  new_gateway      text,
  subscription_id  text,                   -- the external id live after the change
  is_new_purchase  boolean not null default false
);

create index if not exists subscription_events_occurred_idx
  on public.subscription_events (occurred_at desc);
create index if not exists subscription_events_new_purchase_idx
  on public.subscription_events (occurred_at desc) where is_new_purchase;
create index if not exists subscription_events_user_idx
  on public.subscription_events (user_id, occurred_at desc);

alter table public.subscription_events enable row level security;
revoke all on public.subscription_events from anon, authenticated;

create or replace function public.log_subscription_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  paid_tiers constant text[] := array['starter', 'pro', 'elite'];
  new_paid   boolean := lower(coalesce(new.subscription_plan, '')) = any (paid_tiers);
  old_paid   boolean := false;
  new_sub_id text := coalesce(new.razorpay_subscription_id, new.iap_subscription_id, new.stripe_subscription_id);
  fresh_id   boolean := false;
  purchase   boolean := false;
begin
  if tg_op = 'UPDATE' then
    if new.subscription_plan        is not distinct from old.subscription_plan
       and new.billing_cycle         is not distinct from old.billing_cycle
       and new.payment_gateway       is not distinct from old.payment_gateway
       and new.razorpay_subscription_id is not distinct from old.razorpay_subscription_id
       and new.iap_subscription_id   is not distinct from old.iap_subscription_id
       and new.stripe_subscription_id is not distinct from old.stripe_subscription_id then
      return new;  -- unrelated profile edit
    end if;
    old_paid := lower(coalesce(old.subscription_plan, '')) = any (paid_tiers);
    fresh_id := (new.razorpay_subscription_id is not null and new.razorpay_subscription_id is distinct from old.razorpay_subscription_id)
             or (new.iap_subscription_id      is not null and new.iap_subscription_id      is distinct from old.iap_subscription_id)
             or (new.stripe_subscription_id   is not null and new.stripe_subscription_id  is distinct from old.stripe_subscription_id);
  else
    -- INSERT: only log a row that is born with an entitlement.
    if not new_paid then
      return new;
    end if;
    fresh_id := new_sub_id is not null;
  end if;

  purchase := new_paid
    and new.payment_gateway is not null
    and new.payment_gateway <> 'admin'
    and (not old_paid or fresh_id);

  insert into public.subscription_events
    (user_id, old_plan, new_plan, old_cycle, new_cycle, old_gateway, new_gateway, subscription_id, is_new_purchase)
  values (
    new.influencer_id,
    case when tg_op = 'UPDATE' then old.subscription_plan end,
    new.subscription_plan,
    case when tg_op = 'UPDATE' then old.billing_cycle end,
    new.billing_cycle,
    case when tg_op = 'UPDATE' then old.payment_gateway end,
    new.payment_gateway,
    new_sub_id,
    purchase
  );
  return new;
exception when others then
  -- Analytics must never block a payment webhook from granting a plan.
  raise warning 'log_subscription_event failed: %', sqlerrm;
  return new;
end;
$$;

revoke all on function public.log_subscription_event() from public, anon, authenticated;

drop trigger if exists influencer_profiles_subscription_event on public.influencer_profiles;
create trigger influencer_profiles_subscription_event
  after insert or update of subscription_plan, billing_cycle, payment_gateway,
    razorpay_subscription_id, iap_subscription_id, stripe_subscription_id
  on public.influencer_profiles
  for each row execute function public.log_subscription_event();
