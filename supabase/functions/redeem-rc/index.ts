// Redeem RC — called by the subscription checkout functions
// (razorpay-checkout, stripe-checkout) when the user opts to apply
// their Reward Credits to a plan purchase.
//
// Returns:
//   { applied: N, balanceAfter: M, invoiceDiscountPaise: N*100 }
//
// Rules (Phase-0 locks 8 + 13):
//   - actual_apply = min(balance, floor(plan_price × 0.5))
//   - Even admin-granted RC follows the same 50% cap.
//   - FIFO consumption (soonest-to-expire spent first) is implicit:
//     we just insert one REDEMPTION row against the wallet; the ledger
//     doesn't need per-row spending because expiry logic already
//     compares against current balance before writing an EXPIRY row
//     (see migration 036).
//
// Called with { userId, planPriceRupees }.
//
// This function ONLY writes the REDEMPTION ledger row and returns the
// discount amount. The caller (checkout) is responsible for actually
// applying that discount to the invoice.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Auth — service-role callers (checkout functions) pass the
    // service key so this returns their claim intact. Direct client
    // callers pass their user JWT.
    const authHeader = req.headers.get("authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    let userId = (body?.userId || "").toString().trim();
    const planPriceRupees = Number(body?.planPriceRupees);

    if (!userId) {
      // Fall back to auth token — direct client callers.
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (token) {
        const { data: userRes } = await supabase.auth.getUser(token);
        userId = userRes?.user?.id || "";
      }
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: jsonHeaders });
    }
    if (!Number.isFinite(planPriceRupees) || planPriceRupees < 1) {
      return new Response(JSON.stringify({ error: "planPriceRupees required" }), { status: 200, headers: jsonHeaders });
    }

    // Current balance.
    const { data: balRow } = await supabase
      .from("v_reward_credits_balance")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    const balance = balRow?.balance || 0;

    // 50%-of-plan cap. floor because we deal in whole rupees.
    const maxApply = Math.floor(planPriceRupees * 0.5);
    const applied = Math.max(0, Math.min(balance, maxApply));

    if (applied <= 0) {
      return new Response(
        JSON.stringify({
          applied: 0,
          balanceAfter: balance,
          invoiceDiscountPaise: 0,
          reason: balance <= 0 ? "no_balance" : "cap_zero",
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const balanceAfter = balance - applied;

    // Insert the REDEMPTION row. No expires_at — this row is a debit.
    const { error: insErr } = await supabase
      .from("reward_credits_ledger")
      .insert({
        user_id: userId,
        delta_rc: -applied,
        reason: "REDEMPTION",
        balance_after: balanceAfter,
        note: `Applied to plan (₹${planPriceRupees})`,
      });
    if (insErr) {
      console.error("redeem-rc insert failed:", insErr.message);
      return new Response(
        JSON.stringify({ error: "Could not record redemption: " + insErr.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        applied,
        balanceAfter,
        invoiceDiscountPaise: applied * 100,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("redeem-rc error:", (err as any)?.message || err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
