"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Rocket, Users, CheckCircle2 } from "lucide-react";

const brandSteps = [
  {
    title: "Create Brand Profile",
    description:
      "Sign up in minutes and create your brand profile with your campaign goals.",
    icon: <UserPlus className="w-6 h-6 text-indigo-600" />,
    side: "left",
  },
  {
    title: "Launch Campaign",
    description:
      "Set your brief, budget, deliverables, and timeline. Go live instantly.",
    icon: <Rocket className="w-6 h-6 text-indigo-600" />,
    side: "right",
  },
  {
    title: "Get Matched & Negotiate",
    description:
      "AI matches you with verified creators. Chat, negotiate, and finalize deals.",
    icon: <Users className="w-6 h-6 text-indigo-600" />,
    side: "left",
  },
  {
    title: "Track, Approve & Pay",
    description:
      "Monitor campaign performance in real-time. Approve content and release payments.",
    icon: <CheckCircle2 className="w-6 h-6 text-indigo-600" />,
    side: "right",
  },
];

const influencerSteps = [
  {
    title: "Join the Network",
    description:
      "Complete your profile and connect your social accounts for verification.",
    icon: <UserPlus className="w-6 h-6 text-indigo-600" />,
    side: "left",
  },
  {
    title: "Browse Campaigns",
    description:
      "Explore available briefs from top brands that match your niche.",
    icon: <Rocket className="w-6 h-6 text-indigo-600" />,
    side: "right",
  },
  {
    title: "Submit Proposals",
    description: "Apply to campaigns with your creative ideas and pricing.",
    icon: <Users className="w-6 h-6 text-indigo-600" />,
    side: "left",
  },
  {
    title: "Create & Earn",
    description:
      "Post your content, get brand approval, and receive direct payments.",
    icon: <CheckCircle2 className="w-6 h-6 text-indigo-600" />,
    side: "right",
  },
];

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState("brands");
  const currentSteps = activeTab === "brands" ? brandSteps : influencerSteps;

  return (
    <section className="py-20 px-6 bg-[#F8F7FF]" id="works">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
          How It Works
        </h2>
        <p className="text-slate-500 mb-10">Get started in minutes, not days</p>

        {/* Toggle Switch */}
        <div className="inline-flex p-1 bg-slate-100 rounded-full mb-16">
          <button
            onClick={() => setActiveTab("brands")}
            className={`px-8 py-2 rounded-full cursor-pointer text-sm font-semibold transition-all ${
              activeTab === "brands"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            For Brands
          </button>
          <button
            onClick={() => setActiveTab("influencers")}
            className={`px-8 py-2 rounded-full cursor-pointer text-sm font-semibold transition-all ${
              activeTab === "influencers"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            For Influencers
          </button>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Central Vertical Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-slate-200 -translate-x-1/2 hidden md:block" />

          <div className="space-y-12 md:space-y-0 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {currentSteps.map((step, index) => (
                  <TimelineItem key={index} step={step} index={index} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineItem({ step, index }) {
  const isLeft = step.side === "left";

  return (
    <>
      {/* ================= MOBILE (30% / 70%) ================= */}
      <div
        className={`flex md:hidden w-full mb-6 ${index % 2 == 0 ? "flex-row" : "flex-row-reverse"}`}
      >
        {/* 30% Blue Number Rectangle */}
        <div
          className={`w-[30%] bg-indigo-600 text-white flex items-center justify-center ${index % 2 == 0 ? "rounded-l-2xl" : "rounded-r-2xl"}`}
        >
          <span className="text-[3rem] font-bold">{index + 1}</span>
        </div>

        {/* 70% Text Box */}
        <div className="w-[70%] bg-white p-6 rounded-r-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-xl">{step.icon}</div>
            <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
          </div>
          <p className="text-slate-500 text-sm">{step.description}</p>
        </div>
      </div>

      {/* ================= DESKTOP (UNCHANGED TIMELINE) ================= */}
      <div className="hidden md:flex flex-col md:flex-row items-center justify-center w-full mb-12">
        {/* LEFT SIDE */}
        <div className="md:w-1/2 flex justify-end">
          {isLeft ? (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="w-[90%] bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-right mr-8"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {step.title}
              </h3>
              <p className="text-slate-500">{step.description}</p>
            </motion.div>
          ) : (
            <div className="w-full" />
          )}
        </div>

        {/* CENTER NUMBER */}
        <div className="relative z-10">
          <div className="w-10 h-10 rounded-full bg-[#155DFC] text-white flex items-center justify-center font-bold shadow-lg">
            {index + 1}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="md:w-1/2 flex justify-start">
          {!isLeft ? (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="w-[90%] bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-left ml-8"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {step.title}
              </h3>
              <p className="text-slate-500">{step.description}</p>
            </motion.div>
          ) : (
            <div className="w-full" />
          )}
        </div>
      </div>
    </>
  );
}
