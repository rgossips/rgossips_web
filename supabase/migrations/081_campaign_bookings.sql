-- Managed sourcing — creators booked onto a campaign by hand.
--
-- Alongside the self-serve marketplace, RUDE LABS runs campaigns manually: a
-- brand asks for 100 creators, an admin researches them in a spreadsheet, DMs
-- each one, negotiates, collects contact details, ships or reimburses a
-- product, shares a script, collects a video, and pays a fee 48 hours after
-- it goes live. None of that is queryable, nothing reminds anyone, and the
-- creators sourced never enter the platform's own database.
--
-- The campaign itself stays an ordinary campaign. Its seats fill from TWO
-- intake paths at once — creators who apply through the portal, and creators
-- an admin sources by hand — with one counter across both.
--
-- WHY NOT campaign_applications. Migration 055 already settled this for
-- invitations and chose a separate table; the same three reasons hold, plus:
--   * influencer_id is a FK to influencer_profiles and most sourced creators
--     have no profile. Making it nullable defeats UNIQUE (campaign_id,
--     influencer_id) from 041, because SQL NULLs never compare equal.
--   * Migration 035 grants the creator FOR ALL on their own application row.
--     They could approve their own receipt or set their own payout date.
--   * An unknown status fails SILENTLY for creators: the offers page clamps
--     an unmatched status to index 0, so a sourced creator would read
--     "Applied" forever.
--   * That table holds exactly one payout; this flow needs two per creator.
--
-- RLS is on with NO policies, as in 074_creator_nudges: service-role only,
-- invisible to the consumer app until phase 2 adds a narrow read policy.
--
-- Money is in PAISE and suffixed _paise. campaign_applications mixes units
-- (escrow_amount paise, final_agreed_rate rupees), so the naming is the
-- defence.

-- ──────────────────────────────────────────────────────────────────
-- 1. The booking
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaign_bookings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id             uuid NOT NULL REFERENCES public.campaigns(campaign_id) ON DELETE CASCADE,

  -- Null until the creator signs up and claims their invitation; the trigger
  -- at the bottom backfills it.
  influencer_id           uuid REFERENCES public.influencer_profiles(influencer_id) ON DELETE SET NULL,
  invitation_id           uuid REFERENCES public.influencer_invitations(id) ON DELETE SET NULL,
  -- Reserved: a booking that later becomes a real application. Unused in
  -- phase 1, declared so the column does not need adding under load.
  application_id          uuid,

  -- Contact snapshot. Most sourced creators never sign up, so this is the
  -- only contact detail that exists for them.
  creator_name            text,
  instagram_username      text NOT NULL,
  email                   text,
  phone                   text,
  shipping_address        text,

  -- Sourcing context, straight off the brand's sheet.
  tier                    text,          -- Nano / Micro / Macro / Celebrity
  category_raw            text,          -- as typed; NEVER written to categories
  followers_count         integer,

  stage                   text NOT NULL DEFAULT 'shortlisted',
  quoted_fee_paise        bigint,        -- what they asked for
  agreed_fee_paise        bigint,        -- what we settled on
  product_cost_paise      bigint,        -- what they are out of pocket

  -- Outreach
  contacted_at            timestamptz,
  contacted_channel       text,          -- email | inapp | manual
  contacted_by            uuid,
  price_agreed_at         timestamptz,
  confirmed_at            timestamptz,

  -- The work
  receipt_path            text,          -- key in the private campaign-receipts bucket
  receipt_uploaded_at     timestamptz,
  receipt_uploaded_by     uuid,          -- NULL = the creator uploaded it
  receipt_approved_at     timestamptz,
  receipt_approved_by     uuid,
  receipt_rejected_reason text,
  script_url              text,
  script_shared_at        timestamptz,
  draft_links             jsonb,         -- same {url,type,label} shape as submission_links
  admin_approved_at       timestamptz,
  admin_approved_by       uuid,
  admin_revision_note     text,
  brand_approved_at       timestamptz,
  brand_approved_by       uuid,
  live_url                text,
  live_at                 timestamptz,
  notes                   text,

  created_by              uuid,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  -- A CHECK, unlike campaign_applications.status — which has none, and is how
  -- initiated_by drifted to always-'influencer'. A typo here fails loudly.
  CONSTRAINT campaign_bookings_stage_check CHECK (stage IN (
    'shortlisted', 'contacted', 'price_agreed', 'confirmed',
    'product_purchased', 'product_approved', 'reimbursed',
    'script_shared', 'draft_received', 'revision_needed',
    'admin_approved', 'brand_approved', 'live', 'fee_paid',
    'declined', 'cancelled'
  ))
);

-- One booking per creator per campaign, case-insensitively: the sheets spell
-- handles every which way.
CREATE UNIQUE INDEX IF NOT EXISTS campaign_bookings_campaign_handle_key
  ON public.campaign_bookings (campaign_id, lower(instagram_username));
CREATE INDEX IF NOT EXISTS campaign_bookings_campaign_stage_idx
  ON public.campaign_bookings (campaign_id, stage);
CREATE INDEX IF NOT EXISTS campaign_bookings_influencer_idx
  ON public.campaign_bookings (influencer_id) WHERE influencer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS campaign_bookings_invitation_idx
  ON public.campaign_bookings (invitation_id) WHERE invitation_id IS NOT NULL;

ALTER TABLE public.campaign_bookings ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────
-- 2. The timeline
-- ──────────────────────────────────────────────────────────────────
-- Append-only. Replaces the spreadsheet's "Contacted?" column and is what
-- makes "DM'd 3 days ago by Rahul" answerable.
CREATE TABLE IF NOT EXISTS public.campaign_booking_events (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id  uuid NOT NULL REFERENCES public.campaign_bookings(id) ON DELETE CASCADE,
  kind        text NOT NULL,
  from_stage  text,
  to_stage    text,
  channel     text,       -- email | inapp | manual
  template    text,
  note        text,
  actor_id    uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaign_booking_events_kind_check CHECK (kind IN (
    'stage_change', 'outreach', 'note', 'receipt', 'payout'
  ))
);

CREATE INDEX IF NOT EXISTS campaign_booking_events_booking_idx
  ON public.campaign_booking_events (booking_id, created_at DESC);

ALTER TABLE public.campaign_booking_events ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────
-- 3. The two payout legs
-- ──────────────────────────────────────────────────────────────────
-- A sourced creator is owed twice: the product they bought, and the fee for
-- the work. Separate rows so "product paid, video late" is representable —
-- which a single payout column on the booking could not say.
CREATE TABLE IF NOT EXISTS public.campaign_booking_payouts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id           uuid NOT NULL REFERENCES public.campaign_bookings(id) ON DELETE CASCADE,
  kind                 text NOT NULL,
  amount_paise         bigint NOT NULL,
  payout_status        text NOT NULL DEFAULT 'scheduled',
  payout_release_at    timestamptz,
  payout_method        text,
  payout_utr           text,
  payout_processed_at  timestamptz,
  payout_note          text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaign_booking_payouts_kind_check
    CHECK (kind IN ('product_reimbursement', 'fee')),
  CONSTRAINT campaign_booking_payouts_status_check
    CHECK (payout_status IN ('scheduled', 'processed', 'failed', 'cancelled'))
);

-- A double-clicked Approve cannot queue the same leg twice.
CREATE UNIQUE INDEX IF NOT EXISTS campaign_booking_payouts_booking_kind_key
  ON public.campaign_booking_payouts (booking_id, kind);
CREATE INDEX IF NOT EXISTS campaign_booking_payouts_due_idx
  ON public.campaign_booking_payouts (payout_status, payout_release_at);

ALTER TABLE public.campaign_booking_payouts ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────
-- 4. Binding a booking to the creator when they sign up
-- ──────────────────────────────────────────────────────────────────
-- create-profile already stamps influencer_invitations.influencer_profile_id
-- on both claim paths (by id and by handle). This backfills the booking from
-- that, mirroring the brand account_type trigger in 075.
--
-- NOTE FOR WHOEVER READS create-profile NEXT: nothing in that function
-- mentions bookings. The link happens here. The portal shows a "not linked"
-- chip and has a manual link action for the cases this misses.
CREATE OR REPLACE FUNCTION public.link_bookings_on_invitation_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.influencer_profile_id IS NOT NULL
     AND NEW.influencer_profile_id IS DISTINCT FROM OLD.influencer_profile_id THEN
    UPDATE public.campaign_bookings
       SET influencer_id = NEW.influencer_profile_id,
           updated_at = now()
     WHERE invitation_id = NEW.id
       AND influencer_id IS NULL;

    -- Also catch bookings that were entered by hand against the same handle
    -- but never linked to this invitation row.
    UPDATE public.campaign_bookings
       SET influencer_id = NEW.influencer_profile_id,
           invitation_id = COALESCE(invitation_id, NEW.id),
           updated_at = now()
     WHERE influencer_id IS NULL
       AND NEW.instagram_username IS NOT NULL
       AND lower(instagram_username) = lower(NEW.instagram_username);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS link_bookings_on_claim ON public.influencer_invitations;
CREATE TRIGGER link_bookings_on_claim
  AFTER UPDATE ON public.influencer_invitations
  FOR EACH ROW EXECUTE FUNCTION public.link_bookings_on_invitation_claim();

-- ──────────────────────────────────────────────────────────────────
-- 5. One payout queue over both intake paths
-- ──────────────────────────────────────────────────────────────────
-- The admin Payouts page should not care whether money is owed against an
-- application or a booking. `source` discriminates; `kind` is NULL on the
-- self-serve side, which has only ever had one leg.
--
-- security_invoker so the view runs as its caller (following 061) rather than
-- as the view's owner.
CREATE OR REPLACE VIEW public.payout_queue_v
WITH (security_invoker = true) AS
  SELECT
    'application'::text          AS source,
    a.id                         AS id,
    NULL::text                   AS kind,
    a.influencer_id              AS influencer_id,
    a.campaign_id                AS campaign_id,
    NULL::text                   AS creator_name,
    a.escrow_amount              AS amount_paise,
    a.payout_status              AS payout_status,
    a.payout_release_at          AS payout_release_at,
    a.payout_method              AS payout_method,
    a.payout_utr                 AS payout_utr,
    a.payout_processed_at        AS payout_processed_at
  FROM public.campaign_applications a
  WHERE a.payout_status IS NOT NULL
  UNION ALL
  SELECT
    'booking'::text              AS source,
    p.id                         AS id,
    p.kind                       AS kind,
    b.influencer_id              AS influencer_id,
    b.campaign_id                AS campaign_id,
    b.creator_name               AS creator_name,
    p.amount_paise               AS amount_paise,
    p.payout_status              AS payout_status,
    p.payout_release_at          AS payout_release_at,
    p.payout_method              AS payout_method,
    p.payout_utr                 AS payout_utr,
    p.payout_processed_at        AS payout_processed_at
  FROM public.campaign_booking_payouts p
  JOIN public.campaign_bookings b ON b.id = p.booking_id;
