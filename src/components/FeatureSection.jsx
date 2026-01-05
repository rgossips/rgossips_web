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
} from "lucide-react";
import { useGlobal } from "@/context/GlobalContext";

const FeaturesSection = () => {
  const { type, setType } = useGlobal();
  const [activeTab, setActiveTab] = useState("brands");

  useEffect(() => {
    setActiveTab(type);
  }, [type]);

  const brandFeatures = [
    {
      title: "Reach Your Target Audience",
      desc: "Connect with influencers whose followers match your ideal customer profile perfectly.",
      icon: <Target className="w-5 h-5" />,
      color: "bg-linear-to-r from-[#155DFC] to-[#9810FA]",
    },
    {
      title: "Measure Real ROI",
      desc: "Track every dollar spent with comprehensive analytics and performance metrics.",
      icon: <BarChart3 className="w-5 h-5" />,
      color: "bg-linear-to-r from-[#155DFC] to-[#9810FA]",
    },
    {
      title: "Scale Your Campaigns",
      desc: "Manage multiple influencers and campaigns simultaneously from one central dashboard.",
      icon: <Layers className="w-5 h-5" />,
      color: "bg-linear-to-r from-[#155DFC] to-[#9810FA]",
    },
    {
      title: "Fast Execution",
      desc: "Launch campaigns in minutes with our streamlined workflow and automated processes.",
      icon: <Zap className="w-5 h-5" />,
      color: "bg-linear-to-r from-[#155DFC] to-[#9810FA]",
    },
  ];

  const influencerFeatures = [
    {
      title: "Get Paid What You Deserve",
      desc: "Transparent pricing and secure payments. Set your rates and get paid on time, every time.",
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-linear-to-r from-[#9810FA] to-[#FA1085]",
    },
    {
      title: "Work With Top Brands",
      desc: "Access exclusive brand partnerships that align with your content and values.",
      icon: <Briefcase className="w-5 h-5" />,
      color: "bg-linear-to-r from-[#9810FA] to-[#FA1085]",
    },
    {
      title: "Grow Your Influence",
      desc: "Gain insights into your performance and discover opportunities to expand your reach.",
      icon: <LineChart className="w-5 h-5" />,
      color: "bg-linear-to-r from-[#9810FA] to-[#FA1085]",
    },
    {
      title: "Build Your Portfolio",
      desc: "Showcase your best work and build credibility with verified campaign results.",
      icon: <Award className="w-5 h-5" />,
      color: "bg-linear-to-r from-[#9810FA] to-[#FA1085]",
    },
  ];

  return (
    <section
      className="w-full py-24 bg-white overflow-hidden"
      id="brands-influencers-section"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Toggle Switch */}
        <div className="flex justify-center mb-20">
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
                className={`relative aspect-square w-full max-w-[500px] mx-auto rounded-[3rem] bg-linear-to-b from-[#EFF6FF] to-[#FAF5FF] border border-white shadow-2xl flex items-center justify-center`}
              >
                {/* Abstract Content */}
                <div className="w-[80%] h-[80%] bg-linear-to-b from-[#EFF6FF] to-[#FAF5FF] backdrop-blur-md rounded-[2rem] flex items-center justify-center"></div>

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

              <div className="flex gap-4 pt-6">
                <Button
                  className={`cursor-pointer h-14 px-10 rounded-2xl text-lg font-bold shadow-xl transition-all hover:opacity-90 ${
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
