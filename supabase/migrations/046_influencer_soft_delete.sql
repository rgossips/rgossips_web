-- Soft-delete lifecycle for influencer_profiles — mirrors 018_brand_soft_delete.
--
-- Status values:
--   active            — normal account
--   deactivated       — user paused themselves; next OTP sign-in
--                       auto-reactivates (see whatsapp-otp-verifier).
--   pending_deletion  — user requested deletion; OTP sign-in is BLOCKED
--                       (verifier already refuses both roles). After 30 days
--                       past `deleted_at` the admin purge / delete flow
--                       hard-deletes the account. Only admin can restore.

do $$ begin
  alter table public.influencer_profiles add column deleted_at timestamptz;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public.influencer_profiles add column deletion_reason text;
exception when duplicate_column then null;
end $$;

create index if not exists influencer_profiles_pending_deletion_idx
  on public.influencer_profiles (deleted_at)
  where status = 'pending_deletion';
