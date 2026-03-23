"use client";

import {
  Search,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  Instagram as InstaIcon,
  Activity,
  Bookmark,
} from "lucide-react";
import { TrustSection } from "@/components/brands/TrustSection";
import { CategoryFilters } from "@/components/brands/CategoryFilters";
import { InfluencerCard } from "@/components/brands/InfluencerCard";
import { FilterDrawer } from "@/components/brands/FilterDrawer";

const influencers = [
  {
    name: "Kapil Sharma",
    category: "Acting, Professional: TV, OTT",
    instagram: "45.6M",
    youtube: "39.8K",
    imageUrl: "https://i.pravatar.cc/150?u=kapil",
  },
  {
    name: "Faisal Shaikh",
    category: "Entertainment",
    instagram: "34M",
    youtube: "3.91M",
    imageUrl: "https://i.pravatar.cc/150?u=faisal",
  },
  {
    name: "Vaibhav Siinty",
    category: "Business & Startups",
    instagram: "18M",
    youtube: null,
    imageUrl: "https://i.pravatar.cc/150?u=siinty",
  },
  {
    name: "Nidhi Mohan Kamal",
    category: "Health",
    instagram: "400K",
    youtube: "20K",
    imageUrl: "https://i.pravatar.cc/150?u=nidhi",
  },
];

const FilterBar = () => (
  <div className="flex items-center gap-2 flex-wrap">
    <FilterDrawer />
    <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full text-[11px] font-semibold cursor-pointer">
      Sort by <ChevronDown size={12} />
    </button>
    <button className="flex items-center gap-2 px-3 py-1.5 border border-pink-200 bg-pink-50/30 rounded-full text-[11px] font-semibold text-pink-600 cursor-pointer">
      <InstaIcon size={12} /> Instagram <ChevronDown size={12} />
    </button>
    <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full text-[11px] font-semibold cursor-pointer">
      Category <ChevronDown size={12} />
    </button>
  </div>
);

const InfluencerDirectory = () => {
  return (
    <div className="bg-white min-h-screen pb-20 lg:pb-8">
      {/* ── MOBILE Header ── */}
      <section className="lg:hidden w-full bg-linear-to-b from-[#4C75BE] to-[#4A3996] px-6 pt-12 pb-10 rounded-b-[40px] text-white">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Search</h1>
            <p className="text-blue-100 text-xs">The influencer directory</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-white/10 rounded-lg backdrop-blur-sm cursor-pointer">
              <SlidersHorizontal size={18} />
            </button>
            <button className="p-2 bg-white/10 rounded-lg backdrop-blur-sm cursor-pointer">
              <Plus size={18} />
            </button>
          </div>
        </div>
        <div className="relative flex items-center bg-white rounded-2xl p-4 shadow-xl">
          <Search className="text-gray-300 absolute left-4" size={20} />
          <input
            type="text"
            placeholder='Enter Creator by "Username"'
            className="w-full pl-8 text-sm text-gray-800 outline-hidden placeholder:text-gray-300"
          />
          <button className="bg-blue-600 p-1.5 rounded-full text-white ml-2 cursor-pointer">
            <Plus size={16} />
          </button>
        </div>
      </section>

      {/* ── DESKTOP Header ── */}
      <section className="hidden lg:block px-8 pt-8 pb-4">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Search</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              The influencer directory
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition cursor-pointer">
              <Activity size={14} /> My activity
            </button>
            <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition cursor-pointer">
              <Bookmark size={16} />
            </button>
          </div>
        </div>

        <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <Search className="text-gray-400 absolute left-4" size={18} />
          <input
            type="text"
            placeholder='Enter Creator by "Username"'
            className="w-full pl-8 text-sm text-gray-700 outline-none placeholder:text-gray-400 bg-transparent"
          />
          <button className="bg-blue-600 p-1.5 rounded-full text-white ml-2 shrink-0 cursor-pointer">
            <Plus size={16} />
          </button>
        </div>
      </section>

      {/* ── DESKTOP: Trust Score + Filter Bar inline ── */}
      <div className="hidden w-full lg:flex justify-between items-center gap-4 px-8 py-3">
        <div className="flex-1 max-w-[50%]">
          <TrustSection />
        </div>
        <div className="col-span-2">
          <FilterBar />
        </div>
      </div>

      {/* ── MOBILE: Trust Section ── */}
      <div className="lg:hidden pt-4 px-4">
        <TrustSection />
      </div>

      {/* Category Filters */}
      <CategoryFilters />

      {/* ── MOBILE: Filter Bar ── */}
      <div className="lg:hidden flex items-center gap-2 px-6 mb-4">
        <FilterBar />
      </div>

      {/* ── Influencer Grid: 1-col mobile, 2-col desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:px-8">
        {influencers.map((inf, i) => (
          <InfluencerCard key={i} {...inf} />
        ))}
      </div>
    </div>
  );
};

export default InfluencerDirectory;
