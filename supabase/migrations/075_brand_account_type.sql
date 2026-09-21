-- Brand or agency.
--
-- Admins label each brand account (registered or invited) as a direct brand
-- or an agency acting for brands. Set from the admin portal's Brands list;
-- used there as a badge and as a filter on the Brands and Campaigns lists.
-- Everything existing defaults to 'brand'.

alter table public.brand_profiles
  add column if not exists account_type text not null default 'brand';
alter table public.brand_invitations
  add column if not exists account_type text not null default 'brand';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'brand_profiles_account_type_check') then
    alter table public.brand_profiles
      add constraint brand_profiles_account_type_check check (account_type in ('brand', 'agency'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'brand_invitations_account_type_check') then
    alter table public.brand_invitations
      add constraint brand_invitations_account_type_check check (account_type in ('brand', 'agency'));
  end if;
end $$;

comment on column public.brand_profiles.account_type is 'brand | agency — admin-set label (admin portal Brands list).';
comment on column public.brand_invitations.account_type is 'brand | agency — admin-set label; copied to brand_profiles when the invitation is claimed.';

-- Carry the label over when an invited brand signs up. create-profile claims
-- the invitation by setting brand_profile_id after it has written the
-- profile row, so the target row exists by the time this fires. Only an
-- 'agency' label needs copying — 'brand' is already the profile default.
create or replace function public.brand_invitation_copy_account_type()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.brand_profile_id is not null
     and new.brand_profile_id is distinct from old.brand_profile_id
     and new.account_type = 'agency' then
    update public.brand_profiles
       set account_type = 'agency'
     where brand_id = new.brand_profile_id;
  end if;
  return new;
end;
$$;

drop trigger if exists brand_invitation_copy_account_type on public.brand_invitations;
create trigger brand_invitation_copy_account_type
  after update of brand_profile_id on public.brand_invitations
  for each row execute function public.brand_invitation_copy_account_type();
