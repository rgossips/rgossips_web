"use client";

import { useState } from "react";
import { CampaignCard } from "@/components/brands/CampaignCard";
import { FeaturedCampaign } from "@/components/brands/FeaturedCampaign";
import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  Plus,
  X,
  Calendar,
  ChevronDown,
  Upload,
  ArrowUpRight,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";

const CampaignPage = () => {
  const [activeTab, setActiveTab] = useState("Live");

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

        <div className="absolute left-6 right-6 -bottom-6 flex items-center bg-white rounded-3xl p-2 shadow-xl shadow-gray-200">
          <input
            type="text"
            placeholder="Enter Campaign Name........"
            className="w-full pl-4 text-sm text-gray-800 outline-none placeholder:text-gray-300"
          />
          <button className="bg-[#5851DB] p-2.5 rounded-full text-white">
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div className="mt-12 px-6 flex gap-3 overflow-x-hidden no-scrollbar">
        {["Live", "My Posts", "Applied", "Missed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === tab
                ? "bg-[#5851DB] text-white shadow-lg shadow-purple-100"
                : "bg-white text-gray-400"
            }`}
          >
            {tab === "Live" && activeTab === "Live" && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Live" ? (
        <div className="animate-in fade-in duration-500">
          <div className="px-6 mt-8">
            <FeaturedCampaign />
          </div>
          <div className="px-6 mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-md font-bold text-gray-900">
                Recent Campaigns
              </h2>
              <button className="text-[10px] text-[#5851DB] font-bold">
                See all
              </button>
            </div>
            <div className="space-y-4">
              <CampaignCard />
              <CampaignCard />
            </div>
          </div>
        </div>
      ) : activeTab === "My Posts" ? (
        /* Empty State for My Posts */
        <div className="flex flex-col items-center justify-center pt-20 px-10 text-center animate-in zoom-in-95 duration-300">
          <div className="relative mb-6">
            <img
              src="/empty-campaigns.png"
              alt="No posts"
              className="w-40 opacity-80"
            />
            {/* Replace with your illustration path */}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            You haven't posted yet
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Post your requirements to connect creators and boost your campaign
            in ease.
          </p>
          <CreateCampaignDrawer
            trigger={
              <button className="mt-8 bg-[#5851DB] text-white px-8 py-4 rounded-2xl shadow-lg shadow-purple-200 flex items-center gap-2 font-bold text-sm">
                Post a Request <ArrowUpRight size={18} />
              </button>
            }
          />
        </div>
      ) : null}

      {/* Global Floating FAB */}
      <CreateCampaignDrawer
        trigger={
          <button className="fixed bottom-24 right-6 bg-[#5851DB] text-white px-6 py-3 rounded-2xl shadow-lg shadow-purple-200 flex items-center gap-2 font-bold text-sm z-50 transition-transform active:scale-95">
            <Plus size={20} /> Post Request
          </button>
        }
      />
    </div>
  );
};

/* The "Create Campaign Request" Popup Component */
const CreateCampaignDrawer = ({ trigger }) => {
  return (
    <Drawer>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="max-h-[92vh] rounded-t-[40px] border-none">
        <DrawerHeader className="border-b border-gray-100 flex-row justify-between items-center px-6">
          <DrawerClose>
            <X className="text-gray-400" size={24} />
          </DrawerClose>
          <DrawerTitle className="text-lg font-bold">
            Create Campaign Request
          </DrawerTitle>
          <div className="w-6" /> {/* Spacer for centering */}
        </DrawerHeader>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-gray-900 mb-2 block">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter campaign title"
              className="w-full bg-[#F8F9FE] p-4 rounded-2xl text-sm outline-none border border-transparent focus:border-purple-200"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-900 mb-2 block">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Describe what you're looking for..."
              rows={4}
              className="w-full bg-[#F8F9FE] p-4 rounded-2xl text-sm outline-none border border-transparent focus:border-purple-200 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-900 mb-2 block">
              Category
            </label>
            <div className="relative">
              <select className="w-full bg-[#F8F9FE] p-4 rounded-2xl text-sm outline-none appearance-none cursor-pointer">
                <option>Select Category</option>
                <option>Marketing</option>
                <option>Influencer</option>
              </select>
              <ChevronDown
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={18}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">
                Budget <span className="text-[10px]">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Set Budget"
                className="w-full bg-[#F8F9FE] p-4 rounded-2xl text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">
                Deadline <span className="text-[10px]">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pick a date"
                  className="w-full bg-[#F8F9FE] p-4 rounded-2xl text-sm outline-none"
                />
                <Calendar
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">
              Attachments <span className="text-[10px]">(Optional)</span>
            </label>
            <div className="w-full border-2 border-dashed border-gray-100 rounded-[32px] p-10 flex flex-col items-center justify-center gap-3 bg-white">
              <div className="p-3 bg-[#F8F9FE] rounded-full text-gray-400">
                <Upload size={24} />
              </div>
              <p className="text-xs font-bold text-gray-900">Tap to upload</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4 border-t border-gray-100">
          <DrawerClose asChild>
            <button className="py-4 rounded-2xl font-bold text-gray-900 border border-gray-100">
              Cancel
            </button>
          </DrawerClose>
          <button className="py-4 rounded-2xl font-bold text-gray-400 bg-gray-100 cursor-not-allowed">
            Submit Request
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CampaignPage;
