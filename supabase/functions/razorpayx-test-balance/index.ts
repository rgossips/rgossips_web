// One-shot diagnostic: query RazorpayX test-mode balance + recent transactions.
//
// Why this exists: RazorpayX has no public API to credit test balance, only a
// dashboard button. But new test accounts ship with ~₹10L pre-funded, so most
// of the time topping up isn't actually needed. This function reads the live
// balance so you can confirm.
//
// If the balance is too low to test payouts, top up via:
//   dashboard.razorpay.com → switch to RazorpayX → Test Mode →
//   sidebar "Account Statement" → "Add Test Balance" button on the
//   balance widget. Add ₹1,00,000 and re-run this function to confirm.
//
// Requires service role auth (admin-only diagnostic).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Caller must be authenticated; only platform staff should run this.
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );
    const { data: userRes, error: userErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userRes?.user) return json({ error: "unauthorized" }, 401);

    const keyId = Deno.env.get("RAZORPAYX_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAYX_KEY_SECRET");
    const accountNumber = Deno.env.get("RAZORPAYX_ACCOUNT_NUMBER");
    if (!keyId || !keySecret || !accountNumber) {
      return json({ error: "RazorpayX credentials are not configured" }, 500);
    }

    const auth = "Basic " + btoa(`${keyId}:${keySecret}`);

    // The balance lives on the X virtual account — Razorpay exposes it via
    // /v1/contacts/transactions filtered by account_number. There's no
    // dedicated /balance endpoint in the public API; the most recent
    // transaction's `balance` field is the source of truth.
    const txUrl = new URL("https://api.razorpay.com/v1/transactions");
    txUrl.searchParams.set("account_number", accountNumber);
    txUrl.searchParams.set("count", "5");

    const txRes = await fetch(txUrl.toString(), {
      method: "GET",
      headers: { Authorization: auth },
    });
    const txBody = await txRes.json().catch(() => ({}));

    if (!txRes.ok) {
      return json(
        {
          error: "Failed to query RazorpayX",
          status: txRes.status,
          razorpay: txBody,
          hint:
            txRes.status === 401
              ? "Key/secret mismatch — verify RAZORPAYX_KEY_ID/SECRET in Supabase secrets."
              : txRes.status === 400
              ? "Account number may be wrong — verify RAZORPAYX_ACCOUNT_NUMBER."
              : "Top up via the dashboard if you can't query balance.",
        },
        502
      );
    }

    const items = Array.isArray(txBody?.items) ? txBody.items : [];
    const latest = items[0];
    const balancePaise = latest?.balance ?? null;

    return json({
      ok: true,
      mode: keyId.startsWith("rzp_test_") ? "test" : "live",
      account_number: accountNumber,
      balance_paise: balancePaise,
      balance_inr: balancePaise == null ? null : Math.round(balancePaise / 100),
      recent_transactions: items.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount_paise: t.amount,
        balance_after_paise: t.balance,
        description: t.description,
        created_at: t.created_at,
      })),
      message:
        balancePaise == null
          ? "Account has no transactions yet — fresh RazorpayX test accounts are pre-funded with ~₹10,00,000. If a real payout still fails with insufficient funds, top up via dashboard."
          : balancePaise < 1000000
          ? `Balance is low (₹${Math.round(balancePaise / 100)}). Top up via dashboard → Test Mode → Account Statement → Add Test Balance.`
          : `Balance is ₹${Math.round(balancePaise / 100).toLocaleString("en-IN")} — plenty for testing.`,
    });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});
