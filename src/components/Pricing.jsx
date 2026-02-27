"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
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

export default function Pricing() {
  const [billing, setBilling] = useState("monthly");

  return (
    <section className="py-24 bg-[#F8F7FF] px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-500 mb-10">
            Start free, upgrade when you're ready
          </p>

          {/* Billing Toggle */}
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
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-12">
          {plans.map((plan, idx) => (
            <PricingCard key={idx} plan={plan} billing={billing} />
          ))}
        </div>

        {/* Influencer CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[32px] p-10 md:p-14 text-center text-white shadow-xl bg-gradient-to-b from-[#6C4DFF] to-[#3F2B96]"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
            BRANDS — Always Free
          </h3>
          <p className="text-indigo-100 mb-8 max-w-2xl mx-auto text-sm md:text-base opacity-90">
            Joining RGossips as a brand is completely free. We never charge
            brands a commission.
          </p>
          <Button className="bg-white text-[#6C4DFF] hover:bg-slate-50 h-14 px-10 rounded-2xl font-bold text-lg cursor-pointer transition-transform hover:scale-105 active:scale-95">
            Join as a Brand — It's Free
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function PricingCard({ plan, billing }) {
  const isHighlighted = plan.highlighted;

  const displayPrice =
    billing === "annual" && plan.price !== "Custom"
      ? Math.floor(plan.price * 0.8)
      : plan.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative flex flex-col p-10 rounded-[32px] transition-all duration-300 ${
        isHighlighted
          ? "bg-gradient-to-b from-[#6C4DFF] to-[#3F2B96] text-white shadow-2xl z-10 lg:scale-105"
          : "bg-white text-slate-900 border border-slate-100 shadow-sm hover:shadow-md"
      }`}
    >
      {isHighlighted && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF4D4D] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
          Most Popular
        </span>
      )}

      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
        <p
          className={`text-sm leading-relaxed ${isHighlighted ? "text-indigo-100 opacity-90" : "text-slate-500"}`}
        >
          {plan.tagline}
        </p>
      </div>

      <div className="flex items-baseline gap-1 mb-8">
        <span className="text-5xl font-black tracking-tight">
          {plan.price === "Custom" ? "" : "₹"}
          {displayPrice}
        </span>
        <span
          className={`text-sm font-semibold ${isHighlighted ? "text-indigo-200" : "text-slate-500"}`}
        >
          {plan.period}
        </span>
      </div>

      <div className="space-y-4 mb-10 flex-1">
        {plan.features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <Check
              className={`w-5 h-5 mt-0.5 shrink-0 ${isHighlighted ? "text-white" : "text-[#6C4DFF]"}`}
            />
            <span className="text-sm font-medium leading-snug">{feature}</span>
          </div>
        ))}
      </div>

      <Button
        className={`w-full h-14 rounded-2xl font-bold text-lg cursor-pointer transition-all ${
          isHighlighted
            ? "bg-white text-[#3F2B96] hover:bg-slate-100"
            : "bg-[#6C4DFF] text-white hover:bg-[#5A3EE0] shadow-lg shadow-indigo-100"
        } active:scale-95`}
      >
        {plan.buttonText}
      </Button>
    </motion.div>
  );
}
