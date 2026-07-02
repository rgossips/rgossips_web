// Shared referral-qualification helpers used by both webhooks
// (stripe-webhook + razorpay-webhook). Not deployed as its own edge
// function — the _shared/ directory is a convention Supabase's runtime
// bundles into whichever function imports it.
//
// Logic mirrors the doc §4.5:
//   1. Ensure the paying user has a referral_code (generate one if
//      they don't — this is what makes them eligible to earn referrals).
//   2. Look up any open (SIGNED_UP) referral row where THEY are the
//      referee. If found, and the referrer still has an active
//      subscription (strict), and the referrer hasn't hit their 5/day
//      cap, mark the row QUALIFIED and credit REFERRAL_EARN.
//   3. On refund within 7 days of QUALIFIED, insert CLAWBACK.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Instant-reward RC by referee's first-purchase plan.
export const REWARD_BY_PLAN: Record<string, number> = {
  starter: 50,
  pro: 150,
  elite: 300,
};

const DAILY_CAP = 5;

// Base62 short slug (no confusing 0/O/1/l). Length 8 = ~10^14 space,
// no realistic collisions but we still check + retry on unique-index
// violation.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randSlug(len = 8): string {
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  let out = "";
  for (const b of buf) out += ALPHABET[b % ALPHABET.length];
  return out;
}

/**
 * Ensure the given influencer has a referral_code. Called whenever a
 * subscription payment succeeds — a paid user becomes eligible to earn
 * referrals from that moment.
 */
export async function ensureReferralCode(
  admin: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: row } = await admin
    .from("influencer_profiles")
    .select("influencer_id, referral_code")
    .eq("influencer_id", userId)
    .maybeSingle();
  if (!row) return null;
  if (row.referral_code) return row.referral_code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = randSlug(8);
    const { error } = await admin
      .from("influencer_profiles")
      .update({ referral_code: slug })
      .eq("influencer_id", userId);
    if (!error) return slug;
    // Unique violation → retry with fresh slug.
    if (String(error.code) !== "23505") {
      console.error("ensureReferralCode failed:", error.message);
      return null;
    }
  }
  return null;
}

/**
 * On a first-successful-subscription-payment for `refereeId`, look up
 * an open referral row and — if the referrer is still eligible —
 * mark it QUALIFIED and credit REFERRAL_EARN.
 *
 * `qualifyingEventId` is the subscription id (Stripe or Razorpay) — it
 * seats the unique constraint on public.referrals so a re-delivered
 * webhook is a no-op.
 *
 * Returns { ok, reason } describing what happened. Never throws.
 */
export async function qualifyReferralIfEligible(admin: SupabaseClient, args: {
  refereeId: string;
  refereePlan: "starter" | "pro" | "elite";
  qualifyingEventId: string;
}): Promise<{ ok: boolean; reason: string; rc?: number }> {
  const { refereeId, refereePlan, qualifyingEventId } = args;

  // Find an open referral row where this user is the referee.
  const { data: row } = await admin
    .from("referrals")
    .select("id, referrer_id, status, qualifying_event_id")
    .eq("referee_id", refereeId)
    .in("status", ["PENDING", "SIGNED_UP"])
    .limit(1)
    .maybeSingle();
  if (!row) return { ok: false, reason: "no_open_referral" };

  // Idempotency — if already qualified with this event id, no-op.
  if (row.qualifying_event_id === qualifyingEventId) {
    return { ok: false, reason: "already_qualified" };
  }

  // Referrer strict-active-subscription check.
  const { data: referrer } = await admin
    .from("influencer_profiles")
    .select("subscription_plan, stripe_subscription_id, razorpay_subscription_id")
    .eq("influencer_id", row.referrer_id)
    .maybeSingle();
  const referrerActive =
    referrer?.subscription_plan &&
    referrer.subscription_plan !== "trial" &&
    (!!referrer.stripe_subscription_id || !!referrer.razorpay_subscription_id);
  if (!referrerActive) {
    // Referrer cancelled between share and qualification. Referee still
    // gets their welcome discount but the referrer earns nothing.
    // We flip the referral to REVERSED so it doesn't linger.
    await admin
      .from("referrals")
      .update({
        status: "REVERSED",
        reversed_at: new Date().toISOString(),
        qualifying_event_id: qualifyingEventId,
      })
      .eq("id", row.id);
    return { ok: false, reason: "referrer_cancelled" };
  }

  // 5/day cap (IST). We check REWARDED_at within the last 24h — using
  // rewarded_at makes cap enforcement precise even if the qualifying
  // events straddled a midnight boundary.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: rewardedLast24h } = await admin
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", row.referrer_id)
    .eq("status", "REWARDED")
    .gte("rewarded_at", dayAgo);
  if ((rewardedLast24h ?? 0) >= DAILY_CAP) {
    // Push into MANUAL_REVIEW so admin can approve later if warranted.
    await admin
      .from("referrals")
      .update({
        status: "MANUAL_REVIEW",
        qualifying_event_id: qualifyingEventId,
      })
      .eq("id", row.id);
    return { ok: false, reason: "daily_cap_hit" };
  }

  // Compute reward + write everything.
  const rc = REWARD_BY_PLAN[refereePlan] ?? 0;
  if (rc <= 0) return { ok: false, reason: "unknown_plan" };

  // Get current balance snapshot for balance_after.
  const { data: bal } = await admin
    .from("v_reward_credits_balance")
    .select("balance")
    .eq("user_id", row.referrer_id)
    .maybeSingle();
  const newBalance = (bal?.balance || 0) + rc;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const { error: refErr } = await admin
    .from("referrals")
    .update({
      status: "REWARDED",
      referee_first_plan: refereePlan.toUpperCase(),
      qualifying_event_id: qualifyingEventId,
      referrer_reward_rc: rc,
      qualified_at: now.toISOString(),
      rewarded_at: now.toISOString(),
    })
    .eq("id", row.id);
  if (refErr) {
    // Unique-index race — another webhook delivery beat us to it.
    // Idempotency preserved because the qualifying_event_id already
    // has this value.
    if (String(refErr.code) === "23505") {
      return { ok: false, reason: "already_qualified_race" };
    }
    console.error("qualify update failed:", refErr.message);
    return { ok: false, reason: "db_error" };
  }

  const { error: ledgerErr } = await admin
    .from("reward_credits_ledger")
    .insert({
      user_id: row.referrer_id,
      delta_rc: rc,
      reason: "REFERRAL_EARN",
      ref_referral_id: row.id,
      balance_after: newBalance,
      expires_at: expiresAt,
    });
  if (ledgerErr) {
    console.error("REFERRAL_EARN ledger insert failed:", ledgerErr.message);
    // Row is already REWARDED. Alerting matters here — do NOT roll
    // back the referral row (that would risk a second webhook
    // re-qualifying and double-crediting).
  }

  // Best-effort notification.
  try {
    await admin.from("notifications").insert({
      user_id: row.referrer_id,
      type: "referral_earned",
      title: `You earned ${rc} RC!`,
      body: JSON.stringify({
        text: `Your friend subscribed to the ${refereePlan.toUpperCase()} plan. ${rc} RC just landed in your wallet.`,
        link: "/influencer/refer",
      }),
      is_read: false,
    });
  } catch (_) { /* non-fatal */ }

  return { ok: true, reason: "rewarded", rc };
}

/**
 * On refund/chargeback within 7 days of QUALIFIED → mark REVERSED and
 * insert negative CLAWBACK ledger row. Idempotent via qualifying_event_id.
 */
export async function clawBackReferral(admin: SupabaseClient, qualifyingEventId: string) {
  const { data: row } = await admin
    .from("referrals")
    .select("id, referrer_id, referrer_reward_rc, rewarded_at, status")
    .eq("qualifying_event_id", qualifyingEventId)
    .maybeSingle();
  if (!row) return { ok: false, reason: "no_referral" };
  if (row.status === "REVERSED") return { ok: false, reason: "already_reversed" };
  if (row.status !== "REWARDED") return { ok: false, reason: "not_rewarded" };

  // 7-day claw-back window.
  const rewardedAtMs = new Date(row.rewarded_at || 0).getTime();
  if (Date.now() - rewardedAtMs > 7 * 24 * 60 * 60 * 1000) {
    return { ok: false, reason: "past_clawback_window" };
  }

  // Read balance for snapshot.
  const { data: bal } = await admin
    .from("v_reward_credits_balance")
    .select("balance")
    .eq("user_id", row.referrer_id)
    .maybeSingle();
  const balanceAfter = (bal?.balance || 0) - row.referrer_reward_rc;

  await admin
    .from("referrals")
    .update({ status: "REVERSED", reversed_at: new Date().toISOString() })
    .eq("id", row.id);

  await admin.from("reward_credits_ledger").insert({
    user_id: row.referrer_id,
    delta_rc: -row.referrer_reward_rc,
    reason: "CLAWBACK",
    ref_referral_id: row.id,
    balance_after: balanceAfter,
    note: `Refund / chargeback within 7d of QUALIFIED (${qualifyingEventId})`,
  });

  return { ok: true, reason: "clawed_back" };
}
