-- Critical RLS gaps caught by the Phase A security audit.
--
-- pg_tables showed RLS DISABLED on three public tables:
--   otp_verifications      ← worst: contains live 6-digit OTP codes
--   campaigns              ← brand campaign details
--   campaign_applications  ← creator application + escrow data
--
-- With RLS off, the Supabase REST API exposes these tables to any
-- holder of the publishable/anon key (the same key the browser ships
-- with). An attacker can read every active OTP, every campaign, every
-- application. This migration enables RLS on all three and adds
-- least-privilege policies that match the current code-paths.

-- ──────────────────────────────────────────────────────────────────
-- 1. otp_verifications  — service-role-only.
--    The OTP sender + verifier both run as service_role so the app
--    is unaffected. Without policies, NO client access is allowed,
--    which is the correct posture for live secrets.
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────
-- 2. campaigns  — brands manage their own; influencers read active.
--    Direct client reads today: useBrandTrustScore.js (brand scope
--    only). Influencer reads go through the list-campaigns edge
--    function (service-role), but we still allow influencers to read
--    active rows directly in case future surfaces need that.
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaigns_brand_self_rw" ON public.campaigns;
CREATE POLICY "campaigns_brand_self_rw" ON public.campaigns
  FOR ALL TO authenticated
  USING (brand_id = auth.uid())
  WITH CHECK (brand_id = auth.uid());

DROP POLICY IF EXISTS "campaigns_authenticated_read_open" ON public.campaigns;
CREATE POLICY "campaigns_authenticated_read_open" ON public.campaigns
  FOR SELECT TO authenticated
  USING (status IN ('active', 'open'));

-- ──────────────────────────────────────────────────────────────────
-- 3. campaign_applications  — creator owns their applications;
--    brand can read applications to their own campaigns.
--    Direct client reads today: PaymentMethods.jsx (self-scope),
--    useBrandTrustScore.js (brand-scope through campaigns join).
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE public.campaign_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "applications_creator_self_rw" ON public.campaign_applications;
CREATE POLICY "applications_creator_self_rw" ON public.campaign_applications
  FOR ALL TO authenticated
  USING (influencer_id = auth.uid())
  WITH CHECK (influencer_id = auth.uid());

DROP POLICY IF EXISTS "applications_brand_read_own_campaign" ON public.campaign_applications;
CREATE POLICY "applications_brand_read_own_campaign" ON public.campaign_applications
  FOR SELECT TO authenticated
  USING (
    campaign_id IN (
      SELECT campaign_id FROM public.campaigns WHERE brand_id = auth.uid()
    )
  );
