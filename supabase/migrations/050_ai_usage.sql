-- Per-creator AI generation usage — powers monthly quota enforcement (Starter
-- 25 / Pro 150 / Elite unlimited) and Section-6 usage insight. One row per
-- (user, calendar month, tool); the ai-generate edge fn upserts + increments.
create table if not exists public.ai_generation_usage (
  user_id uuid not null references public.influencer_profiles(influencer_id) on delete cascade,
  period text not null,                 -- 'YYYY-MM' calendar month
  tool text not null,                   -- 'caption' | 'script' | 'pitch' | ...
  count int not null default 0,
  tokens_in bigint not null default 0,
  tokens_out bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, period, tool)
);

create index if not exists ai_generation_usage_user_period_idx
  on public.ai_generation_usage (user_id, period);

alter table public.ai_generation_usage enable row level security;
-- Creators read their own usage (for the quota meter); writes only via the
-- service-role edge fn.
drop policy if exists "ai_usage_own_read" on public.ai_generation_usage;
create policy "ai_usage_own_read" on public.ai_generation_usage
  for select using (user_id = auth.uid());

-- Atomic increment used by the edge fn after a successful generation. Runs as
-- the owner (service role), so it can upsert regardless of the read policy.
create or replace function public.bump_ai_usage(
  p_user uuid, p_period text, p_tool text, p_in bigint, p_out bigint
) returns void language sql security definer as $$
  insert into public.ai_generation_usage (user_id, period, tool, count, tokens_in, tokens_out, updated_at)
  values (p_user, p_period, p_tool, 1, p_in, p_out, now())
  on conflict (user_id, period, tool) do update
    set count = public.ai_generation_usage.count + 1,
        tokens_in = public.ai_generation_usage.tokens_in + excluded.tokens_in,
        tokens_out = public.ai_generation_usage.tokens_out + excluded.tokens_out,
        updated_at = now();
$$;
revoke all on function public.bump_ai_usage(uuid, text, text, bigint, bigint) from public, anon, authenticated;
