-- Payment methods (UPI / bank) used to receive campaign + service earnings.
-- One user can have multiple methods; exactly one is `is_primary=true` at a
-- time, enforced by a partial unique index.
--
-- Full account numbers live here in plaintext — RLS limits read/write to the
-- owning user; ops accesses via service role for payouts. If you ever
-- introduce client-side encryption keys, encrypt before insert.

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('upi', 'bank')),
  -- Common
  label text not null default '',
  -- UPI
  upi_id text,
  -- Bank
  account_holder_name text,
  bank_name text,
  account_number text,
  ifsc text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_methods_user_idx on public.payment_methods (user_id, created_at desc);

-- At most one primary per user. Using a partial unique index keeps the
-- table writable when a row has is_primary=false (no constraint applies).
create unique index if not exists payment_methods_one_primary_per_user
  on public.payment_methods (user_id) where is_primary = true;

alter table public.payment_methods enable row level security;

drop policy if exists "payment_methods_read_own" on public.payment_methods;
create policy "payment_methods_read_own" on public.payment_methods
  for select using (auth.uid() = user_id);

drop policy if exists "payment_methods_insert_own" on public.payment_methods;
create policy "payment_methods_insert_own" on public.payment_methods
  for insert with check (auth.uid() = user_id);

drop policy if exists "payment_methods_update_own" on public.payment_methods;
create policy "payment_methods_update_own" on public.payment_methods
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "payment_methods_delete_own" on public.payment_methods;
create policy "payment_methods_delete_own" on public.payment_methods
  for delete using (auth.uid() = user_id);
