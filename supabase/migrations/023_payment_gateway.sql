-- Multi-gateway billing. Stripe was the original integration; Razorpay is
-- now a second option. Each user's subscription is owned by exactly one
-- gateway (whichever they chose at checkout) — payment_gateway tracks that.
-- Pre-existing rows that paid through Stripe stay as 'stripe' by default
-- so the webhook flow they're already tied to continues to find them.
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS payment_gateway TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;

-- Backfill existing paid subscribers as Stripe so the gateway column is
-- never NULL for an active subscription.
UPDATE influencer_profiles
  SET payment_gateway = 'stripe'
WHERE payment_gateway IS NULL
  AND stripe_subscription_id IS NOT NULL;
