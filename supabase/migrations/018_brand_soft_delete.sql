-- Soft-delete lifecycle for brand_profiles.
--
-- Three status values matter here:
--   active            — normal account
--   deactivated       — user paused themselves; next OTP sign-in
--                       auto-reactivates (see verify-otp).
--   pending_deletion  — user requested deletion; sign-in is BLOCKED
--                       until an admin restores the row. After 30 days
--                       past `deleted_at` the purge script hard-deletes
--                       everything (campaigns, applications, the brand
--                       row itself, and the auth.users entry).

do $$ begin
  alter table public.brand_profiles add column deleted_at timestamptz;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table public.brand_profiles add column deletion_reason text;
exception when duplicate_column then null;
end $$;

create index if not exists brand_profiles_pending_deletion_idx
  on public.brand_profiles (deleted_at)
  where status = 'pending_deletion';
