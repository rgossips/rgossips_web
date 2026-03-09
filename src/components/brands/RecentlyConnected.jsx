import React from "react";
import { UserPlus } from "lucide-react";

// Updated mock data with specific influencer profiles
const recentlyConnected = [
  {
    id: 1,
    name: "Alex Rivera",
    platform: "Instagram",
    image: "https://i.pravatar.cc/150?u=alex",
  },
  {
    id: 2,
    name: "Sarah Chen",
    platform: "YouTube",
    image: "https://i.pravatar.cc/150?u=sarah",
  },
  {
    id: 3,
    name: "Jordan Smith",
    platform: "TikTok",
    image: "https://i.pravatar.cc/150?u=jordan",
  },
  {
    id: 4,
    name: "Mika Tanaka",
    platform: "Twitter",
    image: "https://i.pravatar.cc/150?u=mika",
  },
  {
    id: 5,
    name: "Elena Gomez",
    platform: "Instagram",
    image: "https://i.pravatar.cc/150?u=elena",
  },
  {
    id: 6,
    name: "David Park",
    platform: "TikTok",
    image: "https://i.pravatar.cc/150?u=david",
  },
];

export const RecentlyConnected = () => {
  return (
    <section className="w-full px-4 lg:px-6 overflow-hidden">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#1C115A]">
          Influencers Recently Connected
        </h2>
        <p className="text-slate-500 text-sm">
          Direct connects happening right now
        </p>
      </div>

      {/* Added 'max-w-full' and 'relative' to ensure the scroll 
          area doesn't push the parent container's width.
      */}
      <div className="relative w-full">
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory touch-pan-x">
          {recentlyConnected.map((influencer) => (
            <div
              key={influencer.id}
              className="flex-none basis-[160px] md:basis-[180px] snap-start bg-white border border-slate-100 rounded-3xl p-5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Circular Image Container */}
              <div className="relative w-20 h-20 mb-4 group">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#5B3DF5] to-[#FF4E8E] p-[2px]">
                  <div className="bg-white rounded-full p-[2px] h-full w-full">
                    <img
                      src={influencer.image}
                      alt={influencer.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-[#1C115A] text-sm mb-1 truncate w-full px-1">
                {influencer.name}
              </h3>
              <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-4">
                {influencer.platform}
              </p>

              <button className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 text-[#1C115A] text-xs font-bold hover:bg-[#5B3DF5] hover:text-white transition-all active:scale-95">
                <UserPlus size={14} />
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
