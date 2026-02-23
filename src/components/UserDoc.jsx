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

  const categories = [
    { id: 1, label: "Trending", icon: <TrendingUp size={20} />, active: true },
    { id: 2, label: "For You", icon: <Star size={20} />, active: false },
    { id: 3, label: "Brands", icon: <Box size={20} />, active: false },
    { id: 4, label: "Trending", icon: <TrendingUp size={20} />, active: false },
    { id: 5, label: "Trending", icon: <TrendingUp size={20} />, active: false },
  ];

  return (
    <header className="w-full bg-[#F8F9FA] px-6 rounded-b-[40px] lg:pt-24 pt-4">
      <div className="max-w-7xl mx-auto">
        {/* Top Row: Responsive Layout */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          {/* User Info Group */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                width={60}
                height={60}
                src="https://i.pravatar.cc/150?u=jones"
                alt="User"
                className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border-2 border-white shadow-sm object-cover"
              />
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-800 leading-tight">
                Hi, Jones
              </h1>
              <p className="text-sm font-bold text-emerald-600">
                Total Earnings:{" "}
                <span className="text-slate-900">₹2,00,000</span>
              </p>
            </div>
          </div>

          {/* Search & Actions Group */}
          <div className="flex items-center gap-3 flex-1 lg:max-w-2xl">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search campaigns, brands..."
                className="w-full bg-white py-4 lg:py-3.5 pl-12 pr-4 rounded-2xl text-sm font-medium border-none shadow-sm focus:ring-2 focus:ring-pink-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Action Buttons (Notification/Filter) */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  router.push("/notifications");
                }}
                className="hidden cursor-pointer lg:flex p-3.5 bg-white rounded-2xl shadow-sm text-slate-600 hover:bg-slate-50 border border-slate-100 transition-colors"
              >
                <Bell size={22} />
              </button>
              <button
                onClick={() => {
                  router.push("/chats");
                }}
                className="p-3.5 cursor-pointer lg:p-3.5 bg-white rounded-2xl shadow-sm text-slate-600 border border-slate-100"
              >
                <MessageSquare size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Selection - Hidden on Desktop (will be in sidebar) */}
        <div className="lg:hidden flex gap-4 scrollbar-hide overflow-x-auto pb-2 no-scrollbar items-center justify-center">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              className={`flex-none min-w-[110px] lg:min-w-[140px] flex flex-col items-center justify-center p-5 rounded-[32px] transition-all duration-300 shadow-sm ${
                cat.active
                  ? "bg-white border-b-4 border-pink-500 translate-y-[-2px]"
                  : "bg-white hover:bg-slate-50"
              }`}
            >
              <div className="mb-3 p-2.5 rounded-2xl bg-slate-50 text-pink-500">
                {React.cloneElement(cat.icon, { size: 24 })}
              </div>
              <span
                className={`text-xs lg:text-sm font-bold ${
                  cat.active ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default UserDoc;
