-- "Mark as read" for the admin notification bell.
--
-- The admin bell has no notifications table behind it. Every item is DERIVED
-- on each poll from the source tables — a pending quote, a campaign in
-- review, a payout past its release date, a stalled delivery, a callback
-- request. That design is deliberate (see CLAUDE.md: to add an admin
-- notification you add a stream, not a row), and it means an item disappears
-- by itself the moment the underlying work is done.
--
-- What it cannot do is let an admin say "I have seen this and cannot act on
-- it yet". There is nowhere to write that. This table is that one piece of
-- state, and nothing else: an (admin, item) pair they have dismissed.
--
-- `item_key` is the bell's own synthetic id — "callback-<uuid>",
-- "payout-<application id>", "adminupd-<history id>" — so a key is stable
-- for as long as the underlying row exists and becomes dead weight once it
-- does not. Per admin, because one person reading something does not mean
-- the next person has.
--
-- RLS on with no policies, as in 074 and 081: the admin portal reaches this
-- through the service-role client only.

CREATE TABLE IF NOT EXISTS public.admin_notification_reads (
  actor_id  uuid        NOT NULL,
  item_key  text        NOT NULL,
  read_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (actor_id, item_key)
);

-- The bell reads every key for one admin on each poll, so that is the index
-- the primary key already gives us. This one is for the prune below.
CREATE INDEX IF NOT EXISTS admin_notification_reads_read_at_idx
  ON public.admin_notification_reads (read_at);

ALTER TABLE public.admin_notification_reads ENABLE ROW LEVEL SECURITY;

-- Keys outlive the rows they point at — a dismissed callback is closed and
-- gone, but its key sits here forever. Harmless at this size, but a cron or
-- an admin can call this to keep it tidy.
CREATE OR REPLACE FUNCTION public.prune_admin_notification_reads(keep_days int DEFAULT 90)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.admin_notification_reads
  WHERE read_at < now() - (keep_days || ' days')::interval;
$$;
