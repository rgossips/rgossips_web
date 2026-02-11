import React from "react";
import { Star } from "lucide-react";

const influencerData = [
  {
    id: 1,
    name: "Wade Warren",
    role: "Beautician",
    rating: 4.9,
    image: "https://i.pravatar.cc/150?u=wade",
  },
  {
    id: 2,
    name: "Juan Hamill",
    role: "Nail Artist",
    rating: 4.9,
    image: "https://i.pravatar.cc/150?u=juan",
  },
  {
    id: 3,
    name: "Allison Batz",
    role: "Hair Specialist",
    rating: 4.9,
    image: "https://i.pravatar.cc/150?u=allison",
  },
];

const TopRatedInfluencers = () => {
  return (
    <section className="w-full py-6 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center px-6 mb-6">
        <h2 className="text-lg font-bold text-slate-700">
          Top Rated Influencer
        </h2>
        <button className="text-sm font-semibold text-slate-500 hover:text-pink-500 transition-colors">
          Explore more
        </button>
      </div>

      {/* Horizontal Scroll Area */}
      <div className="flex lg:grid grid-cols-5 overflow-x-auto gap-4 py-2 px-6 pb-4 scrollbar-hide snap-x snap-mandatory">
        {influencerData.map((person) => (
          <div
            key={person.id}
            className="flex-none basis-[45%] sm:basis-1/3 snap-start pt-10"
          >
            <div className="relative">
              {/* Profile Image - Positioned to overflow the card top */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md">
                  <img
                    src={person.image}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Influencer Card with Gradient Border Trick */}
              <div className="p-[1.5px] rounded-[24px] bg-gradient-to-b from-[#F6339A] via-[#8E2DE2] to-[#B6F09C]">
                <div className="bg-white rounded-[23px] pt-12 pb-4 px-3 flex flex-col items-center text-center">
                  <p className="text-[10px] text-slate-400 font-bold mb-1">
                    {person.name}
                  </p>
                  <h3 className="text-sm font-black text-slate-900 mb-3">
                    {person.role}
                  </h3>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    <Star
                      size={12}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    <span className="text-[11px] font-black text-slate-700">
                      {person.rating}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopRatedInfluencers;
