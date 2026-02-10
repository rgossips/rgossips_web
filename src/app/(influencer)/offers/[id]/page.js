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
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Your reusable components
import { CampaignTimeline } from "@/components/CampaignTimeline";
import { CampaignDeliverables } from "@/components/CampaignDeliverables";
import CampaignOverview from "@/components/CampaignOverview";
import { ApplyCampaignForm } from "@/components/ApplyCampaignForm";

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
  {
    id: 103,
    title: "Travel Vlog",
    brand: "GlobeTrotter",
    budget: "₹50,000",
    image:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80",
  },
];

export default function CampaignDetailsPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const campaignData = {
    initials: "SB",
    title: "Summer Collection Launch",
    brandName: "StyleBrand Co.",
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-32 font-sans">
      {/* Apply Campaign Form Overlay */}
      <AnimatePresence>
        {isApplyOpen && (
          <ApplyCampaignForm
            onClose={() => setIsApplyOpen(false)}
            campaignData={campaignData}
          />
        )}
      </AnimatePresence>
      {/* Hero Section with Transparent Text Overlay */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80"
          className="w-full h-full object-cover"
          alt="Campaign Hero"
        />
        {/* Dark Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Actions */}
        <div className="absolute top-10 left-6 right-6 flex justify-between z-10">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white"
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white"
            >
              <Share2 size={20} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white"
            >
              <Bookmark size={20} />
            </Button>
          </div>
        </div>

        {/* Transparent Brand & Campaign Box Overlay */}
        <div className="absolute bottom-6 left-6 right-6 z-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-[#B38B59] rounded-2xl flex items-center justify-center text-white text-2xl font-bold border-2 border-white/20 backdrop-blur-sm shadow-lg">
            SB
          </div>
          <div className="flex-1">
            <h1 className="text-white text-xl font-black leading-tight drop-shadow-md">
              Summer Collection Launch
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/90 text-xs font-bold uppercase tracking-wider">
                StyleBrand Co.
              </span>
              <Award size={14} className="text-amber-400" />
              <Badge className="bg-[#00BA88] text-[10px] h-4 border-none font-bold">
                NEW
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 px-6 grid grid-cols-2 gap-4">
        {[
          {
            label: "Budget",
            val: "₹25k - ₹35k",
            icon: "₹",
            color: "text-[#00BA88]",
            bg: "bg-emerald-50",
          },
          {
            label: "Deadline",
            val: "Jan 30, 2026",
            sub: "12 days left",
            icon: <Calendar size={18} />,
            color: "text-red-500",
            bg: "bg-red-50",
          },
          {
            label: "Slots",
            val: "50 slots",
            sub: "127 applicants",
            icon: <Users size={18} />,
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
          {
            label: "Platforms",
            val: "Insta, TikTok",
            icon: <Globe size={18} />,
            color: "text-[#00BA88]",
            bg: "bg-emerald-50",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm"
          >
            <div
              className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-2 font-bold`}
            >
              {stat.icon}
            </div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {stat.label}
            </p>
            <p className="text-sm font-black text-slate-800">{stat.val}</p>
            {stat.sub && (
              <p className={`text-[9px] font-bold ${stat.color}`}>{stat.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 mt-8">
        <div className="bg-white p-1.5 rounded-2xl flex gap-1 shadow-sm border border-slate-50">
          {["Overview", "Deliverables", "Timeline"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === tab
                  ? "bg-[#E60076] text-white shadow-lg shadow-pink-100"
                  : "text-slate-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 mt-8">
        {activeTab === "Overview" && <CampaignOverview />}
        {activeTab === "Deliverables" && <CampaignDeliverables />}
        {activeTab === "Timeline" && <CampaignTimeline />}
      </div>

      {/* Similar Campaigns Slider */}
      <div className="mt-12 mb-8">
        <div className="px-6 flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">
            Similar Campaigns
          </h3>
          <button className="text-[#E60076] text-xs font-bold flex items-center gap-1 hover:underline">
            View All <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide no-scrollbar">
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
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-black text-slate-800">
                  {campaign.budget}
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                  {campaign.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {campaign.brand}
                </p>
                <div className="mt-3 flex justify-end">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-16 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 flex gap-4 z-20">
        <Button
          variant="outline"
          className="w-16 h-14 rounded-2xl border-slate-200 bg-white"
        >
          <Heart size={24} className="text-slate-400" />
        </Button>
        <Button
          onClick={() => setIsApplyOpen(true)}
          className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-[#9810FA] to-[#E60076] text-white font-bold text-base shadow-lg shadow-pink-200 active:scale-[0.98] transition-transform"
        >
          Apply for Campaign
        </Button>
      </div>
    </div>
  );
}
