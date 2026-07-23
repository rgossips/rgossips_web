-- Campaign moderation controls.
--
-- 1. Per-brand auto-approve toggle: when true, campaigns the brand publishes
--    skip the admin review queue and go straight to `active`. Default false —
--    every new campaign lands in `under_review` until an admin approves it.
--    (Campaign status stays a plain text column; `under_review` is the new
--    value used by brand-campaigns.)
-- 2. Brands now sign up with verification_status='pending' (create-profile
--    change) and cannot create campaigns until an admin verifies them.
alter table public.brand_profiles
  add column if not exists auto_approve_campaigns boolean not null default false;
