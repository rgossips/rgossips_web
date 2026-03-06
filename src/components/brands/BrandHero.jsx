import React from "react";
import Image from "next/image";
import { Plus } from "lucide-react";

const BrandHero = () => {
  return (
    <section className="w-full bg-linear-to-b from-[#1C115A] to-[#3B22B2] px-6 pt-12 pb-16 rounded-b-[40px] md:rounded-b-[60px] text-white">
      <div className="max-w-7xl mx-auto">
        {/* Top Navigation Row */}
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
                Welcome!
              </p>
              <h3 className="text-white font-bold text-sm md:text-base">
                Versace
              </h3>
            </div>
          </div>

          <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md border border-white/20 py-2 px-4 rounded-full text-[10px] md:text-xs font-bold tracking-wide">
            Invite & Earn ₹2500
            <div className="bg-white rounded-full p-0.5">
              <Plus size={14} className="text-[#1C115A]" />
            </div>
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] tracking-tight max-w-2xl">
            Connect with the <br />
            right creators, fast ⚡
          </h1>

          {/* Social Proof / Agencies */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[#2A1885] overflow-hidden"
                >
                  <Image
                    src={`https://i.pravatar.cc/150?img=${i + 10}`}
                    width={32}
                    height={32}
                    alt="Agency"
                  />
                </div>
              ))}
            </div>
            <p className="text-slate-300 text-sm font-semibold">
              2800+ Agencies
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button className="w-full cursor-pointer sm:w-auto px-8 py-4 rounded-3xl border border-white/30 font-bold text-sm hover:bg-white/5 transition-all">
              Browse Creators
            </button>
            <button className="w-full cursor-pointer sm:w-auto px-8 py-4 rounded-3xl bg-[#5B3DF5] shadow-lg shadow-[#5B3DF5]/30 font-bold text-sm hover:brightness-110 transition-all">
              Post Requirement
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandHero;
