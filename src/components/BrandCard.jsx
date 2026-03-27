import { Star, Users, Zap } from "lucide-react";
import Image from "next/image";

const BrandCard = ({ brand, matchScore }) => {
  const scoreColor =
    matchScore >= 80 ? "text-emerald-500 bg-emerald-50" :
    matchScore >= 60 ? "text-amber-500 bg-amber-50" :
    "text-slate-400 bg-slate-50";

  return (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 hover:shadow-lg hover:border-[#E60076]/10 transition-all relative group cursor-pointer">
      {matchScore > 0 && (
        <div className={`absolute top-6 right-6 z-10 flex items-center gap-1 px-2.5 py-1 rounded-lg ${scoreColor}`}>
          <Zap size={12} />
          <span className="text-[11px] font-black">{matchScore}%</span>
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-[#F8F9FD] overflow-hidden flex items-center justify-center p-4 mb-4 group-hover:scale-105 transition-transform">
          {brand.logo && (
            <Image
              width={200}
              height={200}
              src={brand.logo}
              alt={brand.name}
              className="w-full h-full object-contain mix-blend-multiply"
            />
          )}
        </div>

        {/* Title */}
        <div className="mb-6">
          <h4 className="font-bold text-slate-800 text-lg flex items-center justify-center gap-1">
            {brand.name}
            {brand.isVerified && (
              <svg width="18" height="18" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M19.998 3.094L16.793 0 13.124 2.468 8.608 1.609 7.15 5.978 2.782 7.436 3.641 11.952 1.173 15.621 3.641 19.29 0 22.495l3.094 3.205-2.468 3.669 4.516.858 1.458 4.37 4.369-1.459 3.669 2.468 3.205-3.094 3.205 3.094 3.669-2.468 4.369 1.458 1.458-4.369 4.516-.858-2.468-3.669L40 22.495l-3.094-3.205 2.468-3.669-4.516-.858-1.458-4.37-4.369 1.459-3.669-2.468L22.157 12.49z" fill="#1DA1F2"/>
                <path d="M17.204 27.172l-6.952-6.952 2.828-2.828 4.124 4.124 8.488-8.488 2.828 2.828-11.316 11.316z" fill="white"/>
              </svg>
            )}
          </h4>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {brand.category}
          </p>
        </div>

        {/* Stats List (Stacked Rows) */}
        <div className="w-full space-y-3 mb-6">
          <div className="flex justify-between items-center w-full">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">
              Active Campaigns
            </span>
            <span className="text-sm font-bold text-slate-800">
              {brand.activeCampaigns}
            </span>
          </div>
          <div className="flex justify-between w-full">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">
              Avg Payout
            </span>
            <span className="text-sm font-bold text-[#00BA88]">
              {brand.payout}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <Star className="text-amber-400 fill-amber-400" size={16} />
            <span className="text-xs font-bold text-slate-700">
              {brand.rating}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="text-slate-300" size={16} />
            <span className="text-xs font-bold text-slate-400">
              {brand.followers}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandCard;
