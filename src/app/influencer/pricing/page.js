"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Crown, Loader2, Sparkles, Zap, Target, Rocket, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SharedGatewayPickerModal from "@/components/GatewayPickerModal";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { PLAN_IDS, PLAN_PRICING, PLAN_STRIPE_PRICES, PLAN_RAZORPAY_IDS, FEATURE_GROUPS, FEATURE_MATRIX, formatFeatureValue } from "@/lib/plans";
import { getEffectivePlan, isWithinTrial, trialDaysLeft } from "@/lib/plans";

const PLAN_META = {
  starter: {
    label: "Starter",
    icon: <Target className="w-5 h-5" />,
    tagline: "Get listed and start applying",
    description: "Best for nano creators (1K – 25K)",
    accent: "text-slate-700 bg-slate-50",
  },
  pro: {
    label: "Pro",
    icon: <Zap className="w-5 h-5" />,
    tagline: "Built to earn seriously",
    description: "Best for micro/mid creators (10K – 200K)",
    accent: "text-[#5851DB] bg-[#EBE9FE]",
    popular: true,
  },
  elite: {
    label: "Elite",
    icon: <Rocket className="w-5 h-5" />,
    tagline: "Pro-grade creator OS",
    description: "Best for macro/mega creators (200K+)",
    accent: "text-emerald-700 bg-emerald-50",
  },
};

const PLAN_ORDER = [PLAN_IDS.STARTER, PLAN_IDS.PRO, PLAN_IDS.ELITE];

// Renewal approximation. We don't surface `subscription_current_period_end`
// from the gateways onto the profile, so — matching ProStatusCard — we
// assume the active subscription renews `cycleDays` after the last profile
// update (bumped on plan change / renewal). Good enough to give the user a
// real "renews in N days" without a schema change.
function getPlanRenewalInfo(profile) {
  if (!profile?.updated_at) return { daysLeft: null, date: null };
  const cycleDays = profile.billing_cycle === "annual" ? 365 : 30;
  const start = new Date(profile.updated_at);
  const elapsed = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, cycleDays - elapsed);
  const date = new Date(start.getTime() + cycleDays * 24 * 60 * 60 * 1000);
  return { daysLeft, cycleDays, date };
}

// Razorpay Checkout.js — lazy-loaded the first time the user picks
// Razorpay so we don't drag a third-party script in on every pricing
// page view. Re-uses the same <script> tag if it's already in flight.
const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
function loadRazorpayCheckout() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  const existing = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed to load")));
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = RAZORPAY_CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Razorpay script failed to load"));
    document.body.appendChild(s);
  });
}

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, user, refreshProfile } = useAuth();
  const supabase = createClient();
  const [billing, setBilling] = useState("monthly"); // "monthly" | "annual"
  const [upgrading, setUpgrading] = useState(null);
  // Refer & Earn Phase 2: spendable RC balance + "apply at checkout" toggle.
  // We fetch v_reward_credits_available_balance (locked rows excluded) once
  // on mount and again after any successful upgrade so the toggle reflects
  // the new remaining balance without a hard reload.
  const [availableRc, setAvailableRc] = useState(0);
  const [applyRc, setApplyRc] = useState(false);
  const [verifying, setVerifying] = useState(false);
  // Locks the whole page while we're talking to the gateway between
  // "user picked Stripe / Razorpay" and "checkout UI is visible." The
  // little inline spinner on the upgrade button wasn't enough — the
  // gateway round-trip can take a couple of seconds and the page felt
  // unresponsive. This overlay matches the post-payment one.
  const [preparingCheckout, setPreparingCheckout] = useState(null); // gateway label for the loader copy
  // Set after the verifying poll finishes so we can show a celebration
  // modal with payment + subscription ids that came back on the URL.
  // Shape: { gateway, paymentId, subscriptionId, sessionId, plan, cycle }
  const [successDetails, setSuccessDetails] = useState(null);
  // Gateway picker modal. Holds the planId the user wants to upgrade to so
  // the modal knows which plan to charge once they pick a gateway.
  const [gatewayPickerPlan, setGatewayPickerPlan] = useState(null);
  // { title, message } or null. Replaces the old window.alert() popups —
  // both are blocking but a styled modal is consistent with the rest of
  // the app and lets us surface gateway-specific guidance.
  const [errorModal, setErrorModal] = useState(null);
  const showError = (message, title = "Couldn't start checkout") =>
    setErrorModal({ title, message: String(message || "Something went wrong. Please try again.") });

  const effectivePlan = getEffectivePlan(profile);
  const onTrial = isWithinTrial(profile);
  const daysLeft = trialDaysLeft(profile);
  // Paid plans show a "renews in N days" line at the top. Gate on an
  // actual paid subscription_plan (not a lapsed trial) — same rule as
  // ProStatusCard's hasPaidPlan.
  const renewal = getPlanRenewalInfo(profile);
  const currentPlanRaw = (profile?.subscription_plan || "").toLowerCase();
  const hasPaidPlan = !!currentPlanRaw && currentPlanRaw !== "free" && currentPlanRaw !== "trial";
  const showRenewal = !onTrial && hasPaidPlan && renewal.daysLeft != null;

  // After Stripe / Razorpay redirects back with a success flag, the
  // webhook is the source of truth — it usually beats the user back to
  // this page, but not always. We poll the profile a handful of times
  // and ALWAYS clear the overlay at the end.
  //
  // History: refreshProfile / router / searchParams from React hooks all
  // churn on every AuthContext re-render. Putting any of them in a
  // useEffect dep array means the effect tears down and re-runs
  // mid-poll, the verifyRef guard skips the re-run, and the cleanup-set
  // `cancelled` flag gates the setVerifying(false) call — so the overlay
  // stays on indefinitely. Easier to just read the flag from
  // window.location once on mount with an empty dep array and refs for
  // everything else.
  const refreshProfileRef = useRef(refreshProfile);
  const routerRef = useRef(router);
  refreshProfileRef.current = refreshProfile;
  routerRef.current = router;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = new URLSearchParams(window.location.search);
    const isStripeReturn = qs.get("success") === "1";
    const isRazorpayReturn = qs.get("razorpay_success") === "1";
    if (!isStripeReturn && !isRazorpayReturn) return;

    // Capture the ids from the URL *before* the polling loop runs the
    // router.replace that strips them. The success modal renders them
    // back to the user once the verifying overlay clears.
    const capturedSession = qs.get("session_id") || null;
    const capturedSubscription = qs.get("subscription_id") || null;
    const capturedPayment = qs.get("razorpay_payment_id") || null;
    const capturedGateway = isRazorpayReturn ? "razorpay" : "stripe";

    let unmounted = false;
    setVerifying(true);
    (async () => {
      // Poll up to ~12s, refreshing the profile every 1.5s. Webhooks
      // typically land in 1–3s, so most users see one pass and they're
      // done. Hard ceiling guarantees the overlay clears even if the
      // webhook never fires (e.g. test-mode account misconfig).
      const deadline = Date.now() + 12_000;
      while (Date.now() < deadline) {
        try {
          await refreshProfileRef.current?.();
        } catch (e) {
          console.error("refreshProfile during verify failed:", e);
        }
        await new Promise((r) => setTimeout(r, 1500));
      }

      // Reconcile fallback. The webhook is the normal source of truth, but
      // if it's disabled/dropped the plan never flips. Ask the server to
      // reconcile against Razorpay directly — it's idempotent and verifies
      // the active subscription server-side, so it's a no-op when the
      // webhook already did its job and a self-heal when it didn't.
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await supabase.functions.invoke("reconcile-subscription", {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: {},
          });
          await refreshProfileRef.current?.();
        }
      } catch (e) {
        console.error("reconcile fallback failed:", e);
      }

      // Always clear, even if the component unmounted — setState on
      // unmounted is a harmless no-op warning, but a stuck overlay is
      // user-facing breakage. Same reasoning for the URL replace.
      if (!unmounted) {
        setVerifying(false);
        // The latest profile (from refreshProfile) carries the just-paid
        // plan + cycle the webhook wrote. AuthContext is async wrt this
        // closure, so we read once more after the poll for the modal.
        const latestProfile = refreshProfileRef.current
          ? // refreshProfile returns void, so read from the latest snapshot via the ref.
            // We use the most-current `profile` via React's render — but
            // since we're inside the effect closure, we just trust the
            // PLAN_PRICING + the URL data. The actual plan will reflow
            // on the next render from AuthContext.
            null
          : null;
        void latestProfile;
        // Recover the plan the user actually purchased (stashed before
        // checkout) so the modal shows THAT, not a stale profile plan.
        let purchased = null;
        try {
          const raw = window.sessionStorage.getItem("rg_pending_plan");
          if (raw) purchased = JSON.parse(raw);
          window.sessionStorage.removeItem("rg_pending_plan");
        } catch { /* ignore */ }
        setSuccessDetails({
          gateway: capturedGateway,
          paymentId: capturedPayment,
          subscriptionId: capturedSubscription,
          sessionId: capturedSession,
          plan: purchased?.plan || null,
          cycle: purchased?.cycle || null,
          when: new Date(),
        });
        routerRef.current?.replace("/influencer/pricing");
      }
    })();
    return () => {
      unmounted = true;
    };
    // Empty deps: we want this to fire exactly once per mount. The
    // refs above let us always call the latest refreshProfile / router
    // without re-running this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch spendable RC balance for the redemption toggle. Runs on mount
  // and after a successful upgrade so the toggle immediately reflects
  // the newly-reduced balance. RLS on v_reward_credits_available_balance
  // lets the user read only their own row.
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setAvailableRc(0);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase
          .from("v_reward_credits_available_balance")
          .select("available_balance")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled) setAvailableRc(data?.available_balance || 0);
      } catch {
        if (!cancelled) setAvailableRc(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, supabase, successDetails]);

  // Two-step upgrade: the plan card opens the gateway picker, then the
  // modal calls handleUpgrade(planId, gateway) once the user picks one.
  const openGatewayPicker = (planId) => {
    if (!user?.id) {
      showError("Please sign in to upgrade your plan.", "Sign in required");
      return;
    }
    setGatewayPickerPlan(planId);
  };

  const handleUpgrade = async (planId, gateway) => {
    if (!user?.id) {
      showError("Please sign in to upgrade your plan.", "Sign in required");
      return;
    }

    setUpgrading(planId);
    setGatewayPickerPlan(null);
    setPreparingCheckout(gateway === "razorpay" ? "Razorpay" : "Stripe");
    // Remember what the user is actually buying so the post-payment
    // success modal shows the PURCHASED plan, not whatever the profile
    // currently reads (the webhook that flips subscription_plan may not
    // have landed yet — or, on a plan switch, may lag). sessionStorage
    // survives both the Razorpay in-page modal and the Stripe redirect
    // round-trip (same tab).
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "rg_pending_plan",
          JSON.stringify({ plan: planId, cycle: billing })
        );
      }
    } catch { /* sessionStorage may be unavailable — modal falls back to profile */ }
    try {
      const email = profile?.email || user?.email || "";
      // Razorpay's prefill is finicky: it accepts E.164 (+91…), 10-digit
      // (no prefix), or "91XXXXXXXXXX" but anything with whitespace,
      // dashes, or a leading 0 silently fails to populate the field.
      // Normalise to "+91XXXXXXXXXX" which is the most reliable.
      const phoneForPrefill = normalizeIndianPhone(profile?.phone);

      const planPriceRupees = billing === "annual"
        ? PLAN_PRICING[planId]?.annual || 0
        : PLAN_PRICING[planId]?.monthly || 0;

      if (gateway === "razorpay") {
        const razorpayPlanId = PLAN_RAZORPAY_IDS[planId]?.[billing];
        if (!razorpayPlanId) {
          showError(
            `Razorpay isn't configured for the ${planId} ${billing} plan yet. Set NEXT_PUBLIC_RAZORPAY_PLAN_${planId.toUpperCase()}_${billing.toUpperCase()} in the environment and redeploy.`,
            "Razorpay plan not configured"
          );
          return;
        }
        const { data, error } = await supabase.functions.invoke("razorpay-checkout", {
          body: {
            userId: user.id,
            planId: razorpayPlanId,
            plan: planId,
            cycle: billing,
            email,
            name: profile?.full_name || "",
            contact: phoneForPrefill,
            applyRc: applyRc && availableRc > 0,
            planPriceRupees,
          },
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        if (!data?.subscription_id || !data?.key_id) {
          throw new Error("Razorpay didn't return a subscription / key.");
        }

        // Idempotency: the server found this plan is ALREADY active for the
        // user (a prior successful checkout). Don't reopen Razorpay — that
        // would collect a second charge. Route straight to the success flow,
        // which reconciles the profile against the gateway.
        if (data.already_active) {
          const url = new URL(window.location.href);
          url.searchParams.set("razorpay_success", "1");
          url.searchParams.set("subscription_id", data.subscription_id);
          window.location.replace(url.toString());
          return;
        }

        // Lazy-load Razorpay Checkout.js and open the embedded modal. We
        // intentionally skip the hosted page (rzp.io/rzp/...) — it's
        // gated on the test account having full branding / payment-method
        // config and fails opaquely otherwise. The embedded modal works
        // off the subscription_id directly.
        await loadRazorpayCheckout();
        if (typeof window === "undefined" || !window.Razorpay) {
          throw new Error("Razorpay Checkout failed to load. Check your network.");
        }

        const rzp = new window.Razorpay({
          key: data.key_id,
          subscription_id: data.subscription_id,
          name: "RGossips",
          description: `Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)} · ${billing}`,
          prefill: {
            email,
            contact: phoneForPrefill,
            name: profile?.full_name || "",
          },
          notes: {
            user_id: user.id,
            plan: planId,
            cycle: billing,
          },
          theme: { color: "#5851DB" },
          // We don't read response.razorpay_payment_id locally — the
          // webhook (subscription.activated / subscription.charged) is
          // the source of truth that flips subscription_plan. Just route
          // back to the success polling state.
          handler: (resp) => {
            // resp shape: { razorpay_payment_id, razorpay_subscription_id,
            // razorpay_signature }. Surface the payment id on the URL so
            // the success modal can display it next to the subscription
            // id once the verifying poll completes.
            const url = new URL(window.location.href);
            url.searchParams.set("razorpay_success", "1");
            url.searchParams.set("subscription_id", data.subscription_id);
            if (resp?.razorpay_payment_id) {
              url.searchParams.set("razorpay_payment_id", resp.razorpay_payment_id);
            }
            window.location.replace(url.toString());
          },
          modal: {
            ondismiss: () => {
              // User closed the modal without paying — clear the loading
              // state so they can try again.
              setUpgrading(null);
              setPreparingCheckout(null);
            },
          },
        });
        rzp.on?.("payment.failed", (resp) => {
          showError(
            resp?.error?.description || "The payment didn't go through. Please try again, or use a different card / UPI.",
            "Payment failed"
          );
          setUpgrading(null);
          setPreparingCheckout(null);
        });
        rzp.open();
        // Razorpay's modal is full-viewport; once it's open the prep
        // overlay is redundant. Drop it but keep the upgrading spinner
        // on the plan card in case the user dismisses without paying.
        setPreparingCheckout(null);
        return;
      }

      // Default: Stripe.
      const priceId = PLAN_STRIPE_PRICES[planId]?.[billing];
      if (!priceId) {
        showError(
          `Stripe isn't configured for the ${planId} ${billing} plan yet. Set NEXT_PUBLIC_STRIPE_PRICE_${planId.toUpperCase()}_${billing.toUpperCase()} in the environment and redeploy.`,
          "Stripe price not configured"
        );
        return;
      }
      // Pass the user's email so Stripe creates the customer with a known
      // address and reliably sends subscription invoice emails — without
      // this, Stripe still collects an email during Checkout but won't
      // associate it with the customer record up front.
      // Also pass the current origin so Stripe redirects back to wherever
      // the user actually is (localhost in dev, production in prod) —
      // otherwise the edge function falls back to APP_URL and you land
      // on a 404 if that host isn't serving the app.
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          userId: user.id,
          priceId,
          plan: planId,
          cycle: billing,
          email,
          origin: typeof window !== "undefined" ? window.location.origin : "",
          applyRc: applyRc && availableRc > 0,
          planPriceRupees,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err) {
      showError(err.message || "We couldn't start the checkout. Please try again in a moment.");
      setPreparingCheckout(null);
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-10 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-xl">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Choose your plan</h1>
            <p className="text-xs text-slate-500">Upgrade anytime to unlock more features</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 lg:px-10 py-6 lg:py-10 space-y-8 lg:pt-24">

        {/* Current plan banner */}
        <Card className="p-5 lg:p-7 rounded-3xl border bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-2xl">
                <Crown size={24} className="text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900 capitalize">{onTrial ? "Free Trial" : effectivePlan}</h2>
                  <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px] font-bold">CURRENT</Badge>
                  {onTrial && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] font-bold">Pro features unlocked</Badge>}
                  {showRenewal && (
                    <Badge className="bg-blue-50 text-blue-700 border-0 text-[10px] font-bold">
                      Renews in {renewal.daysLeft} {renewal.daysLeft === 1 ? "day" : "days"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {onTrial
                    ? `${daysLeft} days remaining on your 30-day free trial`
                    : effectivePlan === "starter"
                      ? "Upgrade to unlock more applications, analytics, and visibility"
                      : `Active ${profile?.billing_cycle || "monthly"} subscription${
                          renewal.date
                            ? ` · renews on ${renewal.date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                            : ""
                        }`}
                </p>
              </div>
            </div>
            {onTrial && (
              <div className="flex items-center gap-3 bg-amber-50 px-4 py-2.5 rounded-2xl">
                <Sparkles size={16} className="text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">Pick a plan before day 30 to keep your features</span>
              </div>
            )}
          </div>
        </Card>

        {/* Billing toggle. The gateway choice is deferred to a modal that
            opens after the user clicks "Upgrade" on a plan card. */}
        <div className="flex justify-center">
          <div className="inline-flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${billing === "monthly" ? "bg-[#5851DB] text-white" : "text-slate-500"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${billing === "annual" ? "bg-[#5851DB] text-white" : "text-slate-500"}`}
            >
              Annual <span className="text-[10px] text-emerald-500">(save up to 32%)</span>
            </button>
          </div>
        </div>

        {/* RC redemption toggle — shown only when the user has spendable RC.
            The 50%-of-plan cap is enforced server-side in redeem-rc /
            stripe-checkout / razorpay-checkout, so we advertise the raw
            balance here and let the server compute the actual applied
            amount at checkout time. */}
        {availableRc > 0 && (
          <div className="flex justify-center">
            <label className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm cursor-pointer">
              <input
                type="checkbox"
                checked={applyRc}
                onChange={(e) => setApplyRc(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#5851DB] focus:ring-[#5851DB] cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-700">
                Apply my <span className="text-[#5851DB] font-black">{availableRc} RC</span> at checkout
                <span className="text-[11px] text-slate-400 ml-1 font-normal">(up to 50% off first invoice)</span>
              </span>
            </label>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {PLAN_ORDER.map((planId) => {
            const meta = PLAN_META[planId];
            const pricing = PLAN_PRICING[planId];
            const price = billing === "annual" ? pricing.annual : pricing.monthly;
            const monthEquiv = billing === "annual" ? pricing.monthlyEquivalent : pricing.monthly;
            const isCurrent = effectivePlan === planId && !onTrial;
            const isPopular = meta.popular;

            return (
              <Card key={planId} className={`relative p-6 rounded-3xl border-2 transition-all ${isPopular ? "border-[#5851DB] shadow-xl" : "border-slate-100"}`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#9810FA] to-[#E60076] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most popular
                  </div>
                )}

                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${meta.accent}`}>
                  {meta.icon} {meta.label}
                </div>

                <p className="text-sm text-slate-500 mt-3 leading-snug">{meta.tagline}</p>
                <p className="text-[11px] text-slate-400 mt-1">{meta.description}</p>

                <div className="mt-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">₹{price}</span>
                    <span className="text-sm text-slate-400 font-medium">/{billing === "annual" ? "yr" : "mo"}</span>
                  </div>
                  {billing === "annual" && <p className="text-[11px] text-emerald-600 font-semibold mt-1">≈ ₹{monthEquiv}/mo</p>}
                </div>

                <button
                  onClick={() => openGatewayPicker(planId)}
                  disabled={isCurrent || upgrading === planId}
                  className={`w-full mt-6 py-3 rounded-2xl text-sm font-bold cursor-pointer transition flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : isPopular
                        ? "bg-gradient-to-r from-[#9810FA] to-[#E60076] text-white shadow-lg shadow-purple-100"
                        : "bg-slate-900 text-white"
                  } disabled:opacity-50`}
                >
                  {upgrading === planId && <Loader2 size={14} className="animate-spin" />}
                  {isCurrent
                    ? "Current plan"
                    : PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(effectivePlan)
                    ? `Upgrade to ${meta.label}`
                    : `Choose ${meta.label}`}
                </button>

                <div className="mt-6 space-y-2">
                  {FEATURE_GROUPS.flatMap((g) => g.features)
                    .filter((f) => {
                      const v = FEATURE_MATRIX[f.key]?.[planId];
                      return v && v !== false;
                    })
                    .slice(0, 8)
                    .map((f) => {
                      const v = FEATURE_MATRIX[f.key][planId];
                      const valueText = formatFeatureValue(v);
                      const showValue = valueText !== "✓";
                      return (
                        <div key={f.key} className="flex items-start gap-2">
                          <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-xs text-slate-700 leading-snug">
                            {f.label}
                            {showValue && <span className="ml-1 font-bold text-slate-900">— {valueText}</span>}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Comparison block — redesigned to match the marketing reference:
            gradient header pill row, lavender category bands, purple
            check circles + gradient "star" circles for top-tier-only
            features, and Pro column highlighted as Most Popular. */}
        <ComparisonTable openGatewayPicker={openGatewayPicker} effectivePlan={effectivePlan} onTrial={onTrial} upgrading={upgrading} />
      </div>

      {gatewayPickerPlan && (
        <SharedGatewayPickerModal
          title={
            <>
              Pay for{" "}
              <span className="text-[#5851DB]">
                {PLAN_META[gatewayPickerPlan]?.label || gatewayPickerPlan}
              </span>
            </>
          }
          subtitle="Pick a payment method to continue"
          onCancel={() => setGatewayPickerPlan(null)}
          onPick={(g) => handleUpgrade(gatewayPickerPlan, g)}
        />
      )}

      {verifying && <VerifyingOverlay />}
      {preparingCheckout && !verifying && (
        <PreparingCheckoutOverlay gateway={preparingCheckout} />
      )}
      {successDetails && !verifying && (
        <PaymentSuccessModal
          details={successDetails}
          profile={profile}
          billing={billing}
          onClose={() => setSuccessDetails(null)}
        />
      )}
      {errorModal && (
        <ErrorModal
          title={errorModal.title}
          message={errorModal.message}
          onClose={() => setErrorModal(null)}
        />
      )}
    </div>
  );
}

// Generic styled error modal — replaces blocking window.alert() calls so
// failures (gateway errors, missing config, payment.failed) feel like
// part of the app rather than a browser interrupt. Single primary CTA;
// click-outside or × button to dismiss.
function ErrorModal({ title, message, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-modal-title"
    >
      <div className="w-full sm:w-[420px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#e11d48" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="13" />
              <line x1="12" y1="16.5" x2="12" y2="16.5" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="error-modal-title" className="text-base font-black text-slate-900 leading-snug">
              {title}
            </h3>
            <p className="text-[12px] text-slate-500 font-semibold mt-1 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 -mr-1 -mt-1 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <span className="block w-3 h-3 relative">
              <span className="absolute inset-0 rotate-45 border-t-2 border-slate-400" />
              <span className="absolute inset-0 -rotate-45 border-t-2 border-slate-400" />
            </span>
          </button>
        </div>
        <div className="px-5 pb-5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-white text-sm font-bold cursor-pointer hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// Full-screen lock while we wait for the webhook to flip the plan. The
// useEffect polls refreshProfile for up to 12s; the overlay's purely
// visual but it stops the user from clicking anything else (especially
// another Upgrade button) while the sync is in flight.
function VerifyingOverlay() {
  return (
    <FullPageLoader
      title="Payment received"
      message="Syncing your new plan…"
      hint="This usually takes a couple of seconds."
    />
  );
}

// Same visual shell as VerifyingOverlay but for the moment between
// "user picked a gateway" and "checkout UI is on-screen." Locking the
// whole page during the edge-function round-trip avoids accidental
// double-taps on Upgrade and makes the wait feel intentional.
function PreparingCheckoutOverlay({ gateway }) {
  return (
    <FullPageLoader
      title="Opening checkout"
      message={`Sending you to ${gateway}…`}
      hint="Don't refresh — we're getting your payment session ready."
    />
  );
}

function FullPageLoader({ title, message, hint }) {
  return (
    <div
      aria-busy="true"
      role="status"
      className="fixed inset-0 z-[80] bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
    >
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-purple-100" />
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
          style={{
            borderTopColor: "#9810FA",
            borderRightColor: "#E60076",
            animationDuration: "1.1s",
          }}
        />
      </div>
      <div className="text-center max-w-sm px-6">
        <p className="text-lg font-black text-slate-900">{title}</p>
        <p className="text-sm font-semibold text-slate-500 mt-1">{message}</p>
        {hint && (
          <p className="text-[11px] font-semibold text-slate-400 mt-3">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

// Celebratory popup that lands after the verifying overlay clears.
// Shows plan / cycle (read off the now-refreshed profile), gateway
// badge, the payment / subscription ids the gateway sent on the URL,
// the date, and a Done button. Close affordance is a clear X in the
// top-right corner per the requested spec.
function PaymentSuccessModal({ details, profile, billing, onClose }) {
  // Prefer the plan/cycle the user actually purchased (captured before
  // checkout). The profile's subscription_plan can lag — the webhook that
  // flips it may not have landed, and on a plan switch it can briefly
  // still read the old plan — which is exactly what showed "Elite" after
  // a Pro purchase. Fall back to the profile only if we didn't capture it.
  const plan = (details?.plan || profile?.subscription_plan || "").toLowerCase();
  const cycle = details?.cycle || profile?.billing_cycle || billing || "monthly";
  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "your new plan";
  const cycleLabel = cycle === "annual" ? "Annual" : "Monthly";
  const price = PLAN_PRICING[plan]?.[cycle === "annual" ? "annual" : "monthly"];
  const amount = price ? `₹${price.toLocaleString("en-IN")}` : "—";
  const gatewayLabel = details.gateway === "razorpay" ? "Razorpay" : "Stripe";
  const dateLabel = details.when.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-success-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:w-[460px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Close in the top-right, per spec. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 cursor-pointer text-slate-400 hover:text-slate-600 z-10"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Header strip */}
        <div
          className="px-6 pt-7 pb-6"
          style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
        >
          <div className="text-5xl mb-1" aria-hidden>🎉</div>
          <h2
            id="payment-success-title"
            className="text-xl sm:text-2xl font-black text-white leading-tight"
          >
            You're on {planLabel}!
          </h2>
          <p className="text-[12px] font-semibold text-white/85 mt-1">
            Payment received and your plan is live.
          </p>
        </div>

        {/* Payment + subscription details */}
        <div className="px-6 py-5 space-y-3">
          <DetailRow label="Plan" value={`${planLabel} · ${cycleLabel}`} />
          <DetailRow label="Amount" value={amount} />
          <DetailRow
            label="Paid via"
            value={gatewayLabel}
            valueClassName={
              details.gateway === "razorpay" ? "text-[#0c2451]" : "text-[#635BFF]"
            }
          />
          {details.paymentId && (
            <DetailRow label="Payment ID" value={details.paymentId} mono />
          )}
          {details.subscriptionId && (
            <DetailRow label="Subscription ID" value={details.subscriptionId} mono />
          )}
          {details.sessionId && (
            <DetailRow label="Checkout session" value={details.sessionId} mono />
          )}
          <DetailRow label="Date" value={dateLabel} />
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-white text-sm font-bold cursor-pointer hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            Done
          </button>
          <p className="text-[10px] text-slate-400 font-semibold text-center mt-3 leading-relaxed">
            Receipt + invoice will land in your email. View every past
            invoice from <strong>Profile → Payments → Subscription History</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, valueClassName, mono }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pt-0.5">
        {label}
      </span>
      <span
        className={`text-[13px] font-black text-slate-900 text-right min-w-0 truncate ${
          mono ? "font-mono text-[11px] tracking-tight" : ""
        } ${valueClassName || ""}`}
        title={mono ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}

// Razorpay's prefill is strict about phone formatting. It accepts E.164
// (+91…), bare 10-digit, or "91XXXXXXXXXX" — but any whitespace, dash,
// or leading 0 silently fails to populate. Normalise whatever's on the
// profile to "+91XXXXXXXXXX" before sending.
function normalizeIndianPhone(raw) {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  // Strip a leading 0 (e.g. "09876543210") — landline-style local
  // formats sometimes sneak in this way.
  const noLeadingZero = digits.replace(/^0+/, "");
  // "91" + 10 digits already? Use as-is.
  if (noLeadingZero.length === 12 && noLeadingZero.startsWith("91")) {
    return "+" + noLeadingZero;
  }
  // Bare 10 digits → assume India.
  if (noLeadingZero.length === 10) {
    return "+91" + noLeadingZero;
  }
  // Anything else (already a + prefix, international, etc.) — return
  // raw with a + on the front if missing. Razorpay will surface a clear
  // error if the result is genuinely invalid.
  return raw.startsWith("+") ? raw.replace(/\s|-/g, "") : "+" + noLeadingZero;
}

// Asks the user which payment gateway to checkout through. Both routes
// hit the same plan + bill the same amount; the webhook for whichever
// one charges us is what flips subscription_plan, so the user can't end
// up double-billed.
function GatewayPickerModal({ planId, planLabel, onCancel, onPick }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full sm:w-[420px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Pay for <span className="text-[#5851DB]">{planLabel}</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Pick a payment method to continue
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            type="button"
            className="p-1.5 -mr-1.5 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-2.5">
          <GatewayOption
            onClick={() => onPick("razorpay")}
            logo={<RazorpayLogo />}
            title="Razorpay"
            tagline="UPI · Cards · Netbanking · Wallets"
            accent="border-[#0c2451]/15 hover:border-[#0c2451]/40 hover:bg-[#0c2451]/5"
          />
          <GatewayOption
            onClick={() => onPick("stripe")}
            logo={<StripeLogo />}
            title="Stripe"
            tagline="International cards · Apple Pay · Google Pay"
            accent="border-[#635BFF]/15 hover:border-[#635BFF]/40 hover:bg-[#635BFF]/5"
          />

          <p className="text-[10px] text-slate-400 text-center pt-2 leading-relaxed">
            You'll be redirected to a secure checkout page and brought back
            here when you're done.
          </p>
        </div>
      </div>
    </div>
  );
}

function GatewayOption({ onClick, logo, title, tagline, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 ${accent} cursor-pointer transition-all text-left`}
    >
      <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
        {logo}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-slate-900">{title}</p>
        <p className="text-[11px] text-slate-500 font-semibold mt-0.5 truncate">{tagline}</p>
      </div>
      <span className="text-slate-300 text-lg">›</span>
    </button>
  );
}

// Inline brand marks so we don't add image assets. Reasonable
// approximations of each gateway's wordmark in the correct brand colour.
function StripeLogo() {
  return (
    <svg viewBox="0 0 60 24" className="w-12 h-auto" aria-label="Stripe">
      <path
        fill="#635BFF"
        d="M59.5 14.34c0-4.27-2.07-7.64-6.02-7.64-3.96 0-6.36 3.37-6.36 7.6 0 5.02 2.83 7.56 6.89 7.56 1.98 0 3.48-.45 4.61-1.08v-3.37c-1.13.57-2.43.92-4.08.92-1.62 0-3.05-.57-3.23-2.54h8.14c.01-.22.05-1.1.05-1.45zm-8.23-1.58c0-1.89 1.15-2.67 2.21-2.67 1.02 0 2.11.78 2.11 2.67h-4.32zM39.27 6.7c-1.63 0-2.68.77-3.26 1.3l-.22-1.03h-3.66v19.43l4.16-.88.01-4.72c.6.43 1.49 1.05 2.95 1.05 2.99 0 5.71-2.4 5.71-7.7-.02-4.84-2.78-7.45-5.69-7.45zm-1 11.45c-.98 0-1.56-.35-1.96-.78l-.02-6.17c.43-.48 1.03-.81 1.98-.81 1.52 0 2.57 1.7 2.57 3.87 0 2.22-1.04 3.89-2.57 3.89zM30.95 5.74V2.34l-4.17.88V6.6l4.17-.86zm-4.17 1.24h4.17v14.66h-4.17V6.98zM23.85 8.18l-.27-1.2h-3.59v14.66h4.16V11.71c.98-1.28 2.64-1.05 3.15-.87V6.98c-.53-.19-2.47-.55-3.45 1.2zM15.34 3.34l-4.06.86-.02 13.32c0 2.46 1.85 4.28 4.31 4.28 1.36 0 2.36-.25 2.91-.55v-3.4c-.53.22-3.16 1-3.16-1.46v-5.94h3.16V6.98h-3.16l.02-3.64zM4.21 11.26c0-.65.53-.9 1.41-.9 1.26 0 2.85.38 4.11 1.06V7.49c-1.37-.55-2.73-.76-4.11-.76C2.24 6.73 0 8.49 0 11.43c0 4.59 6.31 3.86 6.31 5.83 0 .76-.66 1.01-1.59 1.01-1.37 0-3.13-.57-4.51-1.32v3.96c1.53.66 3.07.94 4.51.94 3.45 0 5.83-1.7 5.83-4.68 0-4.96-6.34-4.08-6.34-5.91z"
      />
    </svg>
  );
}

function RazorpayLogo() {
  return (
    <svg viewBox="0 0 90 24" className="w-12 h-auto" aria-label="Razorpay">
      <path
        fill="#3395FF"
        d="M22.1 0L14.4 18.4l4.6-9.3-9.3 1.8L7 24l15.1-3.2L29.9 1.7 22.1 0z"
      />
      <path
        fill="#0c2451"
        d="M0 24h7l3.4-13.1L0 24zm38.2-4.27V8.86h-3.3v.86c-.6-.7-1.6-1.13-2.8-1.13-2.9 0-5.27 2.4-5.27 5.36S29.2 19.3 32.1 19.3c1.2 0 2.2-.43 2.8-1.13v.93c-.04.36-.16 1.27-1.06 1.27-.62 0-1.04-.43-1.04-1.13h-3.3c0 1.95 1.5 3.4 4.34 3.4 1.97 0 4.36-1.03 4.36-4.91zm-5.5-3.4c-1.3 0-2.36-1.04-2.36-2.4 0-1.36 1.06-2.4 2.36-2.4 1.3 0 2.36 1.04 2.36 2.4 0 1.36-1.06 2.4-2.36 2.4zm9.18 2.66h-3.3V8.86h3.3v2.3c.5-1.66 1.5-2.46 2.86-2.46h.6v3.2h-.94c-1.6 0-2.52.83-2.52 2.46v4.63zm9.78-10.4c-2.96 0-5.36 2.4-5.36 5.4s2.4 5.4 5.36 5.4 5.36-2.4 5.36-5.4-2.4-5.4-5.36-5.4zm0 7.94c-1.36 0-2.46-1.13-2.46-2.54s1.1-2.54 2.46-2.54 2.46 1.13 2.46 2.54-1.1 2.54-2.46 2.54zm14.97-7.67h-7.94v2.86h4.04l-4.4 4.94v2.33h7.97v-2.86h-4.27l4.6-5.04V8.86zm6.42 10.7h-3.3V8.86h3.3v.86c.6-.7 1.6-1.13 2.8-1.13 2.9 0 5.27 2.4 5.27 5.36s-2.37 5.36-5.27 5.36c-1.2 0-2.2-.43-2.8-1.13v1.38zm2.36-3.27c1.3 0 2.36-1.04 2.36-2.4 0-1.36-1.06-2.4-2.36-2.4-1.3 0-2.36 1.04-2.36 2.4 0 1.36 1.06 2.4 2.36 2.4z"
      />
    </svg>
  );
}

// ─── Comparison table ──────────────────────────────────────────────────
// Marketing-style feature comparison. Same data as the plan cards above
// (driven by FEATURE_GROUPS + FEATURE_MATRIX in @/lib/plans) but laid
// out as a wide table — sticky purple→pink gradient header, Pro column
// highlighted as "Most Popular", lavender category bands, purple check
// circles for "included" and gradient star-circles for "Elite only".
function ComparisonTable({ openGatewayPicker, effectivePlan, onTrial, upgrading }) {
  const tier = (p) => {
    if (p === PLAN_IDS.STARTER) return "Starter";
    if (p === PLAN_IDS.PRO) return "Pro";
    return "Elite";
  };

  return (
    <div className="relative">
      {/* Soft purple radial glow behind the card. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(40% 30% at 100% 0%, rgba(242,51,157,.10), transparent 60%), radial-gradient(40% 30% at 0% 4%, rgba(144,45,223,.10), transparent 60%)",
        }}
      />

      <div className="relative max-w-[1120px] mx-auto">
        {/* Eyebrow + title */}
        <div className="text-center mb-7">
          <p
            className="text-[12px] font-extrabold tracking-[0.2em] uppercase mb-2.5 bg-gradient-to-r from-[#902ddf] to-[#f2339d] bg-clip-text text-transparent"
          >
            Membership Plans
          </p>
          <h2 className="text-2xl lg:text-[40px] font-extrabold text-[#241d33] tracking-tight leading-tight">
            Choose the plan that grows with you
          </h2>
          <p className="text-[15px] text-[#7b7490] mt-2 font-medium">
            Compare every feature across Starter, Pro and Elite.
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-[22px] overflow-hidden"
          style={{
            boxShadow:
              "0 24px 70px -30px rgba(124,58,237,.4), 0 2px 0 rgba(36,29,51,.03)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[840px]">
              {/* ── Header ───────────────────────────────────────────── */}
              <thead>
                <tr
                  style={{
                    background:
                      "linear-gradient(135deg,#902ddf 0%,#f2339d 100%)",
                  }}
                >
                  <th className="sticky left-0 z-10 text-left text-white align-middle px-5 py-6 w-[38%] min-w-[280px] bg-gradient-to-br from-[#902ddf] to-[#f2339d]">
                    <div className="text-[21px] font-extrabold tracking-tight">
                      Pricing
                    </div>
                    <div className="text-[12.5px] font-medium opacity-85 mt-0.5">
                      Compare every feature
                    </div>
                  </th>
                  {PLAN_ORDER.map((p) => {
                    const pricing = PLAN_PRICING[p];
                    const isPop = PLAN_META[p].popular;
                    return (
                      <th
                        key={p}
                        className={`text-center text-white align-middle px-4 py-6 ${
                          isPop ? "shadow-[inset_0_-4px_0_rgba(255,255,255,0.6)]" : ""
                        }`}
                      >
                        <div className="text-[30px] font-extrabold tracking-tight leading-none">
                          ₹{pricing.monthly}
                          <span className="text-[14px] font-semibold opacity-80"> /mo</span>
                        </div>
                        <div className="text-[12px] font-bold tracking-[0.12em] uppercase opacity-90 mt-1.5">
                          {tier(p)}
                        </div>
                        {isPop && (
                          <span className="inline-block mt-2 text-[9.5px] font-extrabold tracking-[0.1em] whitespace-nowrap bg-white/95 text-[#902ddf] px-2.5 py-0.5 rounded-md">
                            ★ MOST POPULAR
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* ── Body ───────────────────────────────────────────── */}
              <tbody>
                {/* CTA row */}
                <tr className="bg-white">
                  <td className="sticky left-0 z-[2] bg-white border-b border-[#efeaf7] p-4" />
                  {PLAN_ORDER.map((p) => {
                    const isPop = PLAN_META[p].popular;
                    const isCurrent = effectivePlan === p && !onTrial;
                    // Direction-aware CTA — "Upgrade to X" when X sits
                    // above the user's current tier in PLAN_ORDER,
                    // "Choose X" when it's a downgrade. Trial users
                    // have effectivePlan="pro" via getEffectivePlan,
                    // so the Pro column shows "Choose Pro" (they need
                    // to actually subscribe) and Elite shows "Upgrade".
                    const ctaLabel = isCurrent
                      ? "Current plan"
                      : PLAN_ORDER.indexOf(p) > PLAN_ORDER.indexOf(effectivePlan)
                      ? `Upgrade to ${PLAN_META[p].label}`
                      : `Choose ${PLAN_META[p].label}`;
                    return (
                      <td
                        key={p}
                        className={`text-center border-b border-[#efeaf7] p-4 ${isPop ? "bg-[rgba(144,45,223,0.05)]" : ""}`}
                      >
                        <button
                          onClick={() => !isCurrent && openGatewayPicker(p)}
                          disabled={isCurrent || upgrading === p}
                          className={`inline-flex items-center justify-center w-full max-w-[170px] px-3.5 py-2.5 rounded-[11px] text-[13.5px] font-bold cursor-pointer transition-all duration-150 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed ${
                            isPop
                              ? "text-white border-0"
                              : "bg-white text-[#7c3aed] border-[1.6px] border-[#e2d6f7] hover:border-[#7c3aed] hover:bg-[#faf7fe]"
                          }`}
                          style={
                            isPop
                              ? {
                                  background:
                                    "linear-gradient(135deg,#902ddf 0%,#f2339d 100%)",
                                  boxShadow:
                                    "0 12px 24px -10px rgba(242,51,157,.55)",
                                }
                              : undefined
                          }
                        >
                          {upgrading === p && <Loader2 size={13} className="animate-spin mr-1.5" />}
                          {ctaLabel}
                        </button>
                      </td>
                    );
                  })}
                </tr>

                {FEATURE_GROUPS.map((group) => (
                  <React.Fragment key={group.title}>
                    {/* Category band */}
                    <tr>
                      <td
                        colSpan={PLAN_ORDER.length + 1}
                        className="sticky left-0 z-[1] bg-[#f6f2fd] py-3 px-6 text-[11.5px] font-extrabold tracking-[0.14em] uppercase text-[#7c3aed]"
                      >
                        {group.title}
                      </td>
                    </tr>

                    {/* Feature rows */}
                    {group.features.map((f) => {
                      // If only Elite has this, use the gradient "star" check.
                      const valuesByPlan = PLAN_ORDER.map(
                        (p) => FEATURE_MATRIX[f.key]?.[p]
                      );
                      const onlyTopTier =
                        !!valuesByPlan[2] && !valuesByPlan[0] && !valuesByPlan[1];

                      return (
                        <tr
                          key={f.key}
                          className="group hover:bg-[#fbf9fe] transition-colors"
                        >
                          <td className="sticky left-0 z-[1] bg-white group-hover:bg-[#fbf9fe] text-left font-semibold text-[14px] text-[#241d33] py-4 px-4 border-b border-[#efeaf7]">
                            {f.label}
                          </td>
                          {PLAN_ORDER.map((p) => {
                            const v = FEATURE_MATRIX[f.key]?.[p];
                            const text = formatFeatureValue(v);
                            const isPop = PLAN_META[p].popular;
                            const hasValue = v && v !== false;
                            return (
                              <td
                                key={p}
                                className={`text-center py-4 px-4 border-b border-[#efeaf7] ${isPop ? "bg-[rgba(144,45,223,0.05)]" : ""}`}
                              >
                                {hasValue ? (
                                  text === "✓" ? (
                                    onlyTopTier ? (
                                      <span
                                        className="inline-grid place-items-center w-[26px] h-[26px] rounded-full text-white"
                                        style={{
                                          background:
                                            "linear-gradient(135deg,#902ddf 0%,#f2339d 100%)",
                                          boxShadow:
                                            "0 6px 14px -4px rgba(242,51,157,.6)",
                                        }}
                                        aria-label="Elite only"
                                      >
                                        <Check size={14} strokeWidth={3} />
                                      </span>
                                    ) : (
                                      <span
                                        className="inline-grid place-items-center w-[26px] h-[26px] rounded-full bg-[#7c3aed] text-white"
                                        aria-label="Included"
                                      >
                                        <Check size={14} strokeWidth={3} />
                                      </span>
                                    )
                                  ) : (
                                    <span
                                      className={`inline-block px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap text-white`}
                                      style={
                                        isPop
                                          ? {
                                              background:
                                                "linear-gradient(135deg,#902ddf 0%,#f2339d 100%)",
                                              boxShadow:
                                                "0 8px 18px -8px rgba(242,51,157,.5)",
                                            }
                                          : { background: "#6d28d9" }
                                      }
                                    >
                                      {text}
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-block w-4 h-[2.5px] rounded-sm bg-[#bcb5cc] align-middle" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-[12.5px] text-[#7b7490] font-medium mt-4">
          All plans are billed monthly. Prices are exclusive of applicable taxes (GST).
        </p>
      </div>
    </div>
  );
}
