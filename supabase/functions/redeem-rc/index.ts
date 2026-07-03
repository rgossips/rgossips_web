// Redeem RC — quotes and (optionally) records a Reward Credit redemption.
//
// Body:
//   { userId?: string, planPriceRupees: number, dryRun?: boolean }
// If userId is absent the auth header's JWT is used (direct client caller).
//
// Response (always 200 with a `reason` on skip cases so callers can branch):
//   { applied, availableBefore, balanceAfter, invoiceDiscountPaise, reason }
//
// Rules (Phase-0 locks 8 + 13, Phase-2 lock refinement):
//   - actual_apply = min(available_balance, floor(plan_price × 0.5))
//   - available_balance skips locked (welcome-bonus) + expired rows.
//   - Even admin-granted RC follows the same 50% cap.
//   - FIFO consumption is implicit — one REDEMPTION debit against the raw
//     wallet total. Expiry math already caps the negative it writes.
//
// Note on live use: the subscription checkouts (stripe / razorpay) inline
// the balance query + cap because they debit in their respective webhooks
// after payment succeeds. This endpoint is kept for direct client callers
// (e.g. one-off service purchases) and for `dryRun` price previews.

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
    const dryRun = Boolean(body?.dryRun);

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

    // Available balance = total minus locked (welcome bonus in its 30-day
    // lock window) minus expired. This is the only figure users can spend
    // — the raw v_reward_credits_balance sum is a marketing display only.
    const { data: balRow } = await supabase
      .from("v_reward_credits_available_balance")
      .select("available_balance")
      .eq("user_id", userId)
      .maybeSingle();
    const availableBalance = balRow?.available_balance || 0;

    // 50%-of-plan cap. floor because we deal in whole rupees.
    const maxApply = Math.floor(planPriceRupees * 0.5);
    const applied = Math.max(0, Math.min(availableBalance, maxApply));

    if (applied <= 0) {
      return new Response(
        JSON.stringify({
          applied: 0,
          availableBefore: availableBalance,
          balanceAfter: availableBalance,
          invoiceDiscountPaise: 0,
          reason: availableBalance <= 0 ? "no_balance" : "cap_zero",
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // balance_after on the ledger row snapshots the raw sum (includes
    // locked). Read it live from v_reward_credits_balance so the ledger
    // stays consistent with the debit-including-locked model.
    const { data: rawBal } = await supabase
      .from("v_reward_credits_balance")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    const balanceAfter = (rawBal?.balance || 0) - applied;

    // Dry-run mode short-circuits before writing — used by the pricing
    // page to preview the "you'd pay ₹X" figure before commit.
    if (dryRun) {
      return new Response(
        JSON.stringify({
          applied,
          availableBefore: availableBalance,
          balanceAfter,
          invoiceDiscountPaise: applied * 100,
          reason: "dry_run",
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

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
        availableBefore: availableBalance,
        balanceAfter,
        invoiceDiscountPaise: applied * 100,
        reason: "applied",
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
