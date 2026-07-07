// Self-heal for missing referral codes. ensureReferralCode normally
// runs inside the payment webhooks, so anyone whose subscription
// predates the Refer & Earn deploy — or was comped via the admin plan
// override, which bypasses the gateways entirely — has an active plan
// but a NULL referral_code and sees a blank share link.
//
// The refer surfaces call this when (subscribed && !referral_code).
// Auth: the caller's own JWT; the code is only ever generated for the
// authenticated user, and only when the server confirms they hold an
// active (non-trial) subscription.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ensureReferralCode } from "../_shared/referrals.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: jsonHeaders });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userRes, error: userErr } = await supabase.auth.getUser(
      authHeader.replace(/^Bearer\s+/i, ""),
    );
    if (userErr || !userRes?.user) return json({ error: "unauthorized" }, 401);
    const userId = userRes.user.id;

    // Server-side subscription check — mirrors the strict rule the
    // webhooks and attribute-referral use. Comped accounts (admin plan
    // override) have a plan but no gateway sub id, so plan alone is the
    // eligibility signal here; the gateway ids are not required.
    const { data: prof } = await supabase
      .from("influencer_profiles")
      .select("influencer_id, subscription_plan, referral_code")
      .eq("influencer_id", userId)
      .maybeSingle();
    if (!prof) return json({ error: "profile_not_found" }, 404);

    const subscribed = prof.subscription_plan && prof.subscription_plan !== "trial";
    if (!subscribed) return json({ error: "not_subscribed" }, 200);

    if (prof.referral_code) {
      return json({ referralCode: prof.referral_code, created: false });
    }

    const code = await ensureReferralCode(supabase, userId);
    if (!code) return json({ error: "could_not_generate" }, 200);
    return json({ referralCode: code, created: true });
  } catch (err) {
    console.error("ensure-referral-code error:", (err as any)?.message || err);
    return json({ error: "internal" }, 500);
  }
});
