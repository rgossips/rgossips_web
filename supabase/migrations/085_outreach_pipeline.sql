-- The outreach tracker becomes one linear pipeline with two owners.
--
-- The old ladder had 18 stages and branched on fulfilment_mode (ship /
-- reimburse / none), which modelled the product leg in detail but said
-- nothing about WHO was waiting on WHOM. The replacement is nine stages
-- that alternate between the team and the approver, so every row answers
-- "whose move is it" without reading three columns:
--
--   proposed        approver   approve the creator and the quote
--   shortlisted     team       reach out
--   outreach        team       close on a quote
--   quote_review    approver   approve the agreed quote
--   product         team       creator buys, team reimburses
--   content         team       collect the review and reels
--   content_review  approver   review what was submitted
--   payout          approver   pay, or send the barter product
--   closed          —          done
--   dropped         —          not proceeding
--
-- `proposed` is the genuinely new idea: a team member can put a creator
-- forward and the approver decides before anyone spends time on outreach.
--
-- MIGRATING THE 64 EXISTING ROWS. Measured before writing this, so the
-- mapping covers exactly what is there and nothing speculative:
--   price_agreed      61  -> quote_review   (they were awaiting sign-off)
--   draft_received     1  -> content_review
--   product_purchased  1  -> product
--   cancelled          1  -> dropped
-- The remaining old values are mapped too, because the Vega import and the
-- historical backfill can still write them until that code ships, and a row
-- left holding an old value would fail the new CHECK.

ALTER TABLE public.campaign_bookings
  DROP CONSTRAINT IF EXISTS campaign_bookings_stage_check;

UPDATE public.campaign_bookings SET stage = CASE stage
  WHEN 'shortlisted'       THEN 'shortlisted'
  WHEN 'contacted'         THEN 'outreach'
  WHEN 'price_agreed'      THEN 'quote_review'
  WHEN 'confirmed'         THEN 'product'
  WHEN 'product_purchased' THEN 'product'
  WHEN 'product_approved'  THEN 'product'
  WHEN 'product_shipped'   THEN 'product'
  WHEN 'reimbursed'        THEN 'content'
  WHEN 'product_delivered' THEN 'content'
  WHEN 'script_shared'     THEN 'content'
  WHEN 'revision_needed'   THEN 'content'
  WHEN 'draft_received'    THEN 'content_review'
  WHEN 'admin_approved'    THEN 'payout'
  WHEN 'brand_approved'    THEN 'payout'
  WHEN 'live'              THEN 'payout'
  WHEN 'fee_paid'          THEN 'closed'
  WHEN 'declined'          THEN 'dropped'
  WHEN 'cancelled'         THEN 'dropped'
  ELSE stage
END;

ALTER TABLE public.campaign_bookings
  ADD CONSTRAINT campaign_bookings_stage_check
  CHECK (stage IN (
    'proposed', 'shortlisted', 'outreach', 'quote_review', 'product',
    'content', 'content_review', 'payout', 'closed', 'dropped'
  ));

ALTER TABLE public.campaign_bookings
  -- Instagram / YouTube. The pipeline is the same either way; it is shown
  -- beside the handle so an admin knows where they are reaching out.
  ADD COLUMN IF NOT EXISTS platform text,
  -- How the collaboration was settled. Cash carries the agreed fee;
  -- barter carries what was sent instead, which is the thing nobody could
  -- record before and the reason "what did we actually give them" was
  -- unanswerable on finished rows.
  ADD COLUMN IF NOT EXISTS payout_mode text,
  ADD COLUMN IF NOT EXISTS payout_detail text;

ALTER TABLE public.campaign_bookings
  DROP CONSTRAINT IF EXISTS campaign_bookings_payout_mode_check;
ALTER TABLE public.campaign_bookings
  ADD CONSTRAINT campaign_bookings_payout_mode_check
  CHECK (payout_mode IS NULL OR payout_mode IN ('Cash', 'Barter'));

-- The stage index from 081 still applies; this only widens what it holds.
COMMENT ON COLUMN public.campaign_bookings.stage IS
  'Outreach pipeline: proposed | shortlisted | outreach | quote_review | product | content | content_review | payout | closed | dropped. Stages alternate between the team and the approver — see lib/sourcing/stages.ts.';
COMMENT ON COLUMN public.campaign_bookings.payout_mode IS
  'Cash (agreed_fee_paise) or Barter (payout_detail says what was sent).';
