"use client";

import { Search, Zap, ChevronDown } from "lucide-react";
import Image from "next/image";
import logo from "@/assets/logo2.png";

export function BrandNavbar() {
  return (
    <header className="w-full h-[72px] border-b bg-white hidden lg:flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center text-white font-semibold">
          #
        </div>

        <span className="font-semibold text-gray-800 text-sm">RGossips</span> */}
        <Image src={logo} alt="logo" height={100} width={200} />
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            placeholder="Search for creators, campaigns, or agencies..."
            className="w-full pl-9 pr-4 h-10 rounded-lg border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Trust Score */}
        <div className="flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
          <Zap size={14} />
          Trust Score: 10%
        </div>

        {/* Invite Button */}
        <button className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition">
          Invite & Earn ₹2500
          <span className="text-lg leading-none">+</span>
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 cursor-pointer">
          <Image
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e"
            width={55}
            height={55}
            className="rounded-full aspect-square"
            alt="profile"
          />

          <ChevronDown size={16} className="text-gray-500" />
        </div>
      </div>
    </header>
  );
}
