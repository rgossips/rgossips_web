"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  Instagram as InstaIcon,
  Activity,
  Bookmark,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TrustSection } from "@/components/brands/TrustSection";
import { CategoryFilters } from "@/components/brands/CategoryFilters";
import { InfluencerCard } from "@/components/brands/InfluencerCard";
import { FilterDrawer, filterData } from "@/components/brands/FilterDrawer";

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
  {
    name: "Bhuvan Bam",
    category: "Comedy, Entertainment",
    instagram: "18.2M",
    youtube: "27M",
    imageUrl: "https://i.pravatar.cc/150?u=bhuvan",
  },
  {
    name: "Ashish Chanchlani",
    category: "Comedy",
    instagram: "12.5M",
    youtube: "30.5M",
    imageUrl: "https://i.pravatar.cc/150?u=ashish",
  },
  {
    name: "Prajakta Koli",
    category: "Entertainment, Lifestyle",
    instagram: "7.2M",
    youtube: "7.8M",
    imageUrl: "https://i.pravatar.cc/150?u=prajakta",
  },
  {
    name: "Ranveer Allahbadia",
    category: "Business & Startups, Fitness",
    instagram: "9.1M",
    youtube: "10.2M",
    imageUrl: "https://i.pravatar.cc/150?u=ranveer",
  },
  {
    name: "Kusha Kapila",
    category: "Comedy, Fashion",
    instagram: "3.8M",
    youtube: "620K",
    imageUrl: "https://i.pravatar.cc/150?u=kusha",
  },
  {
    name: "Dolly Singh",
    category: "Comedy, Lifestyle",
    instagram: "1.8M",
    youtube: "290K",
    imageUrl: "https://i.pravatar.cc/150?u=dolly",
  },
  {
    name: "Ankur Warikoo",
    category: "Business & Startups",
    instagram: "4.2M",
    youtube: "5.1M",
    imageUrl: "https://i.pravatar.cc/150?u=ankur",
  },
  {
    name: "Nikhil Sharma",
    category: "Finance",
    instagram: "2.9M",
    youtube: "4.5M",
    imageUrl: "https://i.pravatar.cc/150?u=nikhils",
  },
  {
    name: "Shivani Bafna",
    category: "Dance, Lifestyle",
    instagram: "1.2M",
    youtube: "350K",
    imageUrl: "https://i.pravatar.cc/150?u=shivani",
  },
  {
    name: "Komal Pandey",
    category: "Fashion",
    instagram: "2.1M",
    youtube: "800K",
    imageUrl: "https://i.pravatar.cc/150?u=komal",
  },
  {
    name: "Viraj Ghelani",
    category: "Comedy",
    instagram: "1.5M",
    youtube: null,
    imageUrl: "https://i.pravatar.cc/150?u=viraj",
  },
  {
    name: "Sejal Kumar",
    category: "Fashion, Lifestyle",
    instagram: "1.3M",
    youtube: "1.1M",
    imageUrl: "https://i.pravatar.cc/150?u=sejal",
  },
  {
    name: "Gaurav Taneja",
    category: "Fitness, Vlogs",
    instagram: "5.5M",
    youtube: "9.8M",
    imageUrl: "https://i.pravatar.cc/150?u=gaurav",
  },
  {
    name: "Malvika Sitlani",
    category: "Beauty",
    instagram: "890K",
    youtube: "710K",
    imageUrl: "https://i.pravatar.cc/150?u=malvika",
  },
  {
    name: "Abhi & Niyu",
    category: "Education, Travel",
    instagram: "3.6M",
    youtube: "5.2M",
    imageUrl: "https://i.pravatar.cc/150?u=abhiniyu",
  },
  {
    name: "Triggered Insaan",
    category: "Gaming, Comedy",
    instagram: "8.3M",
    youtube: "21M",
    imageUrl: "https://i.pravatar.cc/150?u=triggered",
  },
  {
    name: "Dhruv Rathee",
    category: "Education, News",
    instagram: "6.7M",
    youtube: "24M",
    imageUrl: "https://i.pravatar.cc/150?u=dhruv",
  },
  {
    name: "Mithila Palkar",
    category: "Acting, Music",
    instagram: "4.8M",
    youtube: "1.2M",
    imageUrl: "https://i.pravatar.cc/150?u=mithila",
  },
  {
    name: "Harsh Beniwal",
    category: "Comedy",
    instagram: "7.1M",
    youtube: "15M",
    imageUrl: "https://i.pravatar.cc/150?u=harsh",
  },
  {
    name: "Srishti Dixit",
    category: "Comedy, Lifestyle",
    instagram: "720K",
    youtube: "450K",
    imageUrl: "https://i.pravatar.cc/150?u=srishti",
  },
  {
    name: "Sandeep Maheshwari",
    category: "Motivation, Business",
    instagram: "5.4M",
    youtube: "28M",
    imageUrl: "https://i.pravatar.cc/150?u=sandeep",
  },
  {
    name: "Raj Shamani",
    category: "Business & Startups",
    instagram: "3.2M",
    youtube: "4.8M",
    imageUrl: "https://i.pravatar.cc/150?u=raj",
  },
  {
    name: "Sakshi Sindwani",
    category: "Fashion, Body Positivity",
    instagram: "680K",
    youtube: "210K",
    imageUrl: "https://i.pravatar.cc/150?u=sakshi",
  },
  {
    name: "Mumbiker Nikhil",
    category: "Vlogs, Travel",
    instagram: "3.9M",
    youtube: "4.3M",
    imageUrl: "https://i.pravatar.cc/150?u=nikhilm",
  },
  {
    name: "Tanmay Bhat",
    category: "Comedy, Tech",
    instagram: "6.2M",
    youtube: "12M",
    imageUrl: "https://i.pravatar.cc/150?u=tanmay",
  },
  {
    name: "Larissa D'Sa",
    category: "Beauty, Lifestyle",
    instagram: "520K",
    youtube: "180K",
    imageUrl: "https://i.pravatar.cc/150?u=larissa",
  },
];

const FilterPopover = ({ label, options, icon, activeClass }) => {
  const [selected, setSelected] = useState([]);

  const toggle = (option) =>
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );

  const hasSelection = selected.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-2 px-2 py-1.5 border rounded-full text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
            activeClass
              ? activeClass
              : hasSelection
              ? "border-[#5851DB] bg-purple-50/30 text-[#5851DB]"
              : "border-gray-200 text-gray-700"
          }`}
        >
          {icon}
          {label} {hasSelection && `(${selected.length})`}
          <ChevronDown size={12} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 p-0 rounded-xl shadow-xl border border-gray-100 max-h-72 overflow-hidden"
      >
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h4 className="text-xs font-bold text-gray-900">{label}</h4>
          {hasSelection && (
            <button
              onClick={() => setSelected([])}
              className="text-[10px] text-[#5851DB] font-semibold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="overflow-y-auto max-h-52 p-2">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50/50 rounded-lg cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggle(option)}
                className="w-4 h-4 rounded border-gray-300 text-[#5851DB] focus:ring-[#5851DB] cursor-pointer"
              />
              <span className="text-[11px] font-medium text-gray-700">
                {option}
              </span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const FilterBar = () => (
  <div className="flex items-center gap-2 flex-wrap">
    <FilterDrawer />
    <FilterPopover label="Sort by" options={filterData["Sort by"]} />
    <FilterPopover
      label="Instagram"
      options={filterData["Social Platform"]}
      icon={<InstaIcon size={12} />}
      activeClass="border-pink-200 bg-pink-50/30 text-pink-600"
    />
    <FilterPopover label="Category" options={filterData["Categories"]} />
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
      <div className="flex-1 overflow-y-auto max-h-[80vh] lg:px-8 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {influencers.map((inf, i) => (
            <InfluencerCard key={i} {...inf} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfluencerDirectory;
