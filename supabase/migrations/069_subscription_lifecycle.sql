-- Cancelled-but-still-paid-for subscriptions.
--
-- The profile only ever recorded the CURRENT entitlement
-- (subscription_plan + the gateway ids). It had no way to express the state a
-- subscription actually spends most of its final month in: the creator has
-- turned off auto-renew at the gateway, but they have paid through the end of
-- the cycle and are still entitled until then.
--
-- With nowhere to put that, `razorpay-webhook` handled
-- `subscription.cancelled` by immediately writing `subscription_plan =
-- 'starter'`. Two things were wrong with it:
--
--   1. It took away access the creator had already paid for, the moment they
--      cancelled, with no visible reason.
--   2. `starter` was the free floor when that was written. It is not any more
--      — since the trial was removed (see the free-tier section in CLAUDE.md)
--      `starter` is a paid ₹99/month tier and `free` is the floor. So
--      "downgrading" a cancelled subscriber to starter GRANTS them a paid tier
--      for free, forever. The same line exists in the Stripe webhook and both
--      IAP paths.
--
-- Three columns, and entitlement becomes a function of the date:
--
--   auto_renew                — false once the creator (or the gateway) stops
--                               the recurring charge. This is what the
--                               "auto-renew is off" notice reads.
--   plan_expires_at           — paid through. NULL means "no known end", which
--                               is every existing row and must NEVER lapse
--                               anyone; only a non-null date in the past does.
--   subscription_cancelled_at — when we learned about it, for support.
--
-- getEffectivePlan() (web, mobile and _shared/plan.ts) now returns `free` once
-- plan_expires_at has passed, so entitlement is correct even if the lapse
-- sweep is late or a webhook never arrives. The sweep is hygiene, not the
-- boundary.

alter table public.influencer_profiles
  add column if not exists auto_renew boolean not null default true,
  add column if not exists plan_expires_at timestamptz,
  add column if not exists subscription_cancelled_at timestamptz;

comment on column public.influencer_profiles.auto_renew is
  'False when the recurring charge has been stopped at the gateway. The plan may still be live until plan_expires_at.';

comment on column public.influencer_profiles.plan_expires_at is
  'Paid through. NULL = no known end (never lapses). A past value means the plan has lapsed and getEffectivePlan returns free.';

comment on column public.influencer_profiles.subscription_cancelled_at is
  'When the cancellation was recorded. Support/audit only — entitlement is decided by plan_expires_at.';

-- The lapse sweep scans for paid plans whose date has passed.
create index if not exists influencer_profiles_plan_expiry_idx
  on public.influencer_profiles (plan_expires_at)
  where plan_expires_at is not null;

-- Deliberately NOT backfilled. We do not know the period end of any existing
-- subscription — Razorpay/Stripe hold it, not us — and inventing one would
-- either cut someone off early or extend them for free. Existing rows keep
-- plan_expires_at NULL (never lapses) until reconcile-subscription or a
-- webhook fills it in from the gateway's own current_end.
