"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Crown, Loader2, Sparkles, Zap, Target, Rocket, X, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SharedGatewayPickerModal from "@/components/GatewayPickerModal";
import { useAuth } from "@/context/AuthContext";
import { REWARDS_ENABLED } from "@/lib/features";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { PLAN_IDS, PLAN_PRICING, PLAN_STRIPE_PRICES, PLAN_RAZORPAY_IDS, FEATURE_GROUPS, FEATURE_MATRIX, formatFeatureValue } from "@/lib/plans";
import { getEffectivePlan, isWithinTrial, trialDaysLeft } from "@/lib/plans";
import { useTranslations } from "next-intl";

// User-facing label / tagline / description live in the InfluencerPricing
// catalog, keyed by plan id (starter/pro/elite) and resolved at render.
const PLAN_META = {
  starter: {
    icon: <Target className="w-5 h-5" />,
    accent: "text-slate-700 bg-slate-50",
  },
  pro: {
    icon: <Zap className="w-5 h-5" />,
    accent: "text-[#5851DB] bg-[#EBE9FE]",
    popular: true,
  },
  elite: {
    icon: <Rocket className="w-5 h-5" />,
    accent: "text-emerald-700 bg-emerald-50",
  },
};

const PLAN_ORDER = [PLAN_IDS.STARTER, PLAN_IDS.PRO, PLAN_IDS.ELITE];

// Renewal approximation. We don't surface `subscription_current_period_end`
// from the gateways onto the profile, so — matching ProStatusCard — we
// assume the active subscription renews `cycleDays` after the last profile
// update (bumped on plan change / renewal). Good enough to give the user a
// real "renews in N days" without a schema change.
function getPlanRenewalInfo(profile, realRenewalTs) {
  // Prefer the EXACT next-billing date from the gateway (subscription-history's
  // `next_charge_at`, unix seconds). The updated_at approximation below is
  // wrong whenever the profile was touched for any reason — a profile edit
  // bumps updated_at and resets the fake countdown to a full cycle (the
  // @saquib.siddiqui bug: on Pro since April, but edited today → "renews in
  // 30 days"). Only fall back to the approximation when the real date is
  // unavailable (e.g. subscription-history hasn't returned yet).
  if (realRenewalTs) {
    const date = new Date(realRenewalTs * 1000);
    const daysLeft = Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    return { daysLeft, date, exact: true };
  }
  if (!profile?.updated_at) return { daysLeft: null, date: null };
  const cycleDays = profile.billing_cycle === "annual" ? 365 : 30;
  const start = new Date(profile.updated_at);
  const elapsed = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, cycleDays - elapsed);
  const date = new Date(start.getTime() + cycleDays * 24 * 60 * 60 * 1000);
  return { daysLeft, cycleDays, date };
}

// Bound a promise (edge-function invoke) so a hung request can't leave the
// "Opening checkout" overlay spinning forever. The loser is just ignored —
// the server-side fetches to the gateway have their own AbortSignal timeout,
// so this is the client's belt to the server's braces.
function withTimeout(promise, ms = 20000, label = "The request") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out. Please check your connection and try again.`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
  const t = useTranslations("InfluencerPricing");
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
  // Referrer identity when a referral 50%-off-first-subscription is available.
  const [referralDiscount, setReferralDiscount] = useState(null);
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
  // Exact next-billing timestamp (unix seconds) from the gateway, fetched via
  // subscription-history on mount. Drives the "renews in N days" line so it
  // doesn't reset every time the profile's updated_at is bumped.
  const [realRenewalTs, setRealRenewalTs] = useState(null);
  // Placeholder gate: the updated_at approximation flashed a wrong "renews in
  // 30 days" before the gateway date arrived. Show a skeleton chip until the
  // fetch settles; approximation is only the after-fetch fallback.
  const [renewalFetching, setRenewalFetching] = useState(true);
  const showError = (message, title = t("errors.checkoutTitle")) =>
    setErrorModal({ title, message: String(message || t("errors.genericMessage")) });

  const effectivePlan = getEffectivePlan(profile);
  const onTrial = isWithinTrial(profile);
  const daysLeft = trialDaysLeft(profile);
  // Paid plans show a "renews in N days" line at the top. Gate on an
  // actual paid subscription_plan (not a lapsed trial) — same rule as
  // ProStatusCard's hasPaidPlan.
  const renewal = getPlanRenewalInfo(profile, realRenewalTs);
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

  // Pull the exact next-billing date from the gateway (via subscription-history)
  // so the renewal countdown is real, not the updated_at approximation that
  // resets on every profile edit. Falls back silently on error.
  useEffect(() => {
    if (!user?.id) {
      setRenewalFetching(false);
      return;
    }
    let cancelled = false;
    setRenewalFetching(true);
    (async () => {
      try {
        const { data: hist } = await supabase.functions.invoke("subscription-history", { body: { userId: user.id } });
        const invoices = Array.isArray(hist?.invoices) ? hist.invoices : [];
        const ts = invoices.reduce((max, i) => (i?.next_charge_at ? Math.max(max, i.next_charge_at) : max), 0);
        if (!cancelled && ts > 0) setRealRenewalTs(ts);
      } catch {
        // keep the approximation
      } finally {
        if (!cancelled) setRenewalFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
      // Recover the plan the user purchased (stashed pre-checkout) — used
      // both as the reconcile hint and for the success modal.
      let purchased = null;
      try {
        const raw = window.sessionStorage.getItem("rg_pending_plan");
        if (raw) purchased = JSON.parse(raw);
        window.sessionStorage.removeItem("rg_pending_plan");
      } catch { /* ignore */ }

      let token = null;
      let userId = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || null;
        userId = session?.user?.id || null;
      } catch { /* ignore */ }

      // Reconcile is authoritative and fast: when we pass the just-paid sub
      // id it verifies that subscription directly against the gateway, so we
      // no longer need the old fixed 12s poll (that was the slow loader).
      // Retry only if the new sub isn't visible yet — Razorpay activates a
      // sub asynchronously, Stripe needs a moment to propagate. Attempt 0
      // runs immediately, so the happy path is ~1s.
      let reconciled = false;
      for (let attempt = 0; token && attempt < 4 && !reconciled; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 1200));
        try {
          const { data } = await supabase.functions.invoke("reconcile-subscription", {
            headers: { Authorization: `Bearer ${token}` },
            body: {
              preferSubscriptionId: capturedSubscription || undefined,
              preferGateway: capturedGateway || undefined,
              preferPlan: purchased?.plan || undefined,
            },
          });
          if (data?.reconciled) reconciled = true;
        } catch (e) {
          console.error("reconcile attempt failed:", e);
        }
      }
      try {
        await refreshProfileRef.current?.();
      } catch (e) {
        console.error("refreshProfile after reconcile failed:", e);
      }

      // Always clear, even if the component unmounted — setState on
      // unmounted is a harmless no-op warning, but a stuck overlay is
      // user-facing breakage. Same reasoning for the URL replace.
      if (!unmounted) {
        setVerifying(false);
        setSuccessDetails({
          gateway: capturedGateway,
          paymentId: capturedPayment,
          subscriptionId: capturedSubscription,
          sessionId: capturedSession,
          plan: purchased?.plan || null,
          cycle: purchased?.cycle || null,
          invoiceUrl: null,
          // Button shows immediately in a loading state; flips to a real
          // link (or hides) once this fetch resolves.
          invoiceLoading: true,
          when: new Date(),
        });
        routerRef.current?.replace("/influencer/pricing");

        // Fetch the invoice link and patch the modal. subscription-history
        // returns each invoice's hosted_url / pdf_url for both gateways.
        let invoiceUrl = null;
        try {
          if (userId) {
            const { data: hist } = await supabase.functions.invoke("subscription-history", {
              body: { userId },
            });
            const invoices = Array.isArray(hist?.invoices) ? hist.invoices : [];
            const forSub = capturedSubscription
              ? invoices.filter((i) => i.subscription_id === capturedSubscription)
              : [];
            const pool = (forSub.length ? forSub : invoices)
              .slice()
              .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
            const inv = pool.find((i) => i.status === "paid") || pool[0];
            invoiceUrl = inv ? inv.hosted_url || inv.pdf_url || null : null;
          }
        } catch (e) {
          console.error("invoice link fetch failed:", e);
        }
        setSuccessDetails((prev) =>
          prev ? { ...prev, invoiceUrl, invoiceLoading: false } : prev
        );
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
    // Rewards programme off → never fetch or show a balance or referral perk.
    // Checkout no longer applies either, so displaying them would quote a
    // discount the payment flow will not honour. See lib/features.js.
    if (!REWARDS_ENABLED || !user?.id) {
      setAvailableRc(0);
      setReferralDiscount(null);
      return;
    }
    (async () => {
      try {
        const [{ data }, { data: refData }] = await Promise.all([
          supabase
            .from("v_reward_credits_available_balance")
            .select("available_balance")
            .eq("user_id", user.id)
            .maybeSingle(),
          // Referral perk — returns the referrer's identity only while the
          // 50%-off first-subscription discount is still available (referee,
          // active referral, not yet subscribed). null once used.
          supabase.rpc("get_my_referrer"),
        ]);
        if (cancelled) return;
        setAvailableRc(data?.available_balance || 0);
        const ref = Array.isArray(refData) ? refData[0] : refData;
        setReferralDiscount(ref && (ref.referrer_name || ref.referrer_username) ? ref : null);
      } catch {
        if (!cancelled) {
          setAvailableRc(0);
          setReferralDiscount(null);
        }
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
      showError(t("errors.signInMessage"), t("errors.signInTitle"));
      return;
    }
    // Razorpay is the only enabled gateway, so skip the picker and go
    // straight to checkout. To bring the picker back (e.g. re-enabling
    // Stripe), restore `setGatewayPickerPlan(planId)` here.
    handleUpgrade(planId, "razorpay");
  };

  const handleUpgrade = async (planId, gateway) => {
    if (!user?.id) {
      showError(t("errors.signInMessage"), t("errors.signInTitle"));
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
            t("errors.razorpayNotConfigured", {
              plan: planId,
              cycle: billing,
              planUpper: planId.toUpperCase(),
              cycleUpper: billing.toUpperCase(),
            }),
            t("errors.razorpayNotConfiguredTitle")
          );
          return;
        }
        const { data, error } = await withTimeout(
          supabase.functions.invoke("razorpay-checkout", {
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
          }),
          20000,
          "Checkout"
        );
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        if (!data?.subscription_id || !data?.key_id) {
          throw new Error(t("errors.razorpayNoSub"));
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
          throw new Error(t("errors.razorpayCheckoutLoad"));
        }

        const rzp = new window.Razorpay({
          key: data.key_id,
          subscription_id: data.subscription_id,
          name: "RGossips",
          description: t("razorpayDescription", {
            plan: planId.charAt(0).toUpperCase() + planId.slice(1),
            cycle: billing,
          }),
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
            resp?.error?.description || t("errors.paymentFailed"),
            t("errors.paymentFailedTitle")
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
          t("errors.stripeNotConfigured", {
            plan: planId,
            cycle: billing,
            planUpper: planId.toUpperCase(),
            cycleUpper: billing.toUpperCase(),
          }),
          t("errors.stripeNotConfiguredTitle")
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
      const { data, error } = await withTimeout(
        supabase.functions.invoke("stripe-checkout", {
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
        }),
        20000,
        "Checkout"
      );
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error(t("errors.noCheckoutUrl"));
    } catch (err) {
      showError(err.message || t("errors.checkoutFailed"));
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
            <h1 className="text-lg font-bold text-slate-900">{t("header.title")}</h1>
            <p className="text-xs text-slate-500">{t("header.subtitle")}</p>
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
                  <h2 className="text-lg font-bold text-slate-900 capitalize">{onTrial ? t("currentPlan.freeTrial") : effectivePlan}</h2>
                  <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px] font-bold">{t("currentPlan.current")}</Badge>
                  {onTrial && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] font-bold">{t("currentPlan.proFeaturesUnlocked")}</Badge>}
                  {showRenewal &&
                    (renewalFetching && !renewal.exact ? (
                      <span className="inline-block w-24 h-5 rounded-full bg-slate-100 animate-pulse" aria-label="…" />
                    ) : (
                      <Badge className="bg-blue-50 text-blue-700 border-0 text-[10px] font-bold">
                        {t("currentPlan.renewsIn", { days: renewal.daysLeft })}
                      </Badge>
                    ))}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {onTrial
                    ? t("currentPlan.trialDaysRemaining", { days: daysLeft })
                    : effectivePlan === "starter"
                      ? t("currentPlan.starterUpsell")
                      : renewal.date
                        ? t("currentPlan.activeSubscriptionRenews", {
                            cycle: profile?.billing_cycle || "monthly",
                            date: renewal.date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                          })
                        : t("currentPlan.activeSubscription", { cycle: profile?.billing_cycle || "monthly" })}
                </p>
              </div>
            </div>
            {onTrial && (
              <div className="flex items-center gap-3 bg-amber-50 px-4 py-2.5 rounded-2xl">
                <Sparkles size={16} className="text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">{t("currentPlan.trialWarning")}</span>
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
              {t("billing.monthly")}
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${billing === "annual" ? "bg-[#5851DB] text-white" : "text-slate-500"}`}
            >
              {t.rich("billing.annual", {
                save: (c) => <span className="text-[10px] text-emerald-500">{c}</span>,
              })}
            </button>
          </div>
        </div>

        {/* Referral 50%-off — visible when this referred creator still has the
            first-subscription discount available. It applies automatically at
            checkout (and takes precedence over RC on that first invoice). */}
        {referralDiscount && (
          <div className="flex justify-center">
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-pink-200 bg-gradient-to-r from-purple-50 to-pink-50 shadow-sm max-w-md">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 text-base font-black bg-emerald-500">
                %
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900">{t("referral.fiftyOff")}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[11px] text-slate-500 font-medium">{t("referral.giftedBy")}</span>
                  {referralDiscount.referrer_photo ? (
                    <img
                      src={referralDiscount.referrer_photo}
                      alt={referralDiscount.referrer_name || referralDiscount.referrer_username}
                      className="w-4 h-4 rounded-full object-cover border border-white shadow-sm"
                    />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-[8px] font-black text-white">
                      {(referralDiscount.referrer_name || referralDiscount.referrer_username || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-[11px] font-black text-slate-800">
                    {referralDiscount.referrer_name || `@${referralDiscount.referrer_username}`}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">{t("referral.appliedAutomatically")}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RC redemption toggle — shown only when the user has spendable RC.
            Hidden while the referral 50%-off is active (it wins on the first
            invoice; the RC stays in the wallet for later). The 50%-of-plan cap
            is enforced server-side in redeem-rc / stripe-checkout /
            razorpay-checkout. */}
        {availableRc > 0 && !referralDiscount && (
          <div className="flex justify-center">
            <label className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm cursor-pointer">
              <input
                type="checkbox"
                checked={applyRc}
                onChange={(e) => setApplyRc(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#5851DB] focus:ring-[#5851DB] cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-700">
                {t.rich("rc.apply", {
                  amount: availableRc,
                  rc: (c) => <span className="text-[#5851DB] font-black">{c}</span>,
                  note: (c) => <span className="text-[11px] text-slate-400 ml-1 font-normal">{c}</span>,
                })}
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
                    {t("plans.mostPopular")}
                  </div>
                )}

                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${meta.accent}`}>
                  {meta.icon} {t(`plans.${planId}.label`)}
                </div>

                <p className="text-sm text-slate-500 mt-3 leading-snug">{t(`plans.${planId}.tagline`)}</p>
                <p className="text-[11px] text-slate-400 mt-1">{t(`plans.${planId}.description`)}</p>

                <div className="mt-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">₹{price}</span>
                    <span className="text-sm text-slate-400 font-medium">/{billing === "annual" ? t("price.perYearShort") : t("price.perMonthShort")}</span>
                  </div>
                  {billing === "annual" && <p className="text-[11px] text-emerald-600 font-semibold mt-1">{t("price.monthEquiv", { amount: monthEquiv })}</p>}
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
                    ? t("cta.currentPlan")
                    : PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(effectivePlan)
                    ? t("cta.upgradeTo", { plan: t(`plans.${planId}.label`) })
                    : t("cta.choose", { plan: t(`plans.${planId}.label`) })}
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
          title={t.rich("gatewayPicker.payFor", {
            name: t(`plans.${gatewayPickerPlan}.label`),
            plan: (c) => <span className="text-[#5851DB]">{c}</span>,
          })}
          subtitle={t("gatewayPicker.pickMethod")}
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
  const t = useTranslations("InfluencerPricing");
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
            aria-label={t("common.close")}
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
            {t("errors.gotIt")}
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
  const t = useTranslations("InfluencerPricing");
  return (
    <FullPageLoader
      title={t("verifying.title")}
      message={t("verifying.message")}
      hint={t("verifying.hint")}
    />
  );
}

// Same visual shell as VerifyingOverlay but for the moment between
// "user picked a gateway" and "checkout UI is on-screen." Locking the
// whole page during the edge-function round-trip avoids accidental
// double-taps on Upgrade and makes the wait feel intentional.
function PreparingCheckoutOverlay({ gateway }) {
  const t = useTranslations("InfluencerPricing");
  return (
    <FullPageLoader
      title={t("preparing.title")}
      message={t("preparing.message", { gateway })}
      hint={t("preparing.hint")}
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
  const t = useTranslations("InfluencerPricing");
  // Prefer the plan/cycle the user actually purchased (captured before
  // checkout). The profile's subscription_plan can lag — the webhook that
  // flips it may not have landed, and on a plan switch it can briefly
  // still read the old plan — which is exactly what showed "Elite" after
  // a Pro purchase. Fall back to the profile only if we didn't capture it.
  const plan = (details?.plan || profile?.subscription_plan || "").toLowerCase();
  const cycle = details?.cycle || profile?.billing_cycle || billing || "monthly";
  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : t("success.yourNewPlan");
  const cycleLabel = cycle === "annual" ? t("success.cycleAnnual") : t("success.cycleMonthly");
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
          aria-label={t("common.close")}
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
            {t("success.youreOn", { plan: planLabel })}
          </h2>
          <p className="text-[12px] font-semibold text-white/85 mt-1">
            {t("success.planLive")}
          </p>
        </div>

        {/* Payment + subscription details */}
        <div className="px-6 py-5 space-y-3">
          <DetailRow label={t("success.labels.plan")} value={`${planLabel} · ${cycleLabel}`} />
          <DetailRow label={t("success.labels.amount")} value={amount} />
          <DetailRow
            label={t("success.labels.paidVia")}
            value={gatewayLabel}
            valueClassName={
              details.gateway === "razorpay" ? "text-[#0c2451]" : "text-[#635BFF]"
            }
          />
          {details.paymentId && (
            <DetailRow label={t("success.labels.paymentId")} value={details.paymentId} mono />
          )}
          {details.subscriptionId && (
            <DetailRow label={t("success.labels.subscriptionId")} value={details.subscriptionId} mono />
          )}
          {details.sessionId && (
            <DetailRow label={t("success.labels.checkoutSession")} value={details.sessionId} mono />
          )}
          <DetailRow label={t("success.labels.date")} value={dateLabel} />
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-1 space-y-2.5">
          {/* Invoice button: visible immediately. While the link is still
              being fetched it's a disabled "Preparing invoice…" state (so it
              doesn't pop in suddenly); becomes a real link when ready, and
              hides only if no invoice exists. */}
          {details.invoiceLoading ? (
            <div
              className="w-full py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 opacity-70 cursor-wait"
              style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
              aria-busy="true"
            >
              <Loader2 size={15} className="animate-spin" /> {t("success.preparingInvoice")}
            </div>
          ) : details.invoiceUrl ? (
            <a
              href={details.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl text-white text-sm font-bold cursor-pointer hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
            >
              <ExternalLink size={15} strokeWidth={2.5} /> {t("success.openInvoice")}
            </a>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3 rounded-2xl text-sm font-bold cursor-pointer transition ${
              details.invoiceLoading || details.invoiceUrl
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                : "text-white hover:opacity-90"
            }`}
            style={
              details.invoiceLoading || details.invoiceUrl
                ? undefined
                : { background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }
            }
          >
            {t("success.done")}
          </button>
          <p className="text-[10px] text-slate-400 font-semibold text-center mt-3 leading-relaxed">
            {t.rich("success.receiptNote", {
              b: (c) => <strong>{c}</strong>,
            })}
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
  const t = useTranslations("InfluencerPricing");
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full sm:w-[420px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {t.rich("gatewayPicker.payFor", {
                name: planLabel,
                plan: (c) => <span className="text-[#5851DB]">{c}</span>,
              })}
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              {t("gatewayPicker.pickMethod")}
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label={t("common.close")}
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
            tagline={t("gatewayPicker.razorpayTagline")}
            accent="border-[#0c2451]/15 hover:border-[#0c2451]/40 hover:bg-[#0c2451]/5"
          />
          <GatewayOption
            onClick={() => onPick("stripe")}
            logo={<StripeLogo />}
            title="Stripe"
            tagline={t("gatewayPicker.stripeTagline")}
            accent="border-[#635BFF]/15 hover:border-[#635BFF]/40 hover:bg-[#635BFF]/5"
          />

          <p className="text-[10px] text-slate-400 text-center pt-2 leading-relaxed">
            {t("gatewayPicker.redirectNote")}
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
  const t = useTranslations("InfluencerPricing");

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
            {t("comparison.eyebrow")}
          </p>
          <h2 className="text-2xl lg:text-[40px] font-extrabold text-[#241d33] tracking-tight leading-tight">
            {t("comparison.title")}
          </h2>
          <p className="text-[15px] text-[#7b7490] mt-2 font-medium">
            {t("comparison.subtitle")}
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
                      {t("comparison.pricingHeader")}
                    </div>
                    <div className="text-[12.5px] font-medium opacity-85 mt-0.5">
                      {t("comparison.compareEveryFeature")}
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
                          <span className="text-[14px] font-semibold opacity-80"> /{t("price.perMonthShort")}</span>
                        </div>
                        <div className="text-[12px] font-bold tracking-[0.12em] uppercase opacity-90 mt-1.5">
                          {t(`plans.${p}.label`)}
                        </div>
                        {isPop && (
                          <span className="inline-block mt-2 text-[9.5px] font-extrabold tracking-[0.1em] whitespace-nowrap bg-white/95 text-[#902ddf] px-2.5 py-0.5 rounded-md">
                            {t("comparison.mostPopular")}
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
                      ? t("cta.currentPlan")
                      : PLAN_ORDER.indexOf(p) > PLAN_ORDER.indexOf(effectivePlan)
                      ? t("cta.upgradeTo", { plan: t(`plans.${p}.label`) })
                      : t("cta.choose", { plan: t(`plans.${p}.label`) });
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
                                        aria-label={t("comparison.eliteOnlyAria")}
                                      >
                                        <Check size={14} strokeWidth={3} />
                                      </span>
                                    ) : (
                                      <span
                                        className="inline-grid place-items-center w-[26px] h-[26px] rounded-full bg-[#7c3aed] text-white"
                                        aria-label={t("comparison.includedAria")}
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
          {t("comparison.footnote")}
        </p>
      </div>
    </div>
  );
}
