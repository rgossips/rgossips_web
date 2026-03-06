import React from "react";
import Image from "next/image";
import { UserPlus } from "lucide-react";

// Mock data for demonstration
const recentlyConnected = [
  { id: 1, name: "Influencer Name", platform: "Instagram" },
  { id: 2, name: "Influencer Name", platform: "YouTube" },
  { id: 3, name: "Influencer Name", platform: "TikTok" },
  { id: 4, name: "Influencer Name", platform: "Twitter" },
  { id: 5, name: "Influencer Name", platform: "Instagram" },
];

export const RecentlyConnected = () => {
  return (
    <section className="w-full px-4 lg:px-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#1C115A]">
          Influencer Recently Connected
        </h2>
        <p className="text-slate-500 text-sm">
          Direct connects happening right now
        </p>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {recentlyConnected.map((influencer) => (
          <div
            key={influencer.id}
            className="flex-none basis-[180px] snap-start bg-white border border-slate-100 rounded-3xl p-5 flex flex-col items-center text-center shadow-sm"
          >
            {/* Placeholder Image */}
            <div className="w-20 h-20 bg-slate-100 rounded-2xl mb-4 flex items-center justify-center">
              <span className="text-2xl">📸</span>
            </div>

            <h3 className="font-bold text-[#1C115A] text-sm mb-1 truncate w-full">
              {influencer.name}
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              on {influencer.platform}
            </p>

            <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-50 text-[#1C115A] text-xs font-bold hover:bg-[#5B3DF5] hover:text-white transition-colors">
              <UserPlus size={14} />
              Connect
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
