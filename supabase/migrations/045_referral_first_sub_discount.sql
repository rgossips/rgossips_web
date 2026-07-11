-- Referral perk: a REFERRED signup gets 50% off their FIRST subscription,
-- "gifted by" the referrer. This is separate from the 50 RC welcome bonus
-- and from RC redemption (which is capped at 50% of an invoice).
--
-- No new column: eligibility is derived — the caller is a referee on an
-- active referral AND hasn't subscribed yet (subscription_plan trial/null).
-- Once they subscribe, subscription_plan flips and they stop qualifying, so
-- the discount is naturally one-shot on the first subscription. The checkout
-- functions (stripe-checkout / razorpay-checkout) run the same check with the
-- service role and apply a real 50%-off coupon on the first invoice.
--
-- This RPC exposes JUST the referrer's display identity (name / username /
-- photo) to the referee so the welcome popup can render "Gifted by <name>"
-- with an avatar — without opening up influencer_profiles reads. Returns a
-- row only while the discount is still available, so the popup and the
-- checkout stay in agreement.
CREATE OR REPLACE FUNCTION public.get_my_referrer()
RETURNS TABLE (
  referrer_name text,
  referrer_username text,
  referrer_photo text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    rp.full_name,
    rp.username,
    COALESCE(NULLIF(rp.custom_profile_photo_url, ''), rp.profile_photo_url) AS referrer_photo
  FROM public.referrals r
  JOIN public.influencer_profiles rp ON rp.influencer_id = r.referrer_id
  JOIN public.influencer_profiles me ON me.influencer_id = r.referee_id
  WHERE r.referee_id = auth.uid()
    AND r.status IN ('SIGNED_UP', 'QUALIFIED', 'REWARDED')
    AND (me.subscription_plan IS NULL OR me.subscription_plan = 'trial')
  ORDER BY r.created_at DESC
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_referrer() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_referrer() TO authenticated;
