-- How the product reaches a sourced creator — per booking, not per campaign.
--
-- 081 assumed one route: the creator buys the product on our say-so, uploads
-- a receipt, and we reimburse them. That is only half of what actually
-- happens. On the same campaign, some creators are sent the product by the
-- brand and others are asked to buy it — which is why the Vega sheet carried
-- both a "Product Cost" column AND delivery addresses on 32 rows.
--
-- So the route is a property of the BOOKING. Two modes, and a third for the
-- campaigns where nothing physical moves at all:
--
--   reimburse — the creator buys it, we approve the receipt, we pay them back
--   ship      — we or the brand send it, we record tracking, they confirm it
--   none      — a service, a stay, anything with no parcel
--
-- The mode decides which stages are reachable (see lib/sourcing/stages.ts)
-- and therefore which payout legs can ever be queued: a shipped booking has
-- no reimbursement, because the creator was never out of pocket.

ALTER TABLE public.campaign_bookings
  ADD COLUMN IF NOT EXISTS fulfilment_mode text NOT NULL DEFAULT 'reimburse',

  -- The shipping half. Mirrors the columns migration 076 added to
  -- campaign_applications, deliberately: an admin looking at a parcel should
  -- see the same fields whether the creator applied or was sourced.
  ADD COLUMN IF NOT EXISTS shipping_tracking_url text,
  ADD COLUMN IF NOT EXISTS shipping_carrier text,
  ADD COLUMN IF NOT EXISTS shipping_tracking_added_at timestamptz,
  ADD COLUMN IF NOT EXISTS shipping_tracking_added_by uuid,
  ADD COLUMN IF NOT EXISTS shipping_expected_at timestamptz,
  ADD COLUMN IF NOT EXISTS product_received boolean,
  ADD COLUMN IF NOT EXISTS product_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS product_feedback text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaign_bookings_fulfilment_mode_check'
  ) THEN
    ALTER TABLE public.campaign_bookings
      ADD CONSTRAINT campaign_bookings_fulfilment_mode_check
      CHECK (fulfilment_mode IN ('reimburse', 'ship', 'none'));
  END IF;
END$$;

-- The stage list grows by two. A CHECK cannot be widened in place, so it is
-- dropped and rebuilt — deploy this BEFORE any code that writes the new
-- stages, or the write is a hard 400.
ALTER TABLE public.campaign_bookings
  DROP CONSTRAINT IF EXISTS campaign_bookings_stage_check;

ALTER TABLE public.campaign_bookings
  ADD CONSTRAINT campaign_bookings_stage_check CHECK (stage IN (
    'shortlisted', 'contacted', 'price_agreed', 'confirmed',
    -- reimburse route
    'product_purchased', 'product_approved', 'reimbursed',
    -- ship route
    'product_shipped', 'product_delivered',
    -- shared from here on
    'script_shared', 'draft_received', 'revision_needed',
    'admin_approved', 'brand_approved', 'live', 'fee_paid',
    'declined', 'cancelled'
  ));

-- Which bookings are waiting on a parcel somebody has to send.
CREATE INDEX IF NOT EXISTS campaign_bookings_awaiting_dispatch_idx
  ON public.campaign_bookings (campaign_id, stage)
  WHERE fulfilment_mode = 'ship' AND shipping_tracking_url IS NULL;
