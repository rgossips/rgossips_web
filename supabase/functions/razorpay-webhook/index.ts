// Razorpay webhook handler — mirrors stripe-webhook's contract, so the
// shared setUserPlan flow (template-reset on downgrade + plan_upgraded
// notification on upgrade) lights up exactly the same way regardless of
// which gateway the user paid through.
//
// Required env:
//   RAZORPAY_WEBHOOK_SECRET — paste this from Razorpay → Settings → Webhooks
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Subscribe in the Razorpay dashboard to these events:
//   subscription.activated
//   subscription.charged
//   subscription.cancelled
//   subscription.completed
//   subscription.halted
//
// IMPORTANT: deploy with --no-verify-jwt so Razorpay (which has no JWT)
// can post here.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rewardsEnabled } from "../_shared/rewards.ts";
import {
  ensureReferralCode,
  qualifyReferralIfEligible,
  clawBackReferral,
} from "../_shared/referrals.ts";
import { applyServicePaymentCaptured } from "../_shared/service-payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ── Shared email helpers ───────────────────────────────────────────────
// Mirrored from create-profile / stripe-webhook / send-account-event-email.
// If you tweak any of these, keep the others in sync.

async function invokeSendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
}) {
  if (!opts.to) return;
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      console.error("send-email skipped: missing SUPABASE_URL / SERVICE_ROLE_KEY");
      return;
    }
    const res = await fetch(`${url}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
      body: JSON.stringify(opts),
    });
    const data = await res.json();
    if (data?.error) console.error("send-email returned:", data.error);
  } catch (e) {
    console.error("send-email invocation failed:", (e as any)?.message);
  }
}

function renderEmailHtml(o: {
  preheader?: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const cta =
    o.ctaUrl && o.ctaLabel
      ? `<div style="margin:28px 0 8px;">
           <a href="${o.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#9810FA,#E60076);color:#ffffff !important;font-weight:700;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:14px;">${o.ctaLabel}</a>
         </div>`
      : "";
  const footer =
    o.footerNote ||
    "You're receiving this because you have an RGossips account. Questions? Just reply to this email.";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  ${o.preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:transparent;visibility:hidden;">${o.preheader}</div>` : ""}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8F7FB;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border:1px solid #f1f5f9;border-radius:20px;padding:32px;">
        <tr><td>
          <div style="font-weight:900;font-size:18px;letter-spacing:-0.3px;color:#9810FA;margin-bottom:18px;">RGossips</div>
          <h1 style="font-size:22px;font-weight:800;margin:0 0 14px;line-height:1.3;color:#0f172a;">${o.title}</h1>
          <div style="font-size:14px;line-height:1.65;color:#475569;">${o.body}</div>
          ${cta}
          <div style="font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:18px;margin-top:28px;line-height:1.6;">${footer}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Cancel any "other" active subscriptions on the user's profile so a user
// can never be billed by two gateways simultaneously. The newly-paid
// subscription id is passed so we never cancel ourselves.
async function cancelPriorSubscriptions(opts: {
  userId: string;
  skipRazorpaySubId?: string | null;
  priorStripe: string | null;
  priorRazorpay: string | null;
}) {
  const { skipRazorpaySubId, priorStripe, priorRazorpay } = opts;

  // Razorpay: ignore if the prior sub IS the one we just activated.
  if (priorRazorpay && priorRazorpay !== skipRazorpaySubId) {
    try {
      const keyId = Deno.env.get("RAZORPAY_KEY_ID");
      const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
      if (keyId && keySecret) {
        const auth = `Basic ${btoa(`${keyId}:${keySecret}`)}`;
        const res = await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(priorRazorpay)}/cancel`, {
          method: "POST",
          headers: { Authorization: auth, "Content-Type": "application/json" },
          body: JSON.stringify({ cancel_at_cycle_end: 0 }),
        });
        const out = await res.json();
        if (out?.error) {
          const desc = out?.error?.description || "";
          if (!/already|status/i.test(desc)) {
            console.error("Razorpay cancel returned error:", JSON.stringify(out));
          }
        } else {
          console.log("Cancelled prior Razorpay subscription", priorRazorpay);
        }
      }
    } catch (e: any) {
      console.error("Failed to cancel prior Razorpay subscription", priorRazorpay, e?.message || String(e));
    }
  }

  if (priorStripe) {
    try {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        const res = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(priorStripe)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${stripeKey}` },
        });
        if (!res.ok) {
          const body = await res.text();
          // 404 / already canceled is fine.
          if (!/No such subscription|resource_missing|already canceled/i.test(body)) {
            console.error("Failed to cancel prior Stripe subscription", priorStripe, body);
          }
        } else {
          console.log("Cancelled prior Stripe subscription", priorStripe);
        }
      }
    } catch (e: any) {
      console.error("Failed to cancel prior Stripe subscription", priorStripe, e?.message || String(e));
    }
  }
}

// HMAC-SHA256 signature check — Razorpay's standard webhook verification.
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Constant-time compare — a plain `===` on the hex digest can leak the
  // match prefix length via timing. Cheap to do it right.
  return timingSafeEqualHex(expected, signature);
}

// Constant-time compare for equal-length hex digests. Length mismatch is
// safe to reveal early (the attacker already knows the 64-char length).
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// Shared "what plan should a user be on now" logic. Identical shape to
// stripe-webhook's setUserPlan so the side effects (template reset,
// plan_upgraded notification) behave the same regardless of gateway.
async function setUserPlan(userId: string, plan: string, extras: Record<string, unknown> = {}) {
  if (!userId) return;

  const { data: prior } = await supabase
    .from("influencer_profiles")
    .select("subscription_plan, media_kit_template, stripe_subscription_id, razorpay_subscription_id")
    .eq("influencer_id", userId)
    .maybeSingle();
  const previousPlan = prior?.subscription_plan || "";
  const previousTemplate = prior?.media_kit_template || "classic";

  // Single-active-subscription rule. The user just paid through Razorpay;
  // cancel anything that was previously active either on Razorpay (a
  // different sub id — happens on plan change) or on Stripe (gateway
  // switch). Non-fatal on failure: we still activate the newly-paid sub
  // so the customer gets what they bought.
  const newRazorpaySubId = (extras as any).razorpay_subscription_id as string | undefined;
  await cancelPriorSubscriptions({
    userId,
    skipRazorpaySubId: newRazorpaySubId,
    priorStripe: prior?.stripe_subscription_id || null,
    priorRazorpay: prior?.razorpay_subscription_id || null,
  });

  const TEMPLATE_MIN_PLAN: Record<string, string> = {
    classic: "starter",
    glass_blue: "pro",
    editorial_noir: "pro",
    // Bento Sunset + Neo-Brutalist are Elite-only — Pro is capped at
    // the first three designs. Keep in sync with the other two copies
    // of this map: update-profile and src/lib/plans.js.
    bento_sunset: "elite",
    neo_brutalist: "elite",
  };
  const PLAN_RANK: Record<string, number> = { starter: 1, pro: 2, elite: 3 };
  const requiredRank = PLAN_RANK[TEMPLATE_MIN_PLAN[previousTemplate] || "starter"] || 0;
  const nextPlanRank = PLAN_RANK[plan] || 0;
  const templateNoLongerAllowed = requiredRank > nextPlanRank;

  const templateReset: Record<string, unknown> = templateNoLongerAllowed
    ? { media_kit_template: "classic" }
    : {};

  const { error } = await supabase
    .from("influencer_profiles")
    .update({
      subscription_plan: plan,
      payment_gateway: "razorpay",
      ...templateReset,
      ...extras,
      updated_at: new Date().toISOString(),
    })
    .eq("influencer_id", userId);
  if (error) {
    console.error("Failed to update plan:", error.message);
    return;
  }

  if (templateNoLongerAllowed) {
    try {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "media_kit_template_reset",
        title: "Media kit reset to Classic",
        body: JSON.stringify({
          text: `Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan only includes the Classic media-kit template, so your kit was switched back. Pick another any time from /influencer/media-kit.`,
          link: "/influencer/media-kit",
        }),
        is_read: false,
      });
    } catch (e) {
      console.error("media_kit_template_reset notification insert failed:", (e as any)?.message);
    }
  }

  const planRank: Record<string, number> = { free: 0, trial: 1, starter: 2, pro: 3, elite: 4 };
  const prevRank = planRank[previousPlan] ?? 0;
  const nextRank = planRank[plan] ?? 0;
  if (nextRank > prevRank && nextRank >= planRank.pro) {
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    // Idempotency guard. Razorpay fires subscription.activated AND
    // subscription.charged back-to-back on an initial subscription;
    // both call setUserPlan and both can read `previousPlan` before
    // either has written the new plan. Dedupe by checking for a fresh
    // notification of the same plan in the last 10 minutes.
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("notifications")
      .select("id, body")
      .eq("user_id", userId)
      .eq("type", "plan_upgraded")
      .gte("created_at", tenMinAgo)
      .limit(5);
    const alreadyNotified = (recent || []).some((n: any) => {
      try {
        const parsed = typeof n.body === "string" ? JSON.parse(n.body) : n.body;
        return (parsed?.text || "").includes(planLabel);
      } catch {
        return false;
      }
    });
    if (!alreadyNotified) try {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "plan_upgraded",
        title: `Welcome to ${planLabel} 🎉`,
        body: JSON.stringify({
          text: `Thanks for upgrading! Your ${planLabel} features are unlocked — head to your dashboard to explore what's new.`,
          link: "/influencer",
        }),
        is_read: false,
      });
    } catch (e) {
      console.error("plan_upgraded notification insert failed:", (e as any)?.message);
    }

    // Email receipt — also gated by the same dedupe so the user
    // doesn't get two "your Pro subscription is active" emails when
    // both Razorpay events fire setUserPlan in quick succession.
    if (!alreadyNotified) try {
      const cycle = (extras as any).billing_cycle as string | undefined;
      const cycleLabel = cycle === "annual" ? "Annual" : "Monthly";
      const { data: row } = await supabase
        .from("influencer_profiles")
        .select("email, full_name")
        .eq("influencer_id", userId)
        .maybeSingle();
      let to = row?.email || "";

      // Phone-OTP signups can land here with email = null. Fall back to
      // the customer record on Razorpay (created during the
      // razorpay-checkout flow with the email we had at the time) and
      // persist whatever we get on the profile so future emails Just Work.
      const customerId = (extras as any).razorpay_customer_id as string | undefined;
      if (!to && customerId) {
        try {
          const keyId = Deno.env.get("RAZORPAY_KEY_ID");
          const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
          if (keyId && keySecret) {
            const auth = `Basic ${btoa(`${keyId}:${keySecret}`)}`;
            const custRes = await fetch(
              `https://api.razorpay.com/v1/customers/${encodeURIComponent(customerId)}`,
              { headers: { Authorization: auth } }
            );
            const cust = await custRes.json();
            const gatewayEmail = String(cust?.email || "");
            if (gatewayEmail) {
              to = gatewayEmail;
              await supabase
                .from("influencer_profiles")
                .update({ email: gatewayEmail })
                .eq("influencer_id", userId);
            }
          }
        } catch (e) {
          console.error("Razorpay customer lookup for email failed:", (e as any)?.message);
        }
      }

      if (to) {
        const firstName = (row?.full_name || "").split(" ")[0] || "there";
        await invokeSendEmail({
          to,
          subject: `Your RGossips ${planLabel} subscription is active`,
          html: renderEmailHtml({
            preheader: `Your ${planLabel} plan is live — billed ${cycleLabel.toLowerCase()} via Razorpay.`,
            title: `You're on ${planLabel}, ${firstName} 🎉`,
            body: `<p>Thanks for upgrading. Your <strong>${planLabel} · ${cycleLabel}</strong> subscription is now active and billed through Razorpay.</p>
                   <p>All your ${planLabel} features are unlocked right now — head to the dashboard to start using them.</p>
                   <p style="font-size:12px;color:#94a3b8;margin-top:18px;">Razorpay will email a separate invoice with the tax breakdown. You can also pull every past invoice from <strong>Profile → Payments → Subscription History</strong>.</p>`,
            ctaLabel: "Open dashboard",
            ctaUrl: "https://rgossips.com/influencer",
          }),
        });
      }
    } catch (e) {
      console.error("Subscription receipt email failed (non-fatal):", (e as any)?.message);
    }
  }
}

// ── RazorpayX payout handler ───────────────────────────────────────────
// Maps payout.processed → application.status='completed', payout.failed /
// payout.reversed → payout_status='failed' for admin retry. We key on
// notes.application_id (set by payouts-cron / admin-escrow-resolve) —
// reference_id is also the bare application UUID but notes is the more
// robust contract since RazorpayX trims/normalises reference_id.
async function handlePayoutEvent(type: string, payout: any) {
  if (!payout) return { received: true, skipped: "no payout payload" };
  // Prefer the application_id stored in notes; fall back to a UUID-
  // shaped reference_id for older payouts that pre-dated this change.
  const applicationId =
    payout?.notes?.application_id ||
    (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(payout.reference_id || ""))
      ? String(payout.reference_id)
      : null);
  if (!applicationId) return { received: true, skipped: "no application id on payout" };

  const { data: app } = await supabase
    .from("campaign_applications")
    .select("id, influencer_id, escrow_amount, campaign_id, campaigns(title)")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app) return { received: true, skipped: "application not found" };

  const utr = String(payout.utr || payout.fund_transfer?.utr || "");
  const nowIso = new Date().toISOString();

  if (type === "payout.processed") {
    await supabase
      .from("campaign_applications")
      .update({
        status: "completed",
        payout_status: "processed",
        payout_utr: utr || null,
        payout_processed_at: nowIso,
        escrow_status: "released",
      })
      .eq("id", applicationId);

    // FINAL_ACCEPTED — record the transition so the trust-score
    // cold-start cap counter and the P2 funnel see it.
    try {
      await supabase.from("application_status_history").insert({
        application_id: applicationId,
        from_status: "payment",
        to_status: "completed",
        changed_by_role: "system",
        reason: utr ? `Payout processed · UTR ${utr}` : "Payout processed",
      });
    } catch (e) {
      console.error("status-history insert failed:", e);
    }

    const amountInr = Math.round((app.escrow_amount || 0) / 100);
    const campaignTitle = (app as any).campaigns?.title || "your campaign";
    await supabase.from("notifications").insert({
      user_id: app.influencer_id,
      type: "payout_processed",
      title: "Payment received",
      body: JSON.stringify({
        text: `₹${amountInr.toLocaleString("en-IN")} for "${campaignTitle}" has been transferred${utr ? ` (UTR ${utr})` : ""}.`,
        link: `/influencer/profile/payments`,
        applicationId,
      }),
      is_read: false,
    });

    // Receipt email — best-effort, mirrors the structure of escrow-funded.
    try {
      const { data: creatorAuth } = await supabase.auth.admin.getUserById(app.influencer_id);
      const creatorEmail = creatorAuth?.user?.email;
      if (creatorEmail) {
        await invokeSendEmail({
          to: creatorEmail,
          subject: `₹${amountInr.toLocaleString("en-IN")} received for "${campaignTitle}"`,
          html: renderEmailHtml({
            title: "Your payout is in your account",
            body: `<p>Your payout of <strong>₹${amountInr.toLocaleString("en-IN")}</strong> for the campaign "<strong>${campaignTitle}</strong>" has been transferred.</p>
                   ${utr ? `<p><strong>UTR:</strong> ${utr}</p>` : ""}
                   <p>It should reflect in your account within a few minutes (UPI) or a few hours depending on your bank.</p>`,
            ctaLabel: "View in Payments",
            ctaUrl: "https://rgossips.com/influencer/profile/payments",
          }),
        });
      }
    } catch (e) {
      console.error("payout receipt email failed:", e);
    }

    return { received: true, applicationId, status: "processed" };
  }

  if (type === "payout.failed" || type === "payout.reversed") {
    const reason =
      payout.failure_reason ||
      payout.status_details?.description ||
      payout.error?.description ||
      "Payout failed";
    await supabase
      .from("campaign_applications")
      .update({
        payout_status: type === "payout.reversed" ? "reversed" : "failed",
        payout_failure_reason: String(reason).slice(0, 500),
      })
      .eq("id", applicationId);

    // Notify the creator AND admins so the queue surfaces the failure.
    await supabase.from("notifications").insert({
      user_id: app.influencer_id,
      type: "payout_failed",
      title: "Payout failed — please verify your details",
      body: JSON.stringify({
        text: `Your payout for this campaign failed: ${reason}. Re-check the payout details in your profile, or contact support.`,
        link: `/influencer/profile/payments`,
        applicationId,
      }),
      is_read: false,
    });
    const { data: admins } = await supabase.from("admin_profiles").select("id");
    if (Array.isArray(admins) && admins.length) {
      await supabase.from("notifications").insert(
        admins.map((a: { id: string }) => ({
          user_id: a.id,
          type: "payout_failed_admin",
          priority: "high",
          title: "Payout failed",
          body: JSON.stringify({
            text: `Payout for application ${applicationId} failed: ${reason}`,
            link: `/dashboard/disputes/${applicationId}`,
            applicationId,
          }),
          is_read: false,
        }))
      );
    }
    return { received: true, applicationId, status: "failed", reason };
  }

  return { received: true, skipped: `unhandled payout event ${type}` };
}

// ── Razorpay service-order payment handler ─────────────────────────────
// Mirrors stripe-webhook's handleServicePayment. Idempotent: re-checks
// advance_paid / final_paid before mutating so a webhook retry can't
// double-progress an order.
// Thin wrapper — the actual status flip / events / notifications live in the
// shared helper so the webhook and the verify-service-payment fallback stay
// byte-for-byte identical.
async function handleServicePaymentCaptured(payment: any) {
  return applyServicePaymentCaptured(supabase, {
    orderId: String(payment?.notes?.order_id || ""),
    phase: String(payment?.notes?.phase || "advance"),
    paymentId: String(payment?.id || ""),
    amountPaise: Number(payment?.amount || 0),
  });
}

// ── RazorpayX fund-account validation handler ──────────────────────────
async function handleValidationEvent(type: string, validation: any) {
  if (!validation) return { received: true, skipped: "no validation payload" };
  const fundAccountId = validation.fund_account?.id;
  if (!fundAccountId) return { received: true, skipped: "no fund_account id" };

  const status = String(validation.status || "");
  const ok = status === "completed" || status === "active";
  const failed = status === "failed";
  const updates: Record<string, unknown> = {};
  if (ok) {
    updates.validation_status = "success";
    updates.validated_at = new Date().toISOString();
  } else if (failed) {
    updates.validation_status = "failed";
    updates.validation_failure_reason =
      validation.results?.account_status || validation.results?.registered_name || "Validation failed";
  }
  if (Object.keys(updates).length === 0) {
    return { received: true, skipped: `validation in state ${status}` };
  }

  const { data: updatedRows } = await supabase
    .from("payment_methods")
    .update(updates)
    .eq("razorpay_fund_account_id", fundAccountId)
    .select("user_id");

  // If validation just succeeded, auto-resume any waiting payouts for
  // this user — same logic as register-payout-method's resume step.
  if (ok && Array.isArray(updatedRows) && updatedRows[0]?.user_id) {
    await supabase
      .from("campaign_applications")
      .update({ payout_status: "scheduled" })
      .eq("influencer_id", updatedRows[0].user_id)
      .eq("payout_status", "pending_creator_info");
  }
  return { received: true, fundAccountId, status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const signature = req.headers.get("x-razorpay-signature") || "";
  const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  const body = await req.text();

  // Refuse unverified payloads — both secret and signature must be
  // present. Without this, anyone with the function URL can post a
  // fake `payment.captured` event and trigger order-completion logic.
  if (!webhookSecret) {
    console.error("Razorpay webhook rejected: RAZORPAY_WEBHOOK_SECRET not set");
    return new Response("Webhook not configured", { status: 401, headers: corsHeaders });
  }
  if (!signature) {
    console.error("Razorpay webhook rejected: missing x-razorpay-signature header");
    return new Response("Missing signature", { status: 401, headers: corsHeaders });
  }
  const ok = await verifySignature(body, signature, webhookSecret);
  if (!ok) {
    console.error("Razorpay signature verification failed");
    return new Response("Invalid signature", { status: 400, headers: corsHeaders });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  // Replay protection. Razorpay signs the payload but the signature
  // alone doesn't bind to a time window — a captured signed event can
  // be replayed indefinitely if our handlers aren't idempotent. We
  // reject events older than 5 minutes. event.created_at is Unix
  // seconds; missing it (older format) falls back to event.payload's
  // payment.entity.created_at.
  const eventCreatedAt =
    Number(event?.created_at) ||
    Number(event?.payload?.payment?.entity?.created_at) ||
    Number(event?.payload?.subscription?.entity?.created_at) ||
    0;
  const MAX_AGE_SECS = 5 * 60;
  if (eventCreatedAt > 0 && Date.now() / 1000 - eventCreatedAt > MAX_AGE_SECS) {
    console.error(
      `Razorpay webhook rejected: event is ${Math.round(Date.now() / 1000 - eventCreatedAt)}s old (cap ${MAX_AGE_SECS}s)`
    );
    return new Response("Event too old", { status: 400, headers: corsHeaders });
  }

  try {
    const type = String(event?.event || "");

    // ── Razorpay Payments: service-order advance / final payments ──────
    // We branch on notes.kind so this single endpoint serves three
    // distinct flows: subscriptions, service-order payments, and
    // RazorpayX payouts. Notes are echoed back exactly as we set them.
    if (type === "payment.captured") {
      const payment = event?.payload?.payment?.entity;
      const kind = String(payment?.notes?.kind || "");
      if (kind === "service_payment") {
        const result = await handleServicePaymentCaptured(payment);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Fall through — other payment.captured events (escrow funding
      // from brand approve) don't need a webhook flip because the
      // client-side Razorpay handler callback already calls
      // update-application-status with the signature.
    }

    // ── RazorpayX payout events (escrow release leg) ────────────────────
    // Different payload shape from subscriptions — entity is payload.payout.
    // Route + return here before the subscription path tries to parse them.
    if (type.startsWith("payout.")) {
      const result = await handlePayoutEvent(type, event?.payload?.payout?.entity);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── RazorpayX fund-account validation events ───────────────────────
    // Fired async when name-match completes (in prod). Test mode is
    // synchronous and the result already lives on the row, but we still
    // accept the webhook idempotently.
    if (type.startsWith("fund_account.validation.")) {
      const result = await handleValidationEvent(type, event?.payload?.fund_account?.validation?.entity);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sub = event?.payload?.subscription?.entity;
    if (!sub) {
      return new Response(JSON.stringify({ received: true, skipped: "no subscription payload" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // notes are echoed back exactly as we sent them on subscription create.
    // user_id is our primary join key.
    const notes = sub.notes || {};
    const userId = String(notes.user_id || "");
    const plan = String(notes.plan || "").toLowerCase();
    const cycle = String(notes.cycle || "monthly").toLowerCase();
    const subscriptionId = String(sub.id || "");
    const customerId = String(sub.customer_id || "");

    if (!userId) {
      console.error("razorpay webhook missing user_id on subscription notes");
      return new Response(JSON.stringify({ received: true, skipped: "no user_id" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (type) {
      case "subscription.activated":
      case "subscription.charged": {
        // First charge OR a successful renewal. Either way the user is on
        // the paid plan right now. Also null out the Stripe ids — if the
        // user just switched to Razorpay from Stripe, the Stripe sub was
        // cancelled in cancelPriorSubscriptions but its id was still on
        // the row; without clearing it a subsequent Stripe cancellation
        // webhook would (mis)recognise the row as "currently on Stripe"
        // and downgrade the user.
        if (plan) {
          await setUserPlan(userId, plan, {
            billing_cycle: cycle,
            razorpay_customer_id: customerId,
            razorpay_subscription_id: subscriptionId,
            stripe_subscription_id: null,
            stripe_customer_id: null,
          });

          // Refer & Earn (Phase 1). Idempotent via
          // referrals.qualifying_event_id unique constraint — both
          // subscription.activated AND subscription.charged fire on
          // first payment; only the first one wins.
          try {
            await ensureReferralCode(supabase, userId);
            const planKey = plan.toLowerCase() as "starter" | "pro" | "elite";
            if (subscriptionId && ["starter", "pro", "elite"].includes(planKey)) {
              await qualifyReferralIfEligible(supabase, {
                refereeId: userId,
                refereePlan: planKey,
                qualifyingEventId: subscriptionId,
              });
            }
          } catch (e) {
            console.error("referral qualification (razorpay) failed:", (e as any)?.message || e);
          }

          // Refer & Earn (Phase 2). If the sub was created with an
          // RC redemption offer attached, insert the matching
          // REDEMPTION ledger row. Idempotent via note lookup on the
          // sub id — subscription.activated + subscription.charged
          // fire together on first payment; only the first one wins.
          // Gated with the rest of the rewards programme while store billing
          // ships (see _shared/rewards.ts). Checkout no longer attaches an RC
          // redemption, so rc_applied should always be 0 — the guard is belt
          // and braces for a subscription created before the switch-off.
          try {
            const rcApplied = rewardsEnabled() ? Number(notes.rc_applied || 0) : 0;
            if (rcApplied > 0 && subscriptionId) {
              const { data: existing } = await supabase
                .from("reward_credits_ledger")
                .select("id")
                .eq("user_id", userId)
                .eq("reason", "REDEMPTION")
                .ilike("note", `%${subscriptionId}%`)
                .limit(1)
                .maybeSingle();
              if (!existing) {
                const { data: availRow } = await supabase
                  .from("v_reward_credits_available_balance")
                  .select("available_balance")
                  .eq("user_id", userId)
                  .maybeSingle();
                const applied = Math.min(rcApplied, availRow?.available_balance || 0);
                if (applied > 0) {
                  const { data: rawBal } = await supabase
                    .from("v_reward_credits_balance")
                    .select("balance")
                    .eq("user_id", userId)
                    .maybeSingle();
                  const balanceAfter = (rawBal?.balance || 0) - applied;
                  await supabase.from("reward_credits_ledger").insert({
                    user_id: userId,
                    delta_rc: -applied,
                    reason: "REDEMPTION",
                    balance_after: balanceAfter,
                    note: `Applied via Razorpay checkout (sub ${subscriptionId})`,
                  });
                }
              }
            }
          } catch (e) {
            console.error("RC redemption ledger insert (razorpay) failed:", (e as any)?.message || e);
          }

          // First-cycle-discount finisher (referral 50%-off / RC). razorpay-
          // checkout bills the first cycle on a throwaway discounted plan so
          // the reduced amount shows at checkout, and records the real plan in
          // notes.base_plan_id. Now that the sub is active, swap it onto the
          // real plan at cycle end so renewals charge full price. Backstops
          // reconcile-subscription (which does the same on the client's post-
          // payment call); idempotent — skips if already on the real plan or a
          // change is already scheduled.
          try {
            const basePlanId = String(notes.base_plan_id || "");
            const curPlanId = String(sub.plan_id || "");
            if (basePlanId && basePlanId !== curPlanId && !sub.has_scheduled_changes) {
              const keyId = Deno.env.get("RAZORPAY_KEY_ID");
              const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
              if (keyId && keySecret) {
                const upRes = await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
                  method: "PATCH",
                  headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`, "Content-Type": "application/json" },
                  body: JSON.stringify({ plan_id: basePlanId, schedule_change_at: "cycle_end", customer_notify: 1 }),
                });
                const upJson = await upRes.json().catch(() => ({}));
                if (upJson?.error) console.warn("razorpay first-cycle upgrade (webhook) skipped:", upJson?.error?.description);
              }
            }
          } catch (e) {
            console.error("first-cycle upgrade (webhook) failed:", (e as any)?.message || e);
          }
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.completed":
      case "subscription.halted": {
        // Cancelled = user cancelled. completed = total_count reached.
        // halted = payment failure exhausted retries.
        //
        // Two skip conditions:
        //   (a) The user has since switched gateways (payment_gateway
        //       is no longer "razorpay") — this event is for a stale
        //       sub from before the switch. Don't downgrade.
        //   (b) The sub id on the row doesn't match — typically a
        //       prior Razorpay sub we cancelled during an upgrade chain.
        const { data: current } = await supabase
          .from("influencer_profiles")
          .select("razorpay_subscription_id, payment_gateway")
          .eq("influencer_id", userId)
          .maybeSingle();
        if (current?.payment_gateway && current.payment_gateway !== "razorpay") {
          console.log(
            "Ignoring Razorpay cancellation — user switched gateways",
            subscriptionId
          );
          break;
        }
        if (current?.razorpay_subscription_id && current.razorpay_subscription_id !== subscriptionId) {
          console.log(
            "Ignoring cancellation of stale Razorpay sub",
            subscriptionId,
            "— current is",
            current.razorpay_subscription_id
          );
          break;
        }
        await setUserPlan(userId, "starter");
        break;
      }
    }

    // Refer & Earn — clawback on subscription refund. Razorpay's
    // `refund.processed` doesn't share the same envelope shape as the
    // subscription events above, so handle it after the main switch.
    // Idempotent via referrals.qualifying_event_id.
    if (String(event?.event || "") === "refund.processed") {
      try {
        const paymentId = event?.payload?.payment?.entity?.id || event?.payload?.refund?.entity?.payment_id;
        const subId =
          event?.payload?.payment?.entity?.subscription_id ||
          event?.payload?.subscription?.entity?.id ||
          event?.payload?.refund?.entity?.notes?.subscription_id ||
          null;
        if (subId) {
          await clawBackReferral(supabase, String(subId));
        } else if (paymentId) {
          // Fall back: match the referral by payment id via notes.
          console.log("refund.processed: no subscription id, payment id", paymentId);
        }
      } catch (e) {
        console.error("clawback (razorpay) failed:", (e as any)?.message || e);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
