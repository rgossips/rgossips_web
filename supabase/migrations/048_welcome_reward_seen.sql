-- Server-side "seen" flag for the one-time welcome-reward ("Congratulations")
-- modal, so it never re-shows across devices / after localStorage is cleared.
alter table public.influencer_profiles
  add column if not exists welcome_reward_seen boolean not null default false;

comment on column public.influencer_profiles.welcome_reward_seen is
  'True once the influencer has dismissed the one-time welcome-reward celebration modal.';
