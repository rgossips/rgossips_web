import { Banknote, Calendar, Clock, Plus } from "lucide-react";
import Image from "next/image";

export const FeaturedCampaign = () => {
  return (
    <div className="bg-white rounded-4xl p-6 shadow-2xl shadow-purple-100/50 relative border border-purple-50">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBE9FE] text-[#5851DB] rounded-full text-[10px] font-bold uppercase mb-4">
        <Plus size={12} /> Featured Match
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Image
          alt="userImg"
          height={200}
          width={200}
          src="https://i.pravatar.cc/100?u=sanji"
          className="w-12 h-12 rounded-full object-cover border-2 border-green-500 p-0.5"
        />
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-1">
            Sanjivani Tapase <span className="text-blue-500">✓</span>
          </h3>
          <p className="text-[10px] text-gray-400">
            Influencer Marketing Associate @ Thn
          </p>
        </div>
      </div>

      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
        Looking For
      </p>
      <h4 className="font-bold text-gray-900 mb-4 text-sm">
        Photographers & Videographers
      </h4>

      <div className="bg-[#F8F9FE] rounded-2xl p-4 grid grid-cols-2 gap-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg text-gray-400">
            <Calendar size={14} />
          </div>
          <div>
            <p className="text-[8px] text-gray-400 uppercase font-bold">Date</p>
            <p className="text-[10px] font-bold text-gray-900">
              20th March, Friday
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg text-gray-400">
            <Clock size={14} />
          </div>
          <div>
            <p className="text-[8px] text-gray-400 uppercase font-bold">Time</p>
            <p className="text-[10px] font-bold text-gray-900">5 PM</p>
          </div>
        </div>
        <div className="flex items-center gap-3 col-span-2">
          <div className="p-2 bg-white rounded-lg text-blue-500">
            <Banknote size={14} />
          </div>
          <div>
            <p className="text-[8px] text-gray-400 uppercase font-bold">
              Budget
            </p>
            <p className="text-[10px] font-bold text-blue-600">
              INR Under 4,000
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
