-- Outreach tracker: who owns reaching out to a sourced creator, what came
-- back from them, and who signed off on the price.
--
-- WHY THESE ARE COLUMNS AND NOT NEW STAGES. `stage` has a CHECK constraint
-- and describes where the DELIVERABLE is — purchased, shipped, script
-- shared, live. Whether anyone has managed to get hold of the creator is a
-- different axis entirely: a booking can be "contacted, never picked up the
-- phone" and that says nothing about the product leg. Modelling the outreach
-- outcome as stages would make the ladder in lib/sourcing/stages.ts branch
-- for each one, and nextStages() is derived from that ladder, so every
-- existing transition would have to be re-reasoned. These columns leave the
-- stage machine untouched.
--
-- Nothing here is backfilled. Existing bookings have assigned_to NULL, which
-- reads as "nobody owns this yet" — correct for rows created before the
-- tracker existed.

ALTER TABLE public.campaign_bookings
  -- The admin responsible for this creator RIGHT NOW. It moves: the admin
  -- picked when the creator is added, then the approver once a price is
  -- agreed, then back again if the approver sends it for renegotiation.
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_by uuid,
  -- Who held it before it went up for approval. Without this, "send back for
  -- renegotiation" has to guess who to send it to.
  ADD COLUMN IF NOT EXISTS outreach_owner uuid,
  -- What came back from the creator. NULL = not contacted yet, which is the
  -- starting state and is NOT the same as "no answer".
  ADD COLUMN IF NOT EXISTS outreach_status text,
  ADD COLUMN IF NOT EXISTS outreach_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS outreach_note text,
  -- Price sign-off. NULL until a price is agreed and the row goes up.
  ADD COLUMN IF NOT EXISTS approval_state text,
  ADD COLUMN IF NOT EXISTS approval_decided_by uuid,
  ADD COLUMN IF NOT EXISTS approval_decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_note text;

-- Dropped first so re-running the migration after adding a value does not
-- fail on the old constraint.
ALTER TABLE public.campaign_bookings
  DROP CONSTRAINT IF EXISTS campaign_bookings_outreach_status_check;
ALTER TABLE public.campaign_bookings
  ADD CONSTRAINT campaign_bookings_outreach_status_check
  CHECK (
    outreach_status IS NULL
    OR outreach_status IN ('not_picked_up', 'declined', 'agreed')
  );

ALTER TABLE public.campaign_bookings
  DROP CONSTRAINT IF EXISTS campaign_bookings_approval_state_check;
ALTER TABLE public.campaign_bookings
  ADD CONSTRAINT campaign_bookings_approval_state_check
  CHECK (
    approval_state IS NULL
    OR approval_state IN ('pending', 'approved', 'rejected', 'renegotiate')
  );

-- "What is on my desk" is the query the tracker runs most, and "what is
-- waiting on the approver" is the second.
CREATE INDEX IF NOT EXISTS campaign_bookings_assigned_idx
  ON public.campaign_bookings (assigned_to)
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS campaign_bookings_approval_idx
  ON public.campaign_bookings (approval_state)
  WHERE approval_state IS NOT NULL;

COMMENT ON COLUMN public.campaign_bookings.outreach_status IS
  'What the creator said: not_picked_up | declined | agreed. NULL = not contacted yet.';
COMMENT ON COLUMN public.campaign_bookings.approval_state IS
  'Price sign-off: pending | approved | rejected | renegotiate. NULL = no price agreed yet.';
COMMENT ON COLUMN public.campaign_bookings.outreach_owner IS
  'The admin who negotiated, retained while the row sits with the approver so it can be sent back.';
