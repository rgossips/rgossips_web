"use client";

import React from "react";
import {
  MessageSquare,
  Bell,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Star,
  Box,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const UserDoc = () => {
  const router = useRouter();
  // Categories matching the icons in your screenshot
  const categories = [
    {
      id: 1,
      label: "Trending",
      icon: <TrendingUp className="text-magenta-500" size={20} />,
      active: true,
    },
    {
      id: 2,
      label: "For You",
      icon: <Star className="text-magenta-500" size={20} />,
      active: false,
    },
    {
      id: 3,
      label: "Products",
      icon: <Box className="text-magenta-500" size={20} />,
      active: false,
    },
  ];

  return (
    <header className="w-full bg-[#F8F9FA] px-6 pt-4 pb-6 rounded-b-[40px]">
      {/* User Info Row */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Image
              width={200}
              height={200}
              src="https://i.pravatar.cc/150?u=jones"
              alt="User"
              className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 leading-none">
              Hi, Jones
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600">
                Earnings: ₹2,00,000
              </span>
            </div>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              router.push("/chats");
            }}
            className="p-3 bg-white rounded-2xl shadow-sm text-slate-600 active:scale-90 transition-transform"
          >
            <MessageSquare size={20} />
          </button>
          <div className="relative">
            <button
              onClick={() => {
                router.push("/notifications");
              }}
              className="p-3 bg-white rounded-2xl shadow-sm text-slate-600 active:scale-90 transition-transform"
            >
              <Bell size={20} />
            </button>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </div>
        </div>
      </div>

      {/* Search Bar Row */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search campaigns, brands..."
            className="w-full bg-white py-4 pl-12 pr-4 rounded-2xl text-sm font-medium border-none focus:ring-2 focus:ring-magenta-500 shadow-sm placeholder:text-slate-400"
          />
        </div>
        <button className="p-4 bg-white rounded-2xl shadow-sm text-slate-600 flex items-center justify-center border border-slate-100">
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* Category Selection Boxes */}
      <div className="flex justify-between gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`flex-1 min-w-[100px] flex flex-col items-center justify-center p-4 rounded-3xl transition-all duration-300 shadow-sm ${
              cat.active
                ? "bg-white border-b-4 border-magenta-500"
                : "bg-white border-transparent"
            }`}
          >
            <div className="mb-2 p-2 rounded-xl bg-slate-50">
              {/* Note: In your image icons are pinkish-purple */}
              <span className="text-[#D81B60]">{cat.icon}</span>
            </div>
            <span
              className={`text-[11px] font-bold ${cat.active ? "text-slate-900" : "text-slate-400"}`}
            >
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </header>
  );
};

export default UserDoc;
