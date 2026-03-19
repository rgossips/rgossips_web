"use client";

import {
  Search,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  Instagram as InstaIcon,
} from "lucide-react";
import { TrustSection } from "@/components/brands/TrustSection";
import { CategoryFilters } from "@/components/brands/CategoryFilters";
import { InfluencerCard } from "@/components/brands/InfluencerCard";
import { useState } from "react";
import { FilterDrawer } from "@/components/brands/FilterDrawer";

const InfluencerDirectory = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Header Section */}
      <section className="w-full bg-gradient-to-b from-[#4C75BE] to-[#4A3996] px-6 pt-12 pb-10 rounded-b-[40px] text-white relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Search</h1>
            <p className="text-blue-100 text-xs">The influencer directory</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <SlidersHorizontal size={18} />
            </button>
            <button className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Floating Search Input */}
        <div className="relative flex items-center bg-white rounded-2xl p-4 shadow-xl">
          <Search className="text-gray-300 absolute left-4" size={20} />
          <input
            type="text"
            placeholder='Enter Creator by "Username"'
            className="w-full pl-8 text-sm text-gray-800 outline-hidden placeholder:text-gray-300"
          />
          <button className="bg-blue-600 p-1.5 rounded-full text-white ml-2">
            <Plus size={16} />
          </button>
        </div>
      </section>

      <TrustSection />

      <CategoryFilters />

      {/* Action Filters */}
      <div className="flex items-center gap-2 px-6 mb-4">
        <FilterDrawer />
        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full text-[11px] font-semibold">
          Sort by <ChevronDown size={12} />
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 border border-pink-200 bg-pink-50/30 rounded-full text-[11px] font-semibold text-pink-600">
          <InstaIcon size={12} /> Instagram <ChevronDown size={12} />
        </button>
      </div>

      {/* Influencer List */}
      <div className="bg-white">
        <InfluencerCard
          name="Kapil Sharma"
          category="Acting, Professional: TV, OTT"
          instagram="45.6M"
          youtube="39.8K"
          imageUrl="https://i.pravatar.cc/150?u=jones"
        />
        <InfluencerCard
          name="Faisal Shaikh"
          category="Entertainment"
          instagram="34M"
          youtube="3.91M"
          imageUrl="https://i.pravatar.cc/150?u=jones"
        />
        <InfluencerCard
          name="Kapil Sharma"
          category="Acting, Professional: TV, OTT"
          instagram="45.6M"
          youtube="39.8K"
          imageUrl="https://i.pravatar.cc/150?u=jones"
        />
        <InfluencerCard
          name="Faisal Shaikh"
          category="Entertainment"
          instagram="34M"
          youtube="3.91M"
          imageUrl="https://i.pravatar.cc/150?u=jones"
        />
      </div>
    </div>
  );
};

export default InfluencerDirectory;
