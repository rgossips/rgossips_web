"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Rocket, Users, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGlobal } from "@/context/GlobalContext";

const brandSteps = [
  {
    key: "brand.createProfile",
    icon: <UserPlus className="w-6 h-6 text-indigo-600" />,
    side: "left",
  },
  {
    key: "brand.launchCampaign",
    icon: <Rocket className="w-6 h-6 text-indigo-600" />,
    side: "right",
  },
  {
    key: "brand.getMatched",
    icon: <Users className="w-6 h-6 text-indigo-600" />,
    side: "left",
  },
  {
    key: "brand.trackApprove",
    icon: <CheckCircle2 className="w-6 h-6 text-indigo-600" />,
    side: "right",
  },
];

const influencerSteps = [
  {
    key: "influencer.joinNetwork",
    icon: <UserPlus className="w-6 h-6 text-indigo-600" />,
    side: "left",
  },
  {
    key: "influencer.browseCampaigns",
    icon: <Rocket className="w-6 h-6 text-indigo-600" />,
    side: "right",
  },
  {
    key: "influencer.submitProposals",
    icon: <Users className="w-6 h-6 text-indigo-600" />,
    side: "left",
  },
  {
    key: "influencer.createEarn",
    icon: <CheckCircle2 className="w-6 h-6 text-indigo-600" />,
    side: "right",
  },
];

export default function HowItWorks() {
  const t = useTranslations("HowItWorks");
  const { type } = useGlobal();
  const [activeTab, setActiveTab] = useState("brands");

  // FeatureSection writes "brands" / "influencers" into the global context
  // when the user clicks Learn More from either tab. Mirror it here so the
  // timeline opens on the right side after the scroll.
  useEffect(() => {
    if (type === "brands" || type === "influencers") {
      setActiveTab(type);
    }
  }, [type]);

  const currentSteps = activeTab === "brands" ? brandSteps : influencerSteps;

  return (
    <section className="py-14 px-6 bg-[#F8F7FF]" id="works">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-2">
          {t("header.title")}
        </h2>
        <p className="text-slate-500 mb-6">{t("header.subtitle")}</p>

        {/* Toggle Switch */}
        <div className="inline-flex p-1 bg-slate-100 rounded-full mb-8">
          <button
            onClick={() => setActiveTab("brands")}
            className={`px-8 py-2 rounded-full cursor-pointer text-sm font-semibold transition-all ${
              activeTab === "brands"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            {t("tabs.brands")}
          </button>
          <button
            onClick={() => setActiveTab("influencers")}
            className={`px-8 py-2 rounded-full cursor-pointer text-sm font-semibold transition-all ${
              activeTab === "influencers"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            {t("tabs.influencers")}
          </button>
        </div>

        {/* Compact steps — a 4-across grid on desktop instead of the old
            alternating zigzag timeline, which spent half its height on
            empty half-columns. Mobile stays stacked but slimmer. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            {currentSteps.map((step, index) => (
              <StepCard key={index} step={step} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function StepCard({ step, index }) {
  const t = useTranslations("HowItWorks");
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#155DFC] text-white flex items-center justify-center text-sm font-bold shadow-md shrink-0">
          {index + 1}
        </div>
        <div className="p-2 bg-indigo-50 rounded-xl shrink-0">{step.icon}</div>
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1.5">
        {t(`${step.key}.title`)}
      </h3>
      <p className="text-slate-500 text-sm leading-relaxed">
        {t(`${step.key}.description`)}
      </p>
    </motion.div>
  );
}
