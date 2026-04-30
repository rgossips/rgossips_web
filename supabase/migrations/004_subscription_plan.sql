-- Subscription plan tracking on the influencer profile.
-- subscription_plan / billing_cycle already exist in some envs (write paths
-- in update-profile already touch them); this migration just guarantees
-- they're present, plus adds Stripe linkage columns.
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
