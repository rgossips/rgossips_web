-- Move the push fan-out trigger's endpoint + shared secret out of DB GUCs and
-- into a single-row, service-role-only config table. This lets the operator set
-- them via the service-role REST API (no ALTER DATABASE, no secret in git),
-- while the SECURITY DEFINER trigger still reads them regardless of RLS.

create table if not exists public.push_runtime_config (
  id         smallint primary key default 1 check (id = 1),
  endpoint   text,
  secret     text,
  updated_at timestamptz not null default now()
);
alter table public.push_runtime_config enable row level security;
-- No policies → only the service role (edge fns / trigger owner) can read/write.

insert into public.push_runtime_config (id) values (1) on conflict (id) do nothing;

create or replace function public.tg_notifications_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  cfg record;
begin
  select endpoint, secret into cfg from public.push_runtime_config where id = 1;
  if cfg.endpoint is null or cfg.endpoint = '' then
    return new; -- push not configured → no-op
  end if;

  perform net.http_post(
    url := cfg.endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', coalesce(cfg.secret, '')
    ),
    body := jsonb_build_object(
      'userId', new.user_id,
      'type',   new.type,
      'title',  new.title,
      'body',   new.body
    )
  );
  return new;
exception when others then
  return new; -- never break the notification insert on a push hiccup
end;
$$;

-- The trigger itself (notifications_push_after_insert) was created in 056 and
-- calls this function, so replacing the function is enough.
