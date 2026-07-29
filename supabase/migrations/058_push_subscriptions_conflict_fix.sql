-- Fix: register-push upserts with ON CONFLICT (endpoint) / (token), but 056
-- created PARTIAL unique indexes (WHERE platform = 'web'/'fcm'). PostgreSQL
-- only uses a partial unique index for ON CONFLICT if the statement repeats the
-- index predicate — which supabase-js's onConflict can't express — so the
-- upsert failed ("no unique or exclusion constraint matching the ON CONFLICT
-- specification") and device registration silently no-op'd.
--
-- Plain unique indexes work here because NULLs are distinct: web rows have a
-- unique `endpoint` (token NULL), fcm rows have a unique `token` (endpoint
-- NULL), and the many NULLs on the other column never collide.

drop index if exists public.push_sub_web_endpoint_uniq;
drop index if exists public.push_sub_fcm_token_uniq;

create unique index if not exists push_sub_endpoint_uniq
  on public.push_subscriptions (endpoint);
create unique index if not exists push_sub_token_uniq
  on public.push_subscriptions (token);
