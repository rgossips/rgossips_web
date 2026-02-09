import React from "react";
import { Star } from "lucide-react";

const journeyData = [
  {
    id: 1,
    title: "Mount Bromo",
    location: "Volcano in East Java",
    rating: 4.9,
    price: 150,
    duration: "3D2N",
    // Scenic volcano image
    image:
      "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    title: "Labengki Sombori",
    location: "Islands in Sulawesi",
    rating: 4.8,
    price: 250,
    duration: "3D2N",
    // Tropical island/lagoon image
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    title: "Sailing Komodo",
    location: "Labuan Bajo",
    rating: 4.8,
    price: 200,
    duration: "3D2N",
    // Sailing/boat/ocean view image
    image:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    title: "Ubud Sanctuary",
    location: "Bali, Indonesia",
    rating: 4.7,
    price: 320,
    duration: "4D3N",
    // Jungle/Resort image
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
  },
];

const JourneyCarousel = () => {
  return (
    <section className="w-full py-6 bg-white">
      {/* Header Area */}
      <div className="flex justify-between items-center px-6 mb-4">
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
          Journey Together
        </h2>
        <button className="text-sm font-bold text-slate-800 hover:opacity-80 transition-all">
          See all
        </button>
      </div>

      {/* Scrollable Container */}
      <div className="flex overflow-x-auto gap-4 px-6 pb-6 scrollbar-hide snap-x snap-mandatory">
        {journeyData.map((item) => (
          <div
            key={item.id}
            className="flex-none basis-[80%] sm:basis-1/2 lg:basis-1/3 snap-start"
          >
            <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col h-full active:scale-[0.98] transition-transform">
              {/* Image Section */}
              <div className="relative w-full h-48">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content Section */}
              <div className="p-5 flex flex-col gap-1">
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">
                  {item.location}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mt-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-black text-slate-700">
                    {item.rating}
                  </span>
                </div>

                {/* Footer: Price and Duration */}
                <div className="flex justify-between items-end mt-5">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                      Start from
                    </p>
                    <p className="text-lg font-black text-slate-900">
                      $ {item.price}
                      <span className="text-[10px] font-bold text-slate-400">
                        /pax
                      </span>
                    </p>
                  </div>

                  {/* Duration Badge with Gradient */}
                  <div className="bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-[10px] font-black px-5 py-2 rounded-full shadow-lg shadow-pink-100">
                    {item.duration}
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

export default JourneyCarousel;
