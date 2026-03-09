"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  BarChart3,
  Zap,
  Layers,
  DollarSign,
  Briefcase,
  LineChart,
  Award,
  Search,
  MessageCircle,
  BarChart,
  CreditCard,
} from "lucide-react";
import { useGlobal } from "@/context/GlobalContext";
import brandHero from "@/assets/brandHero.png";
import influencerHero from "@/assets/influencerHero.png";
import Image from "next/image";
import { useRouter } from "next/navigation";

const FeaturesSection = () => {
  const { type, setType } = useGlobal();
  const [activeTab, setActiveTab] = useState("brands");
  const router = useRouter();

  useEffect(() => {
    setActiveTab(type);
  }, [type]);

  const brandFeatures = [
    {
      icon: <Search />,
      title: "Discover Verified Creators Instantly",
      desc: "Search 200,000+ influencers by niche, platform, engagement rate, and more.",
      color: "bg-linear-to-r from-[#155DFC] to-[#9810FA]",
    },
    {
      icon: <Zap />,
      title: "Launch Campaigns in 5 Steps",
      desc: "Set your brief, budget, and timeline. Go live in under 10 minutes.",
      color: "bg-linear-to-r from-[#155DFC] to-[#9810FA]",
    },
    {
      icon: <MessageCircle />,
      title: "Negotiate & Contract Directly",
      desc: "Chat, negotiate rates, and sign digital contracts all in one place.",
      color: "bg-linear-to-r from-[#155DFC] to-[#9810FA]",
    },
    {
      icon: <BarChart />,
      title: "Track Every Post in Real Time",
      desc: "Live dashboards for views, engagement, clicks, and conversions.",
      color: "bg-linear-to-r from-[#155DFC] to-[#9810FA]",
    },
    {
      icon: <CreditCard />,
      title: "Pay Creators Seamlessly",
      desc: "Escrow-protected payments. 50+ countries supported.",
      color: "bg-linear-to-r from-[#155DFC] to-[#9810FA]",
    },
  ];

  const influencerFeatures = [
    {
      icon: <Search />,
      title: "Get Discovered by Top Brands",
      desc: "Showcase your portfolio to global brands looking for your specific style.",
      color: "bg-linear-to-r from-[#9810FA] to-[#FA1085]",
    },
    {
      icon: <Zap />,
      title: "Apply to Premium Campaigns",
      desc: "Browse high-paying opportunities and apply with one click.",
      color: "bg-linear-to-r from-[#9810FA] to-[#FA1085]",
    },
  ];

  const content = {
    brands: [
      {
        icon: <Search />,
        title: "Discover Verified Creators Instantly",
        desc: "Search 200,000+ influencers by niche, platform, engagement rate, and more.",
      },
      {
        icon: <Zap />,
        title: "Launch Campaigns in 5 Steps",
        desc: "Set your brief, budget, and timeline. Go live in under 10 minutes.",
      },
      {
        icon: <MessageCircle />,
        title: "Negotiate & Contract Directly",
        desc: "Chat, negotiate rates, and sign digital contracts all in one place.",
      },
      {
        icon: <BarChart />,
        title: "Track Every Post in Real Time",
        desc: "Live dashboards for views, engagement, clicks, and conversions.",
      },
      {
        icon: <CreditCard />,
        title: "Pay Creators Seamlessly",
        desc: "Escrow-protected payments. 50+ countries supported.",
      },
    ],
    influencers: [
      {
        icon: <Search />,
        title: "Get Discovered by Top Brands",
        desc: "Showcase your portfolio to global brands looking for your specific style.",
      },
      {
        icon: <Zap />,
        title: "Apply to Premium Campaigns",
        desc: "Browse high-paying opportunities and apply with one click.",
      },
      // ... add more for influencers as needed
    ],
  };

  return (
    <section
      className="w-full pb-20 bg-white overflow-hidden"
      id="brands-influencers-section"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Toggle Switch */}
        <div className="flex justify-center mb-10">
          <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex items-center shadow-sm">
            <button
              onClick={() => {
                setActiveTab("brands");
                setType("brands");
              }}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "brands"
                  ? "bg-linear-to-r from-[#155DFC] to-[#9810FA] text-white shadow-md"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              For Brands
            </button>
            <button
              onClick={() => {
                setType("influencers");
                setActiveTab("influencers");
              }}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "influencers"
                  ? "bg-linear-to-r from-[#9810FA] to-[#FA1085] text-white shadow-md"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              For Influencers
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === "brands" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === "brands" ? 20 : -20 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          >
            {/* Visual Column */}
            <div
              className={`relative ${
                activeTab === "influencers" ? "lg:order-last" : ""
              }`}
            >
              <div
                className={`relative aspect-square w-full max-w-[500px] mx-auto rounded-[3rem] flex items-center justify-center`}
              >
                <AnimatePresence mode="wait">
                  <div className="relative aspect-square w-full max-w-[500px] mx-auto rounded-[3rem] overflow-hidden">
                    {/* Brand Image */}
                    <motion.div
                      animate={{ opacity: activeTab === "brands" ? 1 : 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={brandHero}
                        alt="Brand Hero"
                        fill
                        priority
                        className="object-cover rounded-[3rem]"
                      />
                    </motion.div>

                    {/* Influencer Image */}
                    <motion.div
                      animate={{ opacity: activeTab === "influencers" ? 1 : 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={influencerHero}
                        alt="Influencer Hero"
                        fill
                        priority
                        className="object-cover rounded-[3rem]"
                      />
                    </motion.div>
                  </div>
                </AnimatePresence>
                {/* Floating Stats Card */}
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute bottom-10 right-[-20px] bg-white p-5 rounded-2xl shadow-2xl border border-slate-50 flex items-center gap-4"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${
                      activeTab === "brands" ? "bg-emerald-500" : "bg-pink-500"
                    }`}
                  >
                    {activeTab === "brands" ? <Zap /> : <DollarSign />}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">
                      {activeTab === "brands" ? "+325%" : "$12K"}
                    </p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {activeTab === "brands" ? "Avg. ROI" : "Avg. Monthly"}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Text Column */}
            <div className="space-y-8">
              <Badge
                className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
                  activeTab === "brands"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-pink-50 text-pink-600"
                }`}
              >
                {activeTab === "brands" ? "For Brands" : "For Influencers"}
              </Badge>

              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                {activeTab === "brands" ? (
                  <>
                    Grow Your Brand with <br />{" "}
                    <span className="bg-gradient-to-r from-[#155DFC] to-[#9810FA] bg-clip-text text-transparent">
                      Authentic Influence
                    </span>
                  </>
                ) : (
                  <>
                    Turn Your Influence into <br />{" "}
                    <span className="bg-gradient-to-r from-[#9810FA] to-[#FA1085] bg-clip-text text-transparent">
                      Sustainable Income
                    </span>
                  </>
                )}
              </h2>

              <p className="text-slate-500 text-lg font-medium leading-relaxed">
                {activeTab === "brands"
                  ? "Partner with creators who truly resonate with your audience. Drive awareness, engagement, and conversions at scale."
                  : "Connect with brands that value your creativity. Build meaningful partnerships and monetize your content effectively."}
              </p>

              <div className="space-y-6 pt-4">
                {(activeTab === "brands"
                  ? brandFeatures
                  : influencerFeatures
                ).map((f, i) => (
                  <div key={i} className="flex gap-5 group">
                    <div
                      className={`shrink-0 w-12 h-12 rounded-xl ${f.color} text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}
                    >
                      {f.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">
                        {f.title}
                      </h4>
                      <p className="text-slate-500 leading-relaxed text-[15px]">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-6 items-center justify-center">
                <Button
                  onClick={() => {
                    router.push("/login");
                  }}
                  className={`cursor-pointer h-14 px-6 rounded-2xl text-lg font-bold shadow-xl transition-all hover:opacity-90 ${
                    activeTab === "brands"
                      ? "bg-gradient-to-r from-[#155DFC] to-[#9810FA]"
                      : "bg-gradient-to-r from-[#9810FA] to-[#FA1085]"
                  }`}
                >
                  Get Started Free
                </Button>
                {activeTab === "influencers" && (
                  <Button
                    variant="outline"
                    className="cursor-pointer h-14 px-10 rounded-2xl text-lg font-bold border-slate-200"
                  >
                    Learn More
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default FeaturesSection;
