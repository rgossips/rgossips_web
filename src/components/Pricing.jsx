"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Target, Zap, Rocket, X, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

// 1. Brand Data Structure
const brandPlans = [
  {
    name: "Starter",
    tagline: "Perfect for testing the waters",
    price: "0",
    period: "Free Forever",
    features: [
      "Up to 3 active campaigns",
      "Access to 50K+ verified influencers",
      "Basic campaign analytics",
      "Standard support",
      "Escrow payment protection",
      "Digital contracts",
    ],
    buttonText: "Start Free",
    highlighted: false,
  },
  {
    name: "Growth",
    tagline: "For brands scaling their influence",
    price: "4999",
    period: "/month",
    features: [
      "Unlimited campaigns",
      "AI-powered creator matching",
      "Advanced analytics & reporting",
      "Priority support",
      "Dedicated account manager",
      "Custom contract templates",
      "Multi-platform tracking",
      "Team collaboration tools",
    ],
    buttonText: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    tagline: "For agencies & large brands",
    price: "Custom",
    period: "",
    features: [
      "Everything in Growth, plus:",
      "White-label solution",
      "API access",
      "Custom integrations",
      "Advanced fraud detection",
      "Dedicated success team",
      "Custom SLA",
      "Quarterly business reviews",
    ],
    buttonText: "Contact Sales",
    highlighted: false,
  },
];

// 2. Influencer Data Structure
const influencerPlans = {
  monthly: [
    {
      name: "Starter",
      icon: <Target className="w-5 h-5" />,
      tagline: "Your launchpad into the world of brand collaborations",
      price: "99",
      period: "/mo",
      description:
        "Best for: Nano & micro influencers (1K – 25K followers) starting their brand collab journey",
      features: [
        "Listed in brand search",
        "Up to 3 campaign applications/month",
        "Brand DMs 10/month",
        "1 media kit template (PDF)",
        "Basic analytics dashboard",
        "Creator community & forums",
        "Standard payouts 7-10 days",
        "Verified badge eligibility",
        "AI caption & hook generator 3 per month",
        "Brief templates library",
      ],
      notIncluded: [
        "Priority brand search placement",
        "Unlimited applications",
        "AI content suite",
        "Audience insights & demographics",
        "Fake follower & engagement audit",
        "Rate benchmarking tool",
        "Dedicated support manager",
      ],
      buttonText: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      icon: <Zap className="w-5 h-5" />,
      tagline: "Built for creators who are ready to earn seriously",
      price: "299",
      period: "/mo",
      description:
        "Best for: Micro to mid-tier influencers (10K – 200K followers) scaling brand deals",
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
        "Monthly trend & viral insights",
      ],
      notIncluded: [
        "Dedicated account manager",
        "Homepage spotlight feature",
        "Custom media kit builder",
        "Analytics export (Excel / PDF)",
      ],
      buttonText: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Elite",
      icon: <Rocket className="w-5 h-5" />,
      tagline: "The professional-grade creator OS for full-time influencers",
      price: "699",
      period: "/mo",
      description:
        "Best for: Macro & mega influencers (200K+ followers) & full-time content creators",
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
        "Creator Academy + live Q&A",
      ],
      notIncluded: [],
      buttonText: "Go Elite",
      highlighted: false,
    },
  ],
  annual: [
    {
      name: "Starter — Annual",
      icon: <Target className="w-5 h-5" />,
      tagline: "12 months for the price of 9",
      price: "899",
      period: "/yr",
      savings: "Save ₹289",
      description: "Works out to just ₹75/month · 32% off",
      features: [
        "All Starter Monthly features, plus:",
        "3 months FREE (pay for 9)",
        "2× AI content generation 4/mo (vs 2 monthly)",
        "2 media kit templates",
        "Annual performance report emailed at year-end",
        "Priority access to events & webinars",
        "Price locked for 12 months",
      ],
      notIncluded: [
        "Priority brand search",
        "AI content suite (unlimited)",
        "Audience insights",
        "Dedicated support manager",
      ],
      buttonText: "Save ₹899 — Get the Annual Plan",
      highlighted: false,
    },
    {
      name: "Pro — Annual",
      icon: <Zap className="w-5 h-5" />,
      tagline: "Scale your brand deals all year long",
      price: "2,899",
      period: "/yr",
      savings: "Save ₹689",
      description: "Works out to just ₹241/month · 24% off",
      features: [
        "All Pro Monthly features, plus:",
        "~2 months FREE (pay for 10)",
        "2× AI content suite 100/mo (vs 50 monthly)",
        "Quarterly audience audit 4×/year",
        "2 brand newsletter features/yr",
        "Exclusive annual-only campaigns",
        "Annual income summary download tax-ready",
        "Priority support 12hr SLA",
        "Quarterly rate benchmarking",
        "Price locked in — zero increases for 12 months",
      ],
      notIncluded: [
        "Dedicated account manager",
        "Custom analytics export",
        "Homepage spotlight",
      ],
      buttonText: "Save ₹2,389 — Get the Annual Plan",
      highlighted: true,
    },
    {
      name: "Elite — Annual",
      icon: <Rocket className="w-5 h-5" />,
      tagline: "The all-in-one professional creator OS — for a full year",
      price: "6,899",
      period: "/yr",
      savings: "Save ₹1,489",
      description: "Works out to just ₹575/month · 22% off",
      features: [
        "All Elite Monthly features, plus:",
        "~2 months FREE on annual billing",
        "Dedicated account manager - 8hr SLA",
        "Quarterly strategy call 4 sessions/yr",
        "4 homepage spotlights/yr (vs 1/mo on monthly)",
        "Annual report - stats, income & growth",
        "RGossips Creator Summit invite invite-only, in-person",
        "CA-friendly custom invoices",
        "First access to all new features",
        "Price locked in - zero increases for 12 months",
      ],
      notIncluded: [],
      buttonText: "Go Elite Annual — Best Value",
      highlighted: false,
    },
  ],
};

// Helper function to highlight specific text patterns
const highlightText = (text, isHighlighted) => {
  // Pattern matches: Numbers followed by /month, /mo, /yr, or 'x' followed by words
  const regex = /(\d+\/\w+|\d+×\s\w+|Unlimited|FREE|Best Value)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.match(regex)) {
      return (
        <span
          key={i}
          className="text-xs font-semibold bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #9810fa 0%, #e60076 100%)",
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

export default function Pricing() {
  const [userType, setUserType] = useState("influencer");
  const [billing, setBilling] = useState("monthly");

  const currentPlans =
    userType === "brand" ? brandPlans : influencerPlans[billing];

  return (
    <section className="py-20 bg-[#F8F7FF] px-6" id="pricing">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-500 text-lg mb-8">
            Start free, upgrade when you're ready
          </p>

          {/* Social Proof Badges */}
          <div className="flex flex-wrap justify-center items-center gap-6 mb-10">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-slate-100 shadow-sm text-sm font-bold text-slate-700">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Trusted by 12,000+ creators</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-slate-100 shadow-sm text-sm font-bold text-slate-700">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Used by 200+ brands</span>
            </div>
          </div>

          <br />

          {userType === "influencer" && (
            <div className="inline-flex items-center p-1 bg-white rounded-full border border-slate-200 shadow-sm">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  billing === "monthly"
                    ? "bg-[#6C4DFF] text-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all cursor-pointer relative ${
                  billing === "annual"
                    ? "bg-[#6C4DFF] text-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Annual
                <span className="absolute -top-3 -right-6 bg-[#FF4D4D] text-[10px] text-white px-2 py-0.5 rounded-full font-black">
                  Save 20%
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-12">
          <AnimatePresence mode="wait">
            {currentPlans.map((plan, idx) => (
              <PricingCard key={plan.name} plan={plan} userType={userType} />
            ))}
          </AnimatePresence>
        </div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[32px] p-10 md:p-14 text-center text-white shadow-xl bg-gradient-to-b from-[#6C4DFF] to-[#3F2B96]"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
            {userType === "brand"
              ? "INFLUENCERS — Earn More"
              : "BRANDS — Always Free"}
          </h3>
          <p className="text-indigo-100 mb-8 max-w-2xl mx-auto text-sm md:text-base opacity-90">
            {userType === "brand"
              ? "Join RGossips as a creator to find brands, use AI tools, and get paid faster."
              : "Joining RGossips as a brand is completely free. We never charge brands a commission."}
          </p>
          <Button className="bg-white text-[#6C4DFF] hover:bg-slate-50 h-14 px-10 rounded-2xl font-bold text-lg cursor-pointer transition-transform hover:scale-105 active:scale-95">
            {userType === "brand"
              ? "Join as an Influencer"
              : "Join as a Brand — It's Free"}
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function PricingCard({ plan, isInfluencer }) {
  const isHighlighted = plan.highlighted;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative flex flex-col p-10 rounded-[45px] transition-all duration-300 ${
        isHighlighted
          ? "bg-gradient-to-b from-[#6C4DFF] to-[#3F2B96] text-white shadow-[0_30px_60px_-15px_rgba(108,77,255,0.4)] md:scale-105 z-10 min-h-[720px]"
          : "bg-white text-slate-900 border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[680px]"
      }`}
    >
      {isHighlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF1EAD] text-white text-[10px] font-black uppercase tracking-[0.15em] px-6 py-2 rounded-full shadow-lg">
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          {plan.icon && (
            <div className={isHighlighted ? "text-white" : "text-[#6C4DFF]"}>
              {plan.icon}
            </div>
          )}
          <h3 className="text-3xl font-extrabold tracking-tight">
            {plan.name}
          </h3>
        </div>

        <p
          className={`text-[10px] font-black tracking-widest mb-8 uppercase leading-relaxed ${isHighlighted ? "text-indigo-200" : "text-slate-400"}`}
        >
          {plan.description}
        </p>

        <div className="flex items-baseline gap-1 mb-8">
          <span className="text-6xl font-black tracking-tighter">
            {plan.price !== "Custom" && plan.price !== "0" && "₹"}
            {plan.price}
          </span>
          <span
            className={`text-sm font-bold ${isHighlighted ? "text-indigo-200" : "text-slate-500"}`}
          >
            {plan.period}
          </span>
        </div>

        <Button
          className={`w-full h-14 rounded-2xl font-bold text-base mb-6 transition-transform active:scale-95 hover:scale-105 cursor-pointer flex items-center justify-center flex-wrap ${
            isHighlighted
              ? "bg-white text-[#6C4DFF] hover:bg-slate-50 shadow-lg"
              : "bg-gradient-to-b from-[#6C4DFF] to-[#3F2B96] text-white hover:bg-[#5A3EE0] shadow-md shadow-indigo-100"
          }`}
        >
          {plan.buttonText}
        </Button>

        <p
          className={`text-center text-[10px] font-bold ${isHighlighted ? "text-indigo-200" : "text-slate-400"}`}
        >
          NO CREDIT CARD REQUIRED
        </p>
      </div>

      <div className="space-y-4 flex-1 pt-4 border-t border-dashed border-opacity-20 border-current">
        {plan.features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <Check
              className={`w-4 h-4 mt-0.5 shrink-0 ${isHighlighted ? "text-white" : "text-[#6C4DFF]"}`}
            />
            <span className="text-xs font-bold leading-snug">
              {highlightText(feature, isHighlighted)}
            </span>
          </div>
        ))}
        {plan.notIncluded &&
          plan.notIncluded.map((feature, i) => (
            <div key={i} className="flex items-start gap-3 opacity-30">
              <X className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-xs font-bold leading-snug">{feature}</span>
            </div>
          ))}
      </div>
    </motion.div>
  );
}
