"use client";

import React from "react";
import Image from "next/image";
import { Plus, Search } from "lucide-react";
import { TrustSection } from "./TrustSection";

const BrandHero = () => {
  return (
    <section className="w-full bg-gradient-to-b from-[#1C115A] to-[#3B22B2] px-6 pt-12 pb-16 rounded-b-[40px] md:rounded-b-[60px] text-white">
      <div className="max-w-7xl mx-auto">
        {/* TOP ROW */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
              <Image
                src="https://i.pravatar.cc/150?u=brand"
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>

            <div>
              <p className="text-slate-300 text-xs md:text-sm font-medium">
                Welcome back
              </p>
              <h3 className="text-white font-bold text-sm md:text-base">
                Versace
              </h3>
            </div>
          </div>

          {/* Mobile invite */}
          <button className="flex lg:hidden items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 py-2 px-4 rounded-full text-xs font-bold">
            Invite & Earn ₹2500
            <div className="bg-white rounded-full p-0.5">
              <Plus size={14} className="text-[#1C115A]" />
            </div>
          </button>
        </div>

        {/* HERO GRID */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT SIDE */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs text-white/90">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Welcome back, Add your name
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight max-w-xl">
              Connect with the <br />
              right creators, <span className="text-indigo-300">fast.</span>
            </h1>

            <p className="text-slate-300 text-sm md:text-base max-w-lg">
              Discover, verify, and collaborate with top-tier creators across
              all platforms. Build your next campaign in minutes.
            </p>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-100 transition">
                <Search size={16} />
                Browse Creators
              </button>

              <button className="bg-[#5B3DF5] px-6 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-[#5B3DF5]/30 hover:brightness-110 transition">
                View Active Campaigns
              </button>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="hidden lg:flex flex-col gap-6 items-end">
            {/* Agencies Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl w-[280px]">
              <p className="text-sm text-slate-300 mb-4">
                Trusted by 2800+ Agencies
              </p>

              <div className="flex items-center">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Image
                      key={i}
                      src={`https://i.pravatar.cc/150?img=${i + 20}`}
                      width={36}
                      height={36}
                      alt="agency"
                      className="rounded-full border-2 border-[#2A1885]"
                    />
                  ))}
                </div>

                <div className="ml-3 bg-[#2A1885] text-xs px-3 py-1 rounded-full">
                  +2k
                </div>
              </div>
            </div>

            {/* Trust Score Card */}
            <div className="bg-black/80 border border-white/10 p-5 rounded-2xl w-[300px] flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">
                  Your Trust Score
                </p>

                <div className="flex items-end gap-2 mt-1">
                  <span className="text-2xl font-bold">840</span>
                  <span className="text-green-400 text-xs font-semibold">
                    +12%
                  </span>
                </div>
              </div>

              {/* Circle indicator */}
              <div className="w-14 h-14 rounded-full border-4 border-indigo-500 flex items-center justify-center text-xs font-bold">
                HIGH
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandHero;
