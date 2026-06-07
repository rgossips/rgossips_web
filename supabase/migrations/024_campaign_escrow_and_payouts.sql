-- Campaign escrow + payout pipeline.
--
-- Flow:
--   pending → approved (brand pays via Razorpay Checkout, escrow_status='held')
--          → submitted → accepted → live_submitted
--          → payment   (brand clicks "Release", payout_status='scheduled',
--                       payout_release_at set by plan tier:
--                       Starter +7d, Pro +3d, Elite now)
--          → completed (RazorpayX webhook payout.processed fires)
--
-- escrow_status is independent of application status so we can model the
-- dispute branch without polluting the status enum:
--   held → released_pending → released
--   held → disputed → refunded
--   held → disputed → released (admin overrides in creator's favour)

--------------------------------------------------------------------------
-- 1. campaign_applications: escrow + payout columns
--------------------------------------------------------------------------
ALTER TABLE public.campaign_applications
  -- Escrow leg (inbound from brand)
  ADD COLUMN IF NOT EXISTS escrow_payment_id text,
  ADD COLUMN IF NOT EXISTS escrow_order_id text,
  ADD COLUMN IF NOT EXISTS escrow_amount integer,                -- paise
  ADD COLUMN IF NOT EXISTS escrow_status text
    CHECK (escrow_status IN ('held','released_pending','released','disputed','refunded')),
  ADD COLUMN IF NOT EXISTS escrow_funded_at timestamptz,
  ADD COLUMN IF NOT EXISTS escrow_refund_id text,
  ADD COLUMN IF NOT EXISTS dispute_reason text,
  ADD COLUMN IF NOT EXISTS dispute_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_resolution text
    CHECK (dispute_resolution IN ('refund_brand','release_to_creator')),

  -- Payout leg (outbound to creator)
  ADD COLUMN IF NOT EXISTS payout_release_at timestamptz,        -- when cron should fire
  ADD COLUMN IF NOT EXISTS payout_scheduled_at timestamptz,      -- when brand clicked Release
  ADD COLUMN IF NOT EXISTS payout_id text,                       -- RazorpayX payout id
  ADD COLUMN IF NOT EXISTS payout_status text
    CHECK (payout_status IN ('pending_creator_info','scheduled','processing','processed','failed','reversed')),
  ADD COLUMN IF NOT EXISTS payout_method text
    CHECK (payout_method IN ('upi','imps','neft','rtgs')),
  ADD COLUMN IF NOT EXISTS payout_fund_account_id text,          -- snapshot of which method was used
  ADD COLUMN IF NOT EXISTS payout_utr text,                      -- bank reference for receipt
  ADD COLUMN IF NOT EXISTS payout_processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_failure_reason text;

-- Indexes for the two hot queries: cron scheduler scans, and "earnings"
-- list on the influencer profile.
CREATE INDEX IF NOT EXISTS campaign_applications_payout_scheduled_idx
  ON public.campaign_applications (payout_release_at)
  WHERE payout_status = 'scheduled';

CREATE INDEX IF NOT EXISTS campaign_applications_payout_pending_info_idx
  ON public.campaign_applications (influencer_id)
  WHERE payout_status = 'pending_creator_info';

CREATE INDEX IF NOT EXISTS campaign_applications_escrow_disputes_idx
  ON public.campaign_applications (escrow_status, dispute_opened_at DESC)
  WHERE escrow_status = 'disputed';

CREATE INDEX IF NOT EXISTS campaign_applications_creator_earnings_idx
  ON public.campaign_applications (influencer_id, payout_release_at DESC)
  WHERE payout_status IS NOT NULL;

--------------------------------------------------------------------------
-- 2. influencer_profiles: one RazorpayX contact per influencer
--------------------------------------------------------------------------
ALTER TABLE public.influencer_profiles
  ADD COLUMN IF NOT EXISTS razorpay_contact_id text;

--------------------------------------------------------------------------
-- 3. payment_methods: Razorpay Fund Account linkage + validation
--------------------------------------------------------------------------
ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS razorpay_fund_account_id text,
  ADD COLUMN IF NOT EXISTS validation_status text
    DEFAULT 'pending'
    CHECK (validation_status IN ('pending','success','failed','manual')),
  ADD COLUMN IF NOT EXISTS validation_failure_reason text,
  ADD COLUMN IF NOT EXISTS validated_at timestamptz;

--------------------------------------------------------------------------
-- 4. notifications: priority flag so admin home can surface disputes
--------------------------------------------------------------------------
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS priority text
    NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high'));

CREATE INDEX IF NOT EXISTS notifications_high_priority_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE priority = 'high';

--------------------------------------------------------------------------
-- 5. app_admins: who can access the admin app + receive admin notifications
--------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','superadmin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;

-- Admins can read the admins table (to enumerate peers for fan-out
-- notifications when service-role isn't desired); writes are service-role
-- only so admin elevation can't happen client-side.
DROP POLICY IF EXISTS "app_admins_read_admins" ON public.app_admins;
CREATE POLICY "app_admins_read_admins" ON public.app_admins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = auth.uid())
  );

-- Helper: cheap predicate for "is the caller an admin". RLS policies on
-- other tables (disputes view, admin notifications) can use this without
-- joining the admins table inline.
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;

--------------------------------------------------------------------------
-- 6. Disputes view — convenience read for the admin app
--------------------------------------------------------------------------
-- Joins the application with brand + creator + campaign so the disputes
-- queue can render without a fanout of selects from the client. Brand
-- comes through the campaign (campaign_applications has no direct
-- brand_id column).
CREATE OR REPLACE VIEW public.escrow_disputes_v AS
SELECT
  ca.id                                                AS application_id,
  ca.campaign_id,
  c.title                                              AS campaign_title,
  c.brand_id,
  COALESCE(bp.brand_name, bp.gstin_trade_name,
           bp.contact_name)                            AS brand_name,
  bp.logo_url                                          AS brand_logo_url,
  ca.influencer_id,
  ip.full_name                                         AS influencer_name,
  ip.username                                          AS influencer_username,
  ip.profile_photo_url                                 AS influencer_avatar_url,
  ca.escrow_payment_id,
  ca.escrow_amount,
  ca.escrow_status,
  ca.escrow_funded_at,
  ca.dispute_reason,
  ca.dispute_opened_at,
  ca.dispute_resolution,
  ca.dispute_resolved_at,
  ca.status                                            AS application_status,
  ca.rejection_reason,
  ca.submission_links,
  ca.final_agreed_rate
FROM public.campaign_applications ca
LEFT JOIN public.campaigns c           ON c.campaign_id = ca.campaign_id
LEFT JOIN public.brand_profiles bp     ON bp.brand_id   = c.brand_id
LEFT JOIN public.influencer_profiles ip ON ip.influencer_id = ca.influencer_id
WHERE ca.escrow_status IN ('disputed','refunded');

ALTER VIEW public.escrow_disputes_v SET (security_invoker = on);
GRANT SELECT ON public.escrow_disputes_v TO authenticated;

--------------------------------------------------------------------------
-- 7. Notification preference category — payment_alerts already exists.
--    Map the new payout types we'll emit so the trigger doesn't drop them.
--------------------------------------------------------------------------
-- (The check_notification_pref function in 014 already maps
--  payment_released / payment_received to paymentAlerts; the new types
--  we'll emit — payout_scheduled, payout_processed, payout_failed,
--  payout_pending_info, escrow_funded, dispute_opened — are operational
--  signals that must always go through, so they fall into the
--  "else null → pass through" branch. Nothing to change here.)
