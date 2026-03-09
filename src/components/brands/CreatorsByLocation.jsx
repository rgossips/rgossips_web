import Image from "next/image";
import React from "react";

// Optimized mock data using Unsplash Image API
const locations = [
  {
    id: 1,
    name: "Mumbai",
    image:
      "https://images.unsplash.com/photo-1598434192043-71111c1b3f41?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    attribution: "Ahmad syahrir",
  },
  {
    id: 2,
    name: "Delhi",
    image:
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=600&auto=format&fit=crop",
    attribution: "Brijeshwar Singh",
  },
  {
    id: 3,
    name: "Bangalore",
    image:
      "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=600&auto=format&fit=crop",
    attribution: "Mukul Jaiswal",
  },
  {
    id: 4,
    name: "Chennai",
    image:
      "https://images.unsplash.com/photo-1679214803434-af50c2c92009?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    attribution: "Naman Jaswani",
  },
];

export const CreatorsByLocation = () => {
  return (
    <section className="w-full px-4 md:px-6 py-8 bg-white mt-8 mb-10 overflow-hidden">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#1C115A]">
          Creators by Location
        </h2>
        <p className="text-slate-500 text-sm">
          Discovery local talent right now
        </p>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4">
        {locations.map((location) => (
          <div
            key={location.id}
            className="group relative h-32 rounded-3xl overflow-hidden cursor-pointer shadow-md transition-all hover:shadow-lg active:scale-95"
          >
            {/* Iconic Background Image */}
            <Image
              width={200}
              height={200}
              src={location.image}
              alt={`${location.name} Skyline`}
              className="absolute inset-0 w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 ease-in-out"
            />

            {/* Subtle Gradient Overlay for Text Contrast */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent z-0 group-hover:from-black/80 transition-all duration-300" />

            {/* Centered White Text */}
            <div className="absolute inset-0 flex items-center justify-center z-10 px-2 text-center">
              <h3 className="text-white text-base md:text-lg font-black tracking-tight uppercase group-hover:scale-110 transition-transform duration-300">
                {location.name}
              </h3>
            </div>

            {/* Optional: Simple attribution link if required by license */}
            {/* <span className="absolute bottom-1 right-2 text-[6px] text-white/50 z-20">Photo: {location.attribution}</span> */}
          </div>
        ))}
      </div>
    </section>
  );
};
