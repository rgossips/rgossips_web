-- Central AI configuration, editable from the admin console
-- (/dashboard/ai-settings). Holds the active provider, the model per "task
-- class", and the per-provider API keys the admin enters/rotates.
--
-- SECURITY: the API keys are secrets. RLS is enabled with NO policies, so every
-- client role (anon / authenticated / publishable-key callers) is denied all
-- access. Only the service role — used by the AI edge functions and the admin
-- server actions (createAdminClient) — bypasses RLS and can read/write this
-- table. Keys must NEVER be returned to the browser un-masked (the admin read
-- action masks them; see rgossips-admin ai-settings/actions.ts).

create table if not exists public.ai_config (
  id int primary key default 1,
  enabled boolean not null default true,
  active_provider text not null default 'anthropic'
    check (active_provider in ('anthropic', 'openai', 'gemini')),
  -- Concrete model per task class. cheap = high-volume text (captions/hooks),
  -- standard = scripts/brief/media-kit, reasoning = pitch/rate/audit/copilot,
  -- multimodal = video/image pre-flight.
  model_cheap text not null default 'claude-haiku-4-5-20251001',
  model_standard text not null default 'claude-sonnet-5',
  model_reasoning text not null default 'claude-sonnet-5',
  model_multimodal text not null default 'claude-sonnet-5',
  -- Per-provider API keys (nullable; set/rotated from the admin). Secrets.
  -- The adapter falls back to the matching Deno env secret when a column is
  -- null, so keys can live in Supabase secrets OR be entered in the admin.
  anthropic_api_key text,
  openai_api_key text,
  gemini_api_key text,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  constraint ai_config_singleton check (id = 1)
);

-- Singleton row.
insert into public.ai_config (id) values (1) on conflict (id) do nothing;

alter table public.ai_config enable row level security;
-- Intentionally NO policies → all client roles denied; service role only.
