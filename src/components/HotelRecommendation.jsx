import React from "react";
import { Star } from "lucide-react";

const hotelData = [
  {
    id: 1,
    name: "Swiss-Belhotel Rainforest Kuta",
    location: "Jl. Sunset Road No. 101, Kuta, Bali, Indonesia",
    type: "4-star hotel",
    price: 50,
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 2,
    name: "Amnaya Resort Kuta",
    location: "Jl. Kartika Plaza, Kuta, Bali, Indonesia",
    type: "5-star hotel",
    price: 85,
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 3,
    name: "The Anvaya Beach Resort",
    location: "Jl. Kartika Plaza, Tuban, Bali, Indonesia",
    type: "5-star hotel",
    price: 120,
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80",
  },
];

const HotelRecommendations = () => {
  return (
    <section className="w-full py-6 px-3 lg:px-8 bg-white">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
          Hotels Recommendation For You
        </h2>
        <button className="text-sm font-bold text-slate-500">See all</button>
      </div>

      {/* Vertical List */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4">
        {hotelData.map((hotel) => (
          <div
            key={hotel.id}
            className="flex items-center gap-4 lg:shadow-lg lg:border-2 bg-white p-2 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50"
          >
            {/* Left: Square/Rounded Image */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <img
                src={hotel.image}
                alt={hotel.name}
                className="w-full h-full object-cover rounded-[20px]"
              />
            </div>

            {/* Right: Content Section */}
            <div className="flex flex-col justify-center flex-1 pr-2">
              <h3 className="text-sm font-black text-slate-900 line-clamp-1">
                {hotel.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">
                {hotel.location}
              </p>

              {/* Rating Row */}
              <div className="flex items-center gap-1 mt-2">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                  {hotel.type}
                </span>
              </div>

              {/* Price Row (Aligned Right as per Image) */}
              <div className="mt-2 text-right">
                <p className="text-xs font-black text-[#F6339A]">
                  $ {hotel.price}
                  <span className="font-bold">/night</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HotelRecommendations;
