import React from "react";
import { Star } from "lucide-react";

const servicesData = [
  {
    id: 1,
    name: "Miss Zachary Will",
    role: "Beautician",
    rating: 4.9,
    bgImage:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
    profilePic: "https://i.pravatar.cc/150?u=zachary",
  },
  {
    id: 2,
    name: "Miss Zachary Will",
    role: "Beautician",
    rating: 4.9,
    bgImage:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
    profilePic: "https://i.pravatar.cc/150?u=will",
  },
  {
    id: 3,
    name: "Miss Zachary Will",
    role: "Beautician",
    rating: 4.9,
    bgImage:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
    profilePic: "https://i.pravatar.cc/150?u=zachary",
  },
  {
    id: 4,
    name: "Miss Zachary Will",
    role: "Beautician",
    rating: 4.9,
    bgImage:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
    profilePic: "https://i.pravatar.cc/150?u=will",
  },
];

const TopServices = () => {
  return (
    <section className="w-full py-6 px-6 bg-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-black text-[#334155]">Top Services</h2>
        <button className="text-xs font-bold text-slate-400 underline">
          View All
        </button>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10">
        {servicesData.map((service) => (
          <div
            key={service.id}
            className="relative w-full h-52 lg:h-40 lg:bg-white lg:rounded-[32px] lg:shadow-md lg:flex lg:items-center lg:gap-6 lg:p-4 lg:border lg:border-slate-50"
          >
            {/* Mobile: Floating Card over BG */}
            <div className="block lg:hidden w-[85%] h-full rounded-[32px] overflow-hidden shadow-md">
              <img
                src={service.bgImage}
                className="w-full h-full object-cover"
                alt="service bg"
              />
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[60%] bg-white rounded-[24px] shadow-xl p-4 border border-slate-50 block lg:hidden">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={service.profilePic}
                  className="w-10 h-10 rounded-full object-cover"
                  alt="profile"
                />
                <div>
                  <h4 className="text-[11px] font-black text-slate-900 leading-tight">
                    {service.name}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-bold">
                    {service.role}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-1">
                  <Star size={10} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-[10px] font-black text-slate-700">
                    {service.rating}
                  </span>
                </div>
                <button className="bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-[10px] font-black px-5 py-1.5 rounded-full">
                  Apply
                </button>
              </div>
            </div>
            {/* Laptop: Unified Card Layout */}
            <>
              <div className="hidden lg:block h-28 w-28 rounded-2xl overflow-hidden flex-shrink-0">
                <img
                  src={service.bgImage}
                  className="w-full h-full object-cover"
                  alt="service bg"
                />
              </div>
              <div className="hidden lg:flex flex-1 items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <img
                    src={service.profilePic}
                    className="w-12 h-12 rounded-full object-cover"
                    alt="profile"
                  />
                  <div>
                    <h4 className="text-base font-black text-slate-900 leading-tight">
                      {service.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-bold">
                      {service.role}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                      Delicious meat at aminim price Veniam deserunt sunt
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 min-w-[90px]">
                  <div className="flex items-center gap-1">
                    <Star
                      size={14}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    <span className="text-xs font-black text-slate-700">
                      {service.rating}
                    </span>
                  </div>
                  <button className="bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-xs font-black px-6 py-2 rounded-full">
                    Apply
                  </button>
                </div>
              </div>
            </>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopServices;
