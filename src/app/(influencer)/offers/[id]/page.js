"use client";
import React, { useState } from "react";
import {
  ChevronLeft,
  Share2,
  Calendar,
  ChevronRight,
  Clock,
  Heart,
  TrendingUp,
  MapPin,
  Award,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Sub-components
import { CampaignTimeline } from "@/components/CampaignTimeline";
import { CampaignDeliverables } from "@/components/CampaignDeliverables";
import CampaignOverview from "@/components/CampaignOverview";
import { ApplyCampaignForm } from "@/components/ApplyCampaignForm";
import { CampaignCompletedView } from "@/components/CampaignCompletedView";
import { useRouter } from "next/navigation";

const SIMILAR_CAMPAIGNS = [
  {
    id: 101,
    title: "Winter Lookbook",
    brand: "Nordic Style",
    budget: "₹30,000",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80",
  },
  {
    id: 102,
    title: "Tech Unboxing",
    brand: "GadgetPro",
    budget: "₹45,000",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80",
  },
];

export default function CampaignDetailsPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isUserApplied, setIsUserApplied] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState("open");
  const router = useRouter();

  const campaignData = {
    initials: "SB",
    title: "Summer Collection Launch",
    brandName: "StyleBrand Co.",
    budget: "₹25,000 - ₹35,000",
    deadline: "Jan 30, 2026",
    location: "Mumbai, India",
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] font-sans">
      <AnimatePresence>
        {isApplyOpen && (
          <ApplyCampaignForm
            onClose={() => setIsApplyOpen(false)}
            campaignData={campaignData}
            onSubmitSuccess={() => {
              setIsApplyOpen(false);
              setIsUserApplied(true);
              setCampaignStatus("pending");
            }}
          />
        )}
      </AnimatePresence>

      {/* 1. Hero Section - More contained on Desktop */}
      <div className="relative h-[250px] lg:h-[350px] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80"
          className="w-full h-full object-cover"
          alt="Hero"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Top Action Buttons */}
        <div className="absolute top-6 lg:top-28 left-6 right-6 z-20 flex justify-between items-start">
          {/* Back Button - Always Visible */}
          <Button
            onClick={() => router.back()}
            size="icon"
            variant="ghost"
            className="rounded-xl cursor-pointer bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30"
          >
            <ChevronLeft size={20} />
          </Button>

          {/* Share & Heart - Mobile Only */}
          <div className=" flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-xl cursor-pointer bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30"
            >
              <Share2 size={20} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-xl cursor-pointer bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30"
            >
              <Heart size={20} />
            </Button>
          </div>
        </div>

        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto w-full px-6 pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="w-16 h-16 lg:w-24 lg:h-24 bg-[#B38B59] rounded-xl lg:rounded-xl flex items-center justify-center text-white text-2xl lg:text-4xl font-bold shadow-2xl border-4 border-white/10 backdrop-blur-sm">
                {campaignData.initials}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 lg:mb-2">
                  <Badge className="bg-[#00BA88] text-[9px] lg:text-[10px] font-black tracking-widest px-2">
                    {campaignStatus.toUpperCase()}
                  </Badge>
                  <span className="text-white/70 text-[10px] lg:text-xs font-bold flex items-center gap-1">
                    <MapPin size={12} /> {campaignData.location}
                  </span>
                </div>
                <h1 className="text-white text-2xl lg:text-5xl font-black leading-tight tracking-tight">
                  {campaignData.title}
                </h1>
                <p className="text-white/80 text-xs lg:text-base font-bold uppercase tracking-widest mt-1">
                  {campaignData.brandName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Grid Layout */}
      <main className="max-w-7xl mx-auto px-6 py-28 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Status Views (Sticky on mobile, top on laptop) */}
            {isUserApplied && campaignStatus === "pending" && (
              <div className="bg-[#F0F7FF] rounded-xl p-6 border border-[#E1EFFF] flex items-center gap-6 shadow-sm">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-[#3B82F6] shadow-inner">
                  <Clock size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    Application Status: Under Review
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    Submitted on Jan 18, 2026 • Response expected in 3 days
                  </p>
                </div>
              </div>
            )}

            {campaignStatus === "completed" ? (
              <CampaignCompletedView />
            ) : (
              <>
                {/* Custom Tabs Design */}
                <div className="sticky top-4 z-30 lg:relative lg:top-0 bg-white/80 backdrop-blur-md lg:bg-transparent p-1.5 lg:p-0 rounded-3xl flex gap-2 lg:gap-8 border lg:border-none border-slate-100 shadow-sm lg:shadow-none">
                  {["Overview", "Deliverables", "Timeline"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 cursor-pointer lg:flex-none lg:pb-4 lg:px-2 text-xs lg:text-base font-black transition-all relative ${
                        activeTab === tab
                          ? "text-[#E60076] py-3 lg:py-0 bg-pink-50 lg:bg-transparent rounded-xl lg:rounded-none"
                          : "text-slate-400 py-3 lg:py-0"
                      }`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <motion.div
                          layoutId="activeTab"
                          className="hidden lg:block absolute bottom-0 left-0 right-0 h-1 bg-[#E60076] rounded-full"
                        />
                      )}
                    </button>
                  ))}
                </div>

                <div className="bg-white lg:bg-transparent p-6 lg:p-0 rounded-xl shadow-sm lg:shadow-none border border-slate-50 lg:border-none">
                  {activeTab === "Overview" && <CampaignOverview />}
                  {activeTab === "Deliverables" && <CampaignDeliverables />}
                  {activeTab === "Timeline" && <CampaignTimeline />}
                </div>
              </>
            )}

            {/* Similar Campaigns (Moved inside left column for desktop flow) */}
            <div className="pt-10 border-t border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  Similar Opportunities
                </h3>
                <Button
                  variant="link"
                  className="text-[#E60076] font-bold cursor-pointer"
                >
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {SIMILAR_CAMPAIGNS.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="group bg-white rounded-xl p-4 border border-slate-100 hover:shadow-xl transition-all cursor-pointer"
                  >
                    <div className="h-40 rounded-xl overflow-hidden mb-4 relative">
                      <img
                        src={campaign.image}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black">
                        {campaign.budget}
                      </div>
                    </div>
                    <h4 className="font-black text-slate-800">
                      {campaign.title}
                    </h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {campaign.brand}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar (Sticky on Laptop) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Main Card */}
              <div className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-[#00BA88] rounded-xl flex items-center justify-center font-black text-xl">
                      ₹
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">
                        Compensation
                      </p>
                      <p className="text-xl font-black text-slate-800">
                        {campaignData.budget}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                      <Calendar size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">
                        Application Deadline
                      </p>
                      <p className="text-lg font-black text-slate-800">
                        {campaignData.deadline}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                      <TrendingUp size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">
                        Category
                      </p>
                      <p className="text-lg font-black text-slate-800">
                        Fashion & Lifestyle
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 space-y-4">
                  {!isUserApplied && campaignStatus === "open" && (
                    <Button
                      onClick={() => setIsApplyOpen(true)}
                      className="w-full cursor-pointer h-16 rounded-xl text-white font-black text-lg shadow-xl shadow-pink-200 transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-[#9810FA] to-[#E60076]"
                    >
                      Apply Now
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full h-14 cursor-pointer rounded-xl border-slate-200 font-bold text-slate-600"
                  >
                    Message Brand
                  </Button>
                </div>
              </div>

              {/* Trust Badge Card */}
              {/* <div className="bg-slate-900 rounded-xl p-6 text-white overflow-hidden relative group">
                <div className="relative z-10">
                  <h4 className="font-black text-lg mb-1 italic">
                    Verified Brand
                  </h4>
                  <p className="text-white/60 text-[10px] font-bold leading-relaxed uppercase tracking-wider">
                    Payments are secured through our platform escrow system
                  </p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Award size={100} />
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </main>

      {/* 3. Mobile Floating Bottom Bar - Only visible on mobile */}
      {!isUserApplied && campaignStatus === "open" && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex gap-3 z-50">
          <Button
            variant="outline"
            className="w-16 h-14 rounded-xl border-slate-200"
          >
            <Heart size={24} className="text-slate-400" />
          </Button>
          <Button
            onClick={() => setIsApplyOpen(true)}
            className="flex-1 h-14 rounded-xl text-white font-black shadow-lg bg-gradient-to-r from-[#9810FA] to-[#E60076]"
          >
            Apply for Campaign
          </Button>
        </div>
      )}
    </div>
  );
}
