-- Append-only AI generation event log — powers the admin "AI Usage" analytics
-- dashboard (influencer-wise / feature-wise / provider-wise + estimated cost).
--
-- WHY a second table when ai_generation_usage (050) already meters tokens:
-- that table is a per-(user,month,tool) AGGREGATE whose job is quota
-- enforcement, and it records neither provider nor model. Widening its grain
-- would ripple into every quota reader in the consumer app. This log is a
-- separate, append-only stream — one row per generation — carrying the
-- provider/model the aggregate throws away, without touching the quota path.
-- The ai-generate edge fn writes BOTH: bump_ai_usage (quota) + one row here.

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  -- Keep the event even if the creator is later deleted, so historical spend
  -- analytics stay intact (attribution just becomes null = "unknown").
  user_id uuid references public.influencer_profiles(influencer_id) on delete set null,
  tool text not null,                 -- caption | script | pitch | ... (feature)
  task_class text,                    -- cheap | standard | reasoning | multimodal
  provider text,                      -- anthropic | openai | gemini
  model text,                         -- concrete model id that served the call
  tokens_in bigint not null default 0,
  tokens_out bigint not null default 0,
  created_at timestamptz not null default now()
);

-- Breakdown queries all filter on a time window then group.
create index if not exists ai_usage_events_created_idx on public.ai_usage_events (created_at);
create index if not exists ai_usage_events_user_idx on public.ai_usage_events (user_id, created_at);
create index if not exists ai_usage_events_provider_idx on public.ai_usage_events (provider, created_at);
create index if not exists ai_usage_events_tool_idx on public.ai_usage_events (tool, created_at);

-- Analytics is admin-only. RLS on with NO policies → every client role denied;
-- only the service role (admin dashboard + the edge fn writer) touches it.
alter table public.ai_usage_events enable row level security;

-- Editable per-model price map for the admin's cost ESTIMATE, kept on the
-- existing service-role-only singleton. Shape: { "<model>": { "in": <usd per
-- 1M input tokens>, "out": <usd per 1M output tokens> }, ... }. The admin app
-- falls back to a built-in default map for any model absent here.
alter table public.ai_config add column if not exists model_pricing jsonb not null default '{}'::jsonb;

-- Compact rollup grouped by (provider, model, tool). Cardinality is bounded by
-- providers×models×tools (tiny), so the admin pulls this instead of raw rows
-- and derives the provider view, the feature view, the totals, and — because
-- `model` is present — the exact estimated cost, all in memory.
create or replace function public.ai_usage_rollup(p_from timestamptz, p_to timestamptz)
returns table (provider text, model text, tool text, gens bigint, tokens_in bigint, tokens_out bigint)
language sql stable security definer as $$
  select coalesce(provider, 'unknown'), coalesce(model, 'unknown'), tool,
         count(*)::bigint, coalesce(sum(tokens_in), 0)::bigint, coalesce(sum(tokens_out), 0)::bigint
  from public.ai_usage_events
  where created_at >= p_from and created_at < p_to
  group by 1, 2, 3;
$$;
revoke all on function public.ai_usage_rollup(timestamptz, timestamptz) from public, anon, authenticated;

-- Per-influencer rollup, ranked, top N. No model dimension (kept lean); the
-- admin shows exact gens/tokens per creator and a blended cost estimate.
create or replace function public.ai_usage_by_user(p_from timestamptz, p_to timestamptz, p_limit int default 100)
returns table (user_id uuid, gens bigint, tokens_in bigint, tokens_out bigint)
language sql stable security definer as $$
  select user_id, count(*)::bigint, coalesce(sum(tokens_in), 0)::bigint, coalesce(sum(tokens_out), 0)::bigint
  from public.ai_usage_events
  where created_at >= p_from and created_at < p_to
  group by user_id
  order by count(*) desc
  limit greatest(p_limit, 1);
$$;
revoke all on function public.ai_usage_by_user(timestamptz, timestamptz, int) from public, anon, authenticated;
