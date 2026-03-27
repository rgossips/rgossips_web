"use client";

import React, { useState } from "react";
import { Check, X, Target, Zap, Rocket, Crown, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const TRIAL_DAYS = 30;

const plans = {
  monthly: [
    {
      id: "starter",
      name: "Starter",
      icon: <Target className="w-5 h-5" />,
      tagline: "Your launchpad into the world of brand collaborations",
      price: "99",
      priceNum: 99,
      period: "/mo",
      description:
        "Best for: Nano & micro influencers (1K – 25K followers)",
      features: [
        "Listed in brand search",
        "Up to 3 campaign applications/month",
        "Brand DMs 10/month",
        "1 media kit template (PDF)",
        "Basic analytics dashboard",
        "Creator community & forums",
        "Standard payouts 7-10 days",
        "Verified badge eligibility",
        "AI caption & hook generator 3/month",
        "Brief templates library",
      ],
      notIncluded: [
        "Priority brand search placement",
        "Unlimited applications",
        "AI content suite",
        "Audience insights & demographics",
        "Dedicated support manager",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      icon: <Zap className="w-5 h-5" />,
      tagline: "Built for creators who are ready to earn seriously",
      price: "299",
      priceNum: 299,
      period: "/mo",
      popular: true,
      description:
        "Best for: Micro to mid-tier influencers (10K – 200K followers)",
      features: [
        "Priority brand search placement 3× more visibility",
        "Unlimited campaign applications",
        "Unlimited brand DMs",
        "AI content suite 50/month",
        "3 media kit templates (PDF + link)",
        "Advanced analytics & reports",
        "Audience insights age, gender, location",
        "Fake follower & engagement audit monthly",
        "Rate benchmarking tool",
        "Early access to brand deals 48hr head start",
        "Faster payouts 3-5 days",
        "Creator Academy - Full access",
      ],
      notIncluded: [
        "Dedicated account manager",
        "Homepage spotlight feature",
        "Custom media kit builder",
      ],
    },
    {
      id: "elite",
      name: "Elite",
      icon: <Rocket className="w-5 h-5" />,
      tagline: "The professional-grade creator OS",
      price: "699",
      priceNum: 699,
      period: "/mo",
      description:
        "Best for: Macro & mega influencers (200K+ followers)",
      features: [
        "Featured in brand search (top) max visibility",
        "Unlimited applications + AI shortlisting",
        "Dedicated account manager WhatsApp + email",
        "AI content suite - unlimited",
        "Custom media kit builder",
        "Deep audience analytics + psychographics",
        "Monthly fake follower & engagement audit",
        "Instant payouts within 48 hrs",
        "Priority deal matching",
        "Campaign ROI report for brand partners",
        "Homepage spotlight feature monthly rotation",
        "Analytics export (Excel, PDF, link)",
        "Elite Verified badge",
        "Beta access to new features",
      ],
      notIncluded: [],
    },
  ],
  annual: [
    {
      id: "starter_annual",
      name: "Starter Annual",
      icon: <Target className="w-5 h-5" />,
      tagline: "12 months for the price of 9",
      price: "899",
      priceNum: 899,
      period: "/yr",
      savings: "Save ₹289",
      description: "₹75/month · 32% off",
      features: [
        "All Starter Monthly features, plus:",
        "3 months FREE (pay for 9)",
        "2× AI content generation 4/mo",
        "2 media kit templates",
        "Annual performance report",
        "Priority access to events & webinars",
        "Price locked for 12 months",
      ],
      notIncluded: [
        "Priority brand search",
        "AI content suite (unlimited)",
        "Audience insights",
        "Dedicated support manager",
      ],
    },
    {
      id: "pro_annual",
      name: "Pro Annual",
      icon: <Zap className="w-5 h-5" />,
      tagline: "Scale your brand deals all year long",
      price: "2,899",
      priceNum: 2899,
      period: "/yr",
      savings: "Save ₹689",
      popular: true,
      description: "₹241/month · 24% off",
      features: [
        "All Pro Monthly features, plus:",
        "~2 months FREE (pay for 10)",
        "2× AI content suite 100/mo",
        "Quarterly audience audit 4×/year",
        "2 brand newsletter features/yr",
        "Exclusive annual-only campaigns",
        "Annual income summary download",
        "Priority support 12hr SLA",
        "Price locked for 12 months",
      ],
      notIncluded: [
        "Dedicated account manager",
        "Custom analytics export",
        "Homepage spotlight",
      ],
    },
    {
      id: "elite_annual",
      name: "Elite Annual",
      icon: <Rocket className="w-5 h-5" />,
      tagline: "The all-in-one professional creator OS",
      price: "6,899",
      priceNum: 6899,
      period: "/yr",
      savings: "Save ₹1,489",
      description: "₹575/month · 22% off",
      features: [
        "All Elite Monthly features, plus:",
        "~2 months FREE on annual billing",
        "Dedicated account manager - 8hr SLA",
        "Quarterly strategy call 4 sessions/yr",
        "4 homepage spotlights/yr",
        "Annual report - stats, income & growth",
        "RGossips Creator Summit invite",
        "First access to all new features",
        "Price locked for 12 months",
      ],
      notIncluded: [],
    },
  ],
};

function getTrialInfo(profile) {
  const createdAt = profile?.created_at || profile?.updated_at;
  if (!createdAt) return { daysLeft: TRIAL_DAYS, progress: 0, expired: false };

  const start = new Date(createdAt);
  const now = new Date();
  const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, TRIAL_DAYS - elapsed);

  return { daysLeft, expired: daysLeft === 0 };
}

function getCurrentPlanId(profile) {
  return profile?.subscription_plan || "free";
}

function getBillingCycle(profile) {
  return profile?.billing_cycle || "monthly";
}

export default function PricingPage() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [billing, setBilling] = useState(getBillingCycle(profile));
  const [upgrading, setUpgrading] = useState(null);
  const [successPlan, setSuccessPlan] = useState(null);

  const currentPlan = getCurrentPlanId(profile);
  const { daysLeft, expired } = getTrialInfo(profile);
  const currentPlans = plans[billing];

  const handleUpgrade = async (plan) => {
    if (upgrading) return;
    setUpgrading(plan.id);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          userId: user.id,
          table: "influencer_profiles",
          subscriptionPlan: plan.id,
          billingCycle: billing,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessPlan(plan.id);
        // Update profile in context by reloading
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        alert("Failed to update plan. Please try again.");
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setUpgrading(null);
    }
  };

  const isPlanActive = (planId) => {
    return currentPlan === planId;
  };

  const isPlanUpgrade = (planId) => {
    const order = ["free", "starter", "pro", "elite", "starter_annual", "pro_annual", "elite_annual"];
    return order.indexOf(planId) > order.indexOf(currentPlan);
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-10 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Choose Your Plan</h1>
            <p className="text-xs text-slate-500">Upgrade anytime to unlock more features</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 lg:px-10 py-6 lg:py-10 space-y-8">
        {/* Current Plan Status */}
        <Card className="p-5 lg:p-8 rounded-3xl border bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-2xl">
                <Crown size={24} className="text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {currentPlan === "free"
                      ? "Free Trial"
                      : currentPlan.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </h2>
                  <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px] font-bold">
                    CURRENT
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {currentPlan === "free"
                    ? expired
                      ? "Your free trial has expired"
                      : `${daysLeft} days remaining on your free trial`
                    : `Active ${billing} subscription`}
                </p>
              </div>
            </div>

            {currentPlan === "free" && !expired && (
              <div className="flex items-center gap-3 bg-amber-50 px-4 py-2.5 rounded-2xl">
                <Zap size={16} className="text-amber-600 fill-amber-600" />
                <span className="text-sm font-semibold text-amber-700">
                  {daysLeft} days left — upgrade to keep all features
                </span>
              </div>
            )}

            {currentPlan === "free" && expired && (
              <div className="flex items-center gap-3 bg-red-50 px-4 py-2.5 rounded-2xl">
                <Zap size={16} className="text-red-500" />
                <span className="text-sm font-semibold text-red-600">
                  Trial expired — upgrade now to continue
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Billing Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex items-center p-1 bg-white rounded-full border border-slate-200 shadow-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                billing === "monthly"
                  ? "text-white shadow-md"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              style={
                billing === "monthly"
                  ? { background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }
                  : {}
              }
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer relative ${
                billing === "annual"
                  ? "text-white shadow-md"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              style={
                billing === "annual"
                  ? { background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }
                  : {}
              }
            >
              Annual
              <span className="absolute -top-3 -right-6 bg-red-500 text-[9px] text-white px-2 py-0.5 rounded-full font-black">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {currentPlans.map((plan) => {
            const isActive = isPlanActive(plan.id);
            const isUpgrade = isPlanUpgrade(plan.id);
            const isSuccess = successPlan === plan.id;
            const isLoading = upgrading === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col p-6 lg:p-8 rounded-3xl transition-all duration-300 ${
                  plan.popular
                    ? "text-white shadow-xl lg:scale-[1.02] z-10 border-0"
                    : isActive
                    ? "bg-white border-2 border-purple-300 shadow-lg"
                    : "bg-white border border-slate-100 shadow-sm"
                }`}
                style={
                  plan.popular
                    ? { background: "linear-gradient(135deg, #6C4DFF 0%, #3F2B96 100%)" }
                    : {}
                }
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                {isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg">
                    Current Plan
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={plan.popular ? "text-white" : "text-purple-600"}>
                      {plan.icon}
                    </div>
                    <h3 className="text-2xl font-extrabold">{plan.name}</h3>
                  </div>
                  <p className={`text-xs ${plan.popular ? "text-indigo-200" : "text-slate-500"}`}>
                    {plan.tagline}
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-black tracking-tight">₹{plan.price}</span>
                  <span className={`text-sm font-bold ${plan.popular ? "text-indigo-200" : "text-slate-400"}`}>
                    {plan.period}
                  </span>
                </div>

                {plan.savings && (
                  <Badge className="bg-green-100 text-green-700 border-0 text-[10px] font-bold mb-4 w-fit">
                    {plan.savings}
                  </Badge>
                )}

                <p className={`text-[10px] font-bold tracking-wide uppercase mb-6 ${plan.popular ? "text-indigo-200" : "text-slate-400"}`}>
                  {plan.description}
                </p>

                {/* CTA Button */}
                <Button
                  onClick={() => !isActive && handleUpgrade(plan)}
                  disabled={isActive || isLoading}
                  className={`w-full h-12 rounded-2xl font-bold text-sm mb-6 transition-all cursor-pointer ${
                    isSuccess
                      ? "bg-green-500 text-white hover:bg-green-500"
                      : isActive
                      ? plan.popular
                        ? "bg-white/20 text-white/60 cursor-not-allowed"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : plan.popular
                      ? "bg-white text-purple-700 hover:bg-slate-50 shadow-lg"
                      : "text-white hover:opacity-90 shadow-md"
                  }`}
                  style={
                    !isActive && !plan.popular && !isSuccess
                      ? { background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }
                      : {}
                  }
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : isSuccess ? (
                    "Plan Activated!"
                  ) : isActive ? (
                    "Current Plan"
                  ) : isUpgrade ? (
                    "Upgrade Now"
                  ) : (
                    "Switch Plan"
                  )}
                </Button>

                {/* Features */}
                <div className={`space-y-3 flex-1 pt-4 border-t border-dashed ${plan.popular ? "border-white/20" : "border-slate-100"}`}>
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-white" : "text-purple-600"}`}
                      />
                      <span className="text-xs font-semibold leading-snug">{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded?.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5 opacity-30">
                      <X className="w-4 h-4 mt-0.5 shrink-0" />
                      <span className="text-xs font-semibold leading-snug">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <Card className="p-6 lg:p-8 rounded-3xl border bg-white">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Can I switch plans anytime?</p>
              <p className="text-xs text-slate-500 mt-1">
                Yes! You can upgrade or change your plan at any time. Your new plan takes effect immediately.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">What happens when my free trial ends?</p>
              <p className="text-xs text-slate-500 mt-1">
                You&apos;ll be moved to limited access. Upgrade to any plan to continue using all features.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Can I cancel my subscription?</p>
              <p className="text-xs text-slate-500 mt-1">
                Yes, you can cancel anytime. You&apos;ll continue to have access until the end of your billing period.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
