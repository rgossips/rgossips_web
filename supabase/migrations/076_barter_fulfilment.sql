-- Barter fulfilment — how the product actually reaches the creator.
--
-- A barter campaign pays in product, so the deal isn't done when the content
-- goes live: something has to be shipped (or collected), and somebody has to
-- confirm it arrived. None of that had a home. The campaign already declares
-- HOW, in the description trailer's `shipping_required` ('no' | 'yes' |
-- 'pickup') with `shipping_timeline_days` beside it; what was missing is the
-- per-application half — where to send it, what the tracking is, and whether
-- it turned up.
--
-- Additive columns on campaign_applications rather than a new table: this is
-- one-to-one with an application, the brand already reads that row, and the
-- creator's RLS policy (035, applications_creator_self_rw) already lets them
-- maintain their own — no new policy, no new join on every read.
--
-- Money columns next door are a mix of paise and rupees; nothing here is
-- money, so the trap doesn't apply.

ALTER TABLE public.campaign_applications
  -- Where the product goes. Collected at apply time for a shipped campaign,
  -- editable afterwards (people move, or they applied before we asked), and
  -- frozen once tracking exists — after dispatch a new address is a lie.
  ADD COLUMN IF NOT EXISTS shipping_address text,
  ADD COLUMN IF NOT EXISTS shipping_address_updated_at timestamptz,
  -- Set when we email a creator to ask for a missing address, so the ask is
  -- not repeated on every completion and "asked but never answered" is a
  -- state an admin can see.
  ADD COLUMN IF NOT EXISTS shipping_address_requested_at timestamptz,

  -- Dispatch. Added by the brand or an admin, any time after the work is
  -- complete — which is why it is deliberately NOT a status: an application
  -- can sit at 'completed' for a week before anything ships.
  ADD COLUMN IF NOT EXISTS shipping_tracking_url text,
  ADD COLUMN IF NOT EXISTS shipping_carrier text,
  ADD COLUMN IF NOT EXISTS shipping_tracking_added_at timestamptz,
  ADD COLUMN IF NOT EXISTS shipping_tracking_added_by uuid,
  -- When the creator should have it by: tracking time + the campaign's
  -- shipping_timeline_days. Stored rather than derived because the campaign's
  -- trailer can be edited later, and a reminder that moves is worse than none.
  ADD COLUMN IF NOT EXISTS shipping_expected_at timestamptz,

  -- Did it arrive? NULL = the creator hasn't said yet, which is what the
  -- reminder chases. false is a real answer and means something went wrong.
  ADD COLUMN IF NOT EXISTS product_received boolean,
  ADD COLUMN IF NOT EXISTS product_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS product_feedback text,
  ADD COLUMN IF NOT EXISTS product_feedback_at timestamptz,
  -- Set when the creator is reminded, so the chaser fires once a day at most
  -- and never twice for the same silence.
  ADD COLUMN IF NOT EXISTS receipt_reminded_at timestamptz;

-- The admin fulfilment queue asks one question: which completed barter
-- applications have no tracking yet? Partial index — the answered ones are
-- the vast majority over time and never need scanning.
CREATE INDEX IF NOT EXISTS campaign_applications_awaiting_tracking_idx
  ON public.campaign_applications (status, updated_at DESC)
  WHERE shipping_tracking_url IS NULL;

-- And which shipped ones are overdue with no word from the creator.
CREATE INDEX IF NOT EXISTS campaign_applications_awaiting_receipt_idx
  ON public.campaign_applications (shipping_expected_at)
  WHERE shipping_tracking_url IS NOT NULL AND product_received IS NULL;

-- ──────────────────────────────────────────────────────────────────
-- Who may write what
-- ──────────────────────────────────────────────────────────────────
-- The creator's policy is FOR ALL on their own row (035), so without a guard
-- they could set their own tracking URL and mark their own dispatch — the
-- brand's side of the deal. The service role bypasses RLS and is unaffected,
-- so the edge function and the admin portal keep full control; this only
-- constrains a client holding the creator's own JWT.
CREATE OR REPLACE FUNCTION public.guard_barter_fulfilment_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Service role (edge functions, admin portal) writes anything.
  IF coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
     OR current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Everyone else: dispatch fields are read-only.
  IF NEW.shipping_tracking_url IS DISTINCT FROM OLD.shipping_tracking_url
     OR NEW.shipping_carrier IS DISTINCT FROM OLD.shipping_carrier
     OR NEW.shipping_tracking_added_at IS DISTINCT FROM OLD.shipping_tracking_added_at
     OR NEW.shipping_tracking_added_by IS DISTINCT FROM OLD.shipping_tracking_added_by
     OR NEW.shipping_expected_at IS DISTINCT FROM OLD.shipping_expected_at THEN
    RAISE EXCEPTION 'Shipping tracking is set by the brand, not the creator';
  END IF;

  -- And an address cannot be rewritten after dispatch.
  IF OLD.shipping_tracking_url IS NOT NULL
     AND NEW.shipping_address IS DISTINCT FROM OLD.shipping_address THEN
    RAISE EXCEPTION 'The address cannot change once the product has shipped';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_barter_fulfilment ON public.campaign_applications;
CREATE TRIGGER guard_barter_fulfilment
  BEFORE UPDATE ON public.campaign_applications
  FOR EACH ROW EXECUTE FUNCTION public.guard_barter_fulfilment_fields();
