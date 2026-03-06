import React from "react";
import Image from "next/image";

// Locations from the image
const locations = [
  { id: 1, name: "Mumbai" },
  { id: 2, name: "Delhi" },
  { id: 3, name: "Bangalore" },
  { id: 4, name: "Chennai" },
];

export const CreatorsByLocation = () => {
  return (
    <section className="w-full px-6 py-8 bg-white mt-8 mb-10">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#1C115A]">
          Creators by Location
        </h2>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4">
        {locations.map((location) => (
          <div
            key={location.id}
            className="group relative h-32 rounded-3xl overflow-hidden cursor-pointer shadow-md transition-all hover:shadow-lg hover:-translate-y-1"
          >
            {/* Grayscale Skyline Placeholder */}
            <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
              <span className="text-4xl opacity-20 group-hover:opacity-40 transition-opacity">
                🏙️
              </span>
            </div>

            {/* Dark Overlay for Text Contrast */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />

            {/* Centered White Text */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <h3 className="text-white text-lg font-black tracking-tight uppercase">
                {location.name}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
