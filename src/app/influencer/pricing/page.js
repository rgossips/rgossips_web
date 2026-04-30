"use client";

import React, { useState } from "react";
import { ArrowLeft, Check, Crown, Loader2, Sparkles, Zap, Target, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  PLAN_IDS,
  PLAN_PRICING,
  PLAN_STRIPE_PRICES,
  FEATURE_GROUPS,
  FEATURE_MATRIX,
  formatFeatureValue,
} from "@/lib/plans";
import {
  getEffectivePlan,
  isWithinTrial,
  trialDaysLeft,
} from "@/lib/plans";

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

export default function PricingPage() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const supabase = createClient();
  const [billing, setBilling] = useState("monthly"); // "monthly" | "annual"
  const [upgrading, setUpgrading] = useState(null);

  const effectivePlan = getEffectivePlan(profile);
  const onTrial = isWithinTrial(profile);
  const daysLeft = trialDaysLeft(profile);

  const handleUpgrade = async (planId) => {
    if (!user?.id) {
      alert("Please sign in first");
      return;
    }
    const priceId = PLAN_STRIPE_PRICES[planId]?.[billing];
    if (!priceId) {
      alert(
        "Stripe price not configured for this plan. Set NEXT_PUBLIC_STRIPE_PRICE_" +
          planId.toUpperCase() +
          "_" +
          billing.toUpperCase() +
          " in env."
      );
      return;
    }

    setUpgrading(planId);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: { userId: user.id, priceId, plan: planId, cycle: billing },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err) {
      alert(err.message || "Failed to start checkout");
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
                  <h2 className="text-lg font-bold text-slate-900 capitalize">
                    {onTrial ? "Free Trial" : effectivePlan}
                  </h2>
                  <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px] font-bold">
                    CURRENT
                  </Badge>
                  {onTrial && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] font-bold">
                      Elite features unlocked
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {onTrial
                    ? `${daysLeft} days remaining on your 30-day free trial`
                    : effectivePlan === "starter"
                    ? "Upgrade to unlock more applications, analytics, and visibility"
                    : `Active ${profile?.billing_cycle || "monthly"} subscription`}
                </p>
              </div>
            </div>
            {onTrial && (
              <div className="flex items-center gap-3 bg-amber-50 px-4 py-2.5 rounded-2xl">
                <Sparkles size={16} className="text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">
                  Pick a plan before day 30 to keep your features
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Billing toggle */}
        <div className="flex justify-center">
          <div className="inline-flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                billing === "monthly" ? "bg-[#5851DB] text-white" : "text-slate-500"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                billing === "annual" ? "bg-[#5851DB] text-white" : "text-slate-500"
              }`}
            >
              Annual <span className="text-[10px] text-emerald-500">(save up to 32%)</span>
            </button>
          </div>
        </div>

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
              <Card
                key={planId}
                className={`relative p-6 rounded-3xl border-2 transition-all ${
                  isPopular ? "border-[#5851DB] shadow-xl" : "border-slate-100"
                }`}
              >
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
                    <span className="text-sm text-slate-400 font-medium">
                      /{billing === "annual" ? "yr" : "mo"}
                    </span>
                  </div>
                  {billing === "annual" && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                      ≈ ₹{monthEquiv}/mo
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleUpgrade(planId)}
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
                  {isCurrent ? "Current plan" : `Upgrade to ${meta.label}`}
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
                            {showValue && (
                              <span className="ml-1 font-bold text-slate-900">— {valueText}</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Full feature matrix */}
        <Card className="p-5 lg:p-8 rounded-3xl border bg-white">
          <h2 className="text-base lg:text-lg font-extrabold text-slate-900 mb-1">Compare all features</h2>
          <p className="text-xs text-slate-500 mb-6">Everything included on each tier.</p>

          <div className="space-y-7">
            {FEATURE_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                  {group.title}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[560px]">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-2.5 pr-4 font-bold text-slate-500">Feature</th>
                        {PLAN_ORDER.map((p) => (
                          <th key={p} className="py-2.5 px-3 text-center font-bold text-slate-700 capitalize">
                            {p}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.features.map((f) => (
                        <tr key={f.key} className="border-b border-slate-50 last:border-0">
                          <td className="py-2.5 pr-4 text-slate-700">{f.label}</td>
                          {PLAN_ORDER.map((p) => {
                            const v = FEATURE_MATRIX[f.key]?.[p];
                            const text = formatFeatureValue(v);
                            return (
                              <td
                                key={p}
                                className={`py-2.5 px-3 text-center font-bold ${
                                  text === "—" ? "text-slate-300" : "text-slate-700"
                                }`}
                              >
                                {text}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
