"use client";
import React, { useState } from "react";
import { CampaignCard } from "@/components/CampaignCard";
import { FaInstagram, FaLinkedin, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Star, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";
import ApplyCampaignNotLoggedIn from "@/components/ApplyCampaignNotLoggedIn";

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState("Active");
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const filteredCampaigns = CAMPAIGNS_DATA.filter(
    (campaign) => campaign.status === activeTab,
  );

  return (
    <div className="min-h-screen bg-[#F8F9FD] font-sans antialiased pb-20">
      {selectedCampaign && (
        <ApplyCampaignNotLoggedIn
          campaignTitle={selectedCampaign.title}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
      <section className="relative w-full min-h-[90vh] flex items-center justify-center py-20 overflow-hidden bg-[#fcfdff]">
        {/* Background Decorative Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left Content */}
          <div className="space-y-8">
            <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 w-fit">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
              Trusted by 10,000+ brands & influencers
            </Badge>

            <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Where Brands Meet <br />
              <span className="bg-gradient-to-r from-[#155DFC] to-[#9810FA] bg-clip-text text-transparent">
                Brand-Ready Creators
              </span>
            </h1>

            <p className="text-slate-500 text-lg md:text-xl max-w-lg leading-relaxed font-medium">
              The all-in-one platform that simplifies influencer marketing.
              Launch campaigns, track performance, and drive real results.
            </p>

            {/* <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => {
                  setType("brands");
                  router.push("/login");
                }}
                className="cursor-pointer h-14 px-8 bg-gradient-to-r from-[#155DFC] to-[#9810FA] text-white rounded-2xl text-lg font-bold shadow-lg shadow-blue-200 group"
              >
                <Building2 className="mr-2 h-5 w-5" />
                I&apos;m a Brand
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                onClick={() => {
                  setType("influencers");
                  router.push("/login");
                }}
                variant="outline"
                className="cursor-pointer h-14 px-8 border-slate-200 text-slate-600 rounded-2xl text-lg font-bold hover:bg-slate-50 group"
              >
                <Users className="mr-2 h-5 w-5" />
                I&apos;m an Influencer
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div> */}

            {/* Social Proof */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-full border-4 border-white bg-gradient-to-br ${
                      i % 2 === 0
                        ? "from-blue-400 to-blue-600"
                        : "from-purple-400 to-purple-600"
                    }`}
                  />
                ))}
                <div className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                  +5K
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm font-bold text-slate-700">
                  4.9/5{" "}
                  <span className="text-slate-400 font-medium">
                    from 2,000+ reviews
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Content - Interactive Visual */}
          <div className="relative flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative w-full max-w-[500px] aspect-square rounded-[3rem] bg-linear-to-b from-[#EFF6FF] to-[#FAF5FF] shadow-2xl overflow-visible border border-white"
            >
              {/* Main Content*/}
              <div className="absolute inset-4 rounded-[2.5rem] bg-linear-to-b from-[#EFF6FF] to-[#FAF5FF] backdrop-blur-sm border border-white/50 flex items-center justify-center"></div>

              {/* Floating Stat Card 1 */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: "easeInOut",
                }}
                className="absolute -left-5 lg:-left-10 top-20 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-4 z-20"
              >
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">+245%</p>
                  <p className="text-xs text-slate-400 font-medium">
                    ROI Increase
                  </p>
                </div>
              </motion.div>

              {/* Floating Stat Card 2 */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 5,
                  ease: "easeInOut",
                }}
                className="absolute -right-3 lg:-right-6 bottom-24 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-4 z-20"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">50K+</p>
                  <p className="text-xs text-slate-400 font-medium">
                    Active Users
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 lg:pt-12 space-y-10">
        {/* --- COMPACT HEADER & FILTERS --- */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 pb-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Collaboration Hub
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              Showing {activeTab.toLowerCase()} projects and earnings.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Stats Pills - Very compact to save space */}
            <div className="flex gap-2">
              {[
                {
                  label: "Active",
                  count: 2,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Completed",
                  count: 1,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`${s.bg} ${s.color} px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider`}
                >
                  {s.count} {s.label}
                </div>
              ))}
            </div>

            {/* Toggle Switch */}
            <div className="bg-white p-1 rounded-xl flex shadow-sm border border-slate-200 w-full sm:w-64">
              {["Active", "Completed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab
                      ? "bg-[#E60076] text-white shadow-md"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- CAMPAIGNS GRID (3 COLUMNS) --- */}
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onApply={() => setSelectedCampaign(campaign)}
            />
          ))}

          {filteredCampaigns.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">
                No {activeTab.toLowerCase()} campaigns found.
              </p>
            </div>
          )}
        </main>

        {/* --- CONTACT & SUPPORT BAR --- */}
        <section className="mt-20">
          <div className="bg-slate-900 rounded-[32px] p-8 lg:p-12 text-white overflow-hidden relative">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#E60076]/20 to-transparent rounded-full -mr-20 -mt-20 blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left space-y-2">
                <h3 className="text-xl lg:text-2xl font-bold">
                  Need help with a campaign?
                </h3>
                <p className="text-slate-400 text-sm max-w-md">
                  Our dedicated support team is available 24/7 to help you
                  manage your brand relations and payments.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
                {[
                  {
                    icon: <FaInstagram size={20} />,
                    label: "Instagram",
                    color: "hover:text-pink-600 hover:bg-pink-50",
                    link: "https://www.instagram.com/rgossips_/",
                  },
                  {
                    icon: <FaWhatsapp size={20} />,
                    label: "WhatsApp",
                    color: "hover:text-emerald-600 hover:bg-emerald-50",
                    link: "https://whatsapp.com/channel/0029VbBjpbKLo4hdMsZKc146",
                  },
                  {
                    icon: <FaYoutube size={20} />,
                    label: "YouTube",
                    color: "hover:text-red-600 hover:bg-red-50",
                    link: "#",
                  },
                  {
                    icon: <FaLinkedin size={20} />,
                    label: "LinkedIn",
                    color: "hover:text-blue-600 hover:bg-blue-50",
                    link: "#",
                  },
                ].map((item, idx) => (
                  <a
                    key={idx}
                    href={item.link}
                    className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group ${item.color}`}
                  >
                    <div className="text-[#E60076] group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <span className="text-xs font-bold tracking-wide uppercase">
                      {item.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const CAMPAIGNS_DATA = [
  {
    id: 1,
    initials: "SB",
    title: "Summer Collection",
    brandName: "StyleBrand Co.",
    status: "Active",
    tags: ["Fashion", "Lifestyle"],
    budget: "₹25,000",
    deadline: "Jan 30",
    daysLeft: "10d",
    deliverables: "2 Reels",
    location: "Mumbai",
    platforms: ["instagram"],
  },
  {
    id: 3,
    initials: "GB",
    title: "Eco-Friendly Campaign",
    brandName: "GreenEarth Co.",
    status: "Completed",
    tags: ["Eco"],
    budget: "₹20,000",
    deadline: "Finished",
    deliverables: "1 Reel",
    location: "Chennai",
    platforms: ["youtube"],
  },
  {
    id: 4,
    initials: "WK",
    title: "Winter Knits 2026",
    brandName: "StyleBrand Co.",
    status: "Active",
    tags: ["Fashion"],
    budget: "₹15,000",
    deadline: "Feb 05",
    daysLeft: "15d",
    deliverables: "1 Reel",
    location: "Delhi",
    platforms: ["instagram"],
  },
];
