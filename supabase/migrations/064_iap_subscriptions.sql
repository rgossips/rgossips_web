-- Store-billing subscriptions (Apple IAP / Google Play Billing).
--
-- Creator plans are digital goods consumed inside the app, so both stores
-- REQUIRE their own billing rail on mobile — Razorpay checkout for a
-- subscription is what Apple guideline 3.1.1 and Google's payments policy
-- prohibit. The inverse is equally true and is why brand payments stay on
-- Razorpay: escrow funding and service orders buy a real-world service from a
-- person, and store billing may not be used for those (Apple 3.1.5(a)).
--
-- Entitlement stays where it already lives: influencer_profiles.subscription_plan,
-- with payment_gateway recording the rail ('razorpay' | 'stripe' | 'apple_iap' |
-- 'google_play'). The rest of the app reads getEffectivePlan() and does not care
-- how it was paid, so a plan bought on iOS is live on the web immediately.
--
-- This table is the store-side ledger behind that entitlement: what was bought,
-- which store identity owns it, and when it lapses. It exists separately from
-- the profile because a subscription has a lifecycle the profile does not model
-- — grace periods, billing retry, refunds, resubscribes — and renewals arrive
-- from the stores asynchronously long after the purchase.

create table if not exists public.iap_subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null,
  platform              text not null,
  -- Store SKU, e.g. 'rgossips.pro.monthly'.
  product_id            text not null,
  -- Resolved entitlement. Kept denormalised so a lapse can restore the right
  -- plan without re-parsing SKU strings.
  plan_id               text not null,
  billing_cycle         text not null,
  -- The store's STABLE identity for the subscription across renewals:
  -- Apple's originalTransactionId, Google's purchaseToken. Renewals change the
  -- transaction but never this, which is what makes it the dedupe key.
  store_subscription_id text not null,
  -- Newest transaction seen. Moves on every renewal; useful for support.
  latest_transaction_id text,
  status                text not null default 'active',
  expires_at            timestamptz,
  auto_renewing         boolean not null default true,
  -- 'production' | 'sandbox'. A sandbox purchase must never grant a real plan
  -- outside review, so the verifier checks this.
  environment           text not null default 'production',
  -- Last verified payload from the store, for support and dispute handling.
  raw                   jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint iap_subscriptions_platform_chk
    check (platform in ('ios','android')),
  constraint iap_subscriptions_plan_chk
    check (plan_id in ('starter','pro','elite')),
  constraint iap_subscriptions_cycle_chk
    check (billing_cycle in ('monthly','annual')),
  constraint iap_subscriptions_status_chk
    check (status in ('active','grace','on_hold','paused','cancelled','expired','refunded')),
  constraint iap_subscriptions_env_chk
    check (environment in ('production','sandbox')),
  -- One row per store subscription. The verifier upserts on this, so a replayed
  -- receipt updates the existing row instead of minting a duplicate entitlement.
  constraint iap_subscriptions_store_uniq unique (platform, store_subscription_id)
);

create index if not exists idx_iap_subscriptions_user
  on public.iap_subscriptions (user_id, status);

-- Drives the lapse sweep: find everything past expiry that still reads active.
create index if not exists idx_iap_subscriptions_expiry
  on public.iap_subscriptions (expires_at)
  where status in ('active','grace');

alter table public.iap_subscriptions enable row level security;

-- A user sees their own subscriptions (for a "manage subscription" screen).
-- Writes are service-role only — the verifier and the store webhook.
drop policy if exists "iap_subscriptions_read_own" on public.iap_subscriptions;
create policy "iap_subscriptions_read_own" on public.iap_subscriptions
  for select to authenticated using (user_id = auth.uid());

-- ─────────────────────── profile linkage ───────────────────────

-- Mirrors stripe_subscription_id / razorpay_subscription_id so the
-- single-active-subscription logic in the webhooks can see a store
-- subscription and cancel the right thing on a gateway switch.
alter table public.influencer_profiles
  add column if not exists iap_subscription_id text;

comment on column public.influencer_profiles.iap_subscription_id is
  'Store subscription identity (Apple originalTransactionId / Google purchaseToken) backing the current plan, when payment_gateway is apple_iap or google_play.';
