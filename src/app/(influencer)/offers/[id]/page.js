"use client";
import React, { useState } from "react";
import {
  ChevronLeft,
  Share2,
  Bookmark,
  Calendar,
  Users,
  Globe,
  Award,
  Heart,
  ChevronRight,
  Clock,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Your reusable components
import { CampaignTimeline } from "@/components/CampaignTimeline";
import { CampaignDeliverables } from "@/components/CampaignDeliverables";
import CampaignOverview from "@/components/CampaignOverview";
import { ApplyCampaignForm } from "@/components/ApplyCampaignForm";
import { CampaignCompletedView } from "@/components/CampaignCompletedView";

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

  // Status management: "open", "pending", or "completed"
  const [isUserApplied, setIsUserApplied] = useState(true);
  const [campaignStatus, setCampaignStatus] = useState("completed");

  // Full dummy data to prevent crashes in sub-components
  const campaignData = {
    initials: "SB",
    title: "Summer Collection Launch",
    brandName: "StyleBrand Co.",
    budget: "₹25,000 - ₹35,000", // Required by ApplyCampaignForm
    deadline: "Jan 30, 2026", // Required by ApplyCampaignForm
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-40 font-sans">
      {/* Apply Campaign Form Overlay */}
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

      {/* Hero Section */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80"
          className="w-full h-full object-cover"
          alt="Hero"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Actions */}
        <div className="absolute top-10 left-6 right-6 flex justify-between z-10">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full bg-white/20 backdrop-blur-md text-white"
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full bg-white/20 backdrop-blur-md text-white"
            >
              <Share2 size={20} />
            </Button>
          </div>
        </div>

        {/* Brand Info Overlay */}
        <div className="absolute bottom-6 left-6 right-6 z-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-[#B38B59] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {campaignData.initials}
          </div>
          <div className="flex-1">
            <h1 className="text-white text-xl font-black leading-tight drop-shadow-md">
              {campaignData.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/90 text-xs font-bold uppercase tracking-wider">
                {campaignData.brandName}
              </span>
              <Badge className="bg-[#00BA88] text-[10px] h-4 border-none font-bold">
                {campaignStatus === "completed" ? "COMPLETED" : "NEW"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 mt-8">
        {/* VIEW 1: APPLICATION PENDING */}
        {isUserApplied && campaignStatus === "pending" && (
          <div className="bg-[#F0F7FF] rounded-[32px] p-6 border border-[#E1EFFF] shadow-sm mb-8">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-[#3B82F6] rounded-2xl flex items-center justify-center text-white">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  Application Status
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  Submitted on Jan 18, 2026
                </p>
              </div>
            </div>
            <div className="bg-white rounded-[24px] p-5 border border-[#E1EFFF]">
              <h4 className="text-[#3B82F6] text-sm font-black mb-1">
                Under Review
              </h4>
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                The brand is reviewing your profile and will respond within 3-5
                business days
              </p>
            </div>
          </div>
        )}

        {/* VIEW 2: CAMPAIGN COMPLETED */}
        {campaignStatus === "completed" ? (
          <CampaignCompletedView />
        ) : (
          /* VIEW 3: STANDARD CAMPAIGN DETAILS (Overview/Deliverables/Timeline) */
          <>
            {isUserApplied && campaignStatus == "open" && (
              <div className="w-full bg-[#F0F7FF] rounded-[32px] p-6 border border-[#E1EFFF] shadow-sm my-5 mx-auto">
                {/* Header Section */}

                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-[#89B3FF] rounded-2xl flex items-center justify-center text-white shadow-sm">
                    <Clock size={24} />
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      Application Status
                    </h3>

                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                      Submitted on Jan 18, 2026
                    </p>
                  </div>
                </div>

                {/* Nested Status Card */}

                <div className="bg-white rounded-[24px] p-5 border border-[#E1EFFF] shadow-sm">
                  <h4 className="text-[#3B82F6] text-sm font-black mb-1">
                    Under Review
                  </h4>

                  <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                    The brand is reviewing your profile and will respond within
                    3-5 business days
                  </p>
                </div>
              </div>
            )}
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-emerald-50 text-[#00BA88] rounded-2xl flex items-center justify-center mb-2 font-bold">
                  ₹
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Budget
                </p>
                <p className="text-sm font-black text-slate-800">
                  {campaignData.budget}
                </p>
              </div>
              <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-2">
                  <Calendar size={18} />
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Deadline
                </p>
                <p className="text-sm font-black text-slate-800">
                  {campaignData.deadline}
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white p-1.5 rounded-2xl flex gap-1 shadow-sm border border-slate-50 mb-8">
              {["Overview", "Deliverables", "Timeline"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab
                      ? "bg-[#E60076] text-white shadow-lg shadow-pink-100"
                      : "text-slate-400"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mb-12">
              {activeTab === "Overview" && <CampaignOverview />}
              {activeTab === "Deliverables" && <CampaignDeliverables />}
              {activeTab === "Timeline" && <CampaignTimeline />}
            </div>
          </>
        )}

        {/* Similar Campaigns Section (Visible in all states) */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">
              Similar Campaigns
            </h3>
            <button className="text-[#E60076] text-xs font-bold flex items-center gap-1">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {SIMILAR_CAMPAIGNS.map((campaign) => (
              <div
                key={campaign.id}
                className="min-w-[220px] bg-white rounded-[32px] overflow-hidden border border-slate-50 shadow-sm"
              >
                <div className="h-32 w-full relative">
                  <img
                    src={campaign.image}
                    className="w-full h-full object-cover"
                    alt={campaign.title}
                  />
                  <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-lg text-[10px] font-black">
                    {campaign.budget}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="text-sm font-bold text-slate-800">
                    {campaign.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {campaign.brand}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Apply Button */}
      {!isUserApplied && campaignStatus === "open" && (
        <div className="fixed bottom-16 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 flex gap-4 z-20">
          <Button
            variant="outline"
            className="w-16 h-14 rounded-2xl border-slate-200 bg-white"
          >
            <Heart size={24} className="text-slate-400" />
          </Button>
          <Button
            onClick={() => setIsApplyOpen(true)}
            style={{
              background: "linear-gradient(90deg, #9810FA 0%, #E60076 100%)",
            }}
            className="flex-1 h-14 rounded-2xl text-white font-bold text-base shadow-lg shadow-pink-200 active:scale-[0.95] transition-transform"
          >
            Apply for Campaign
          </Button>
        </div>
      )}
    </div>
  );
}
