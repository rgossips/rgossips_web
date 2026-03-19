"use client";

import { CampaignCard } from "@/components/brands/CampaignCard";
import { FeaturedCampaign } from "@/components/brands/FeaturedCampaign";
import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  Plus,
  MapPin,
  Calendar,
  Clock,
  Banknote,
} from "lucide-react";

const CampaignPage = () => {
  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-24">
      {/* Header Section */}
      <section className="w-full bg-[#5851DB] px-6 pt-12 pb-16 rounded-b-[40px] text-white relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Campaign</h1>
            <p className="text-purple-100 text-xs">
              Discover new opportunities
            </p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-white/10 rounded-full backdrop-blur-sm">
              <Search size={20} />
            </button>
            <button className="p-2 bg-white/10 rounded-full backdrop-blur-sm">
              <SlidersHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* Floating Search/Input */}
        <div className="absolute left-6 right-6 -bottom-6 flex items-center bg-white rounded-3xl p-2 shadow-xl shadow-gray-200">
          <input
            type="text"
            placeholder="Enter Campaign Name........"
            className="w-full pl-4 text-sm text-gray-800 outline-hidden placeholder:text-gray-300"
          />
          <button className="bg-[#5851DB] p-2.5 rounded-full text-white">
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Campaign Status Tabs */}
      <div className="mt-12 px-6 flex gap-3 overflow-x-auto no-scrollbar">
        <button className="px-6 py-2 bg-[#8C84FF] text-white rounded-full text-xs font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />{" "}
          Live
        </button>
        {["My Posts", "Applied", "Missed"].map((tab) => (
          <button
            key={tab}
            className="px-6 py-2 bg-white text-gray-400 rounded-full text-xs font-semibold whitespace-nowrap"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Featured Section */}
      <div className="px-6 mt-8">
        <FeaturedCampaign />
      </div>

      {/* Recent Campaigns Section */}
      <div className="px-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-md font-bold text-gray-900">Recent Campaigns</h2>
          <button className="text-[10px] text-[#5851DB] font-bold">
            See all
          </button>
        </div>
        <div className="space-y-4">
          <CampaignCard />
          <CampaignCard />
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-24 right-6 bg-[#5851DB] text-white px-6 py-3 rounded-2xl shadow-lg shadow-purple-200 flex items-center gap-2 font-bold text-sm z-50">
        <Plus size={20} /> Post Request
      </button>
    </div>
  );
};

export default CampaignPage;
