"use client";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";
import mumbai from "@/assets/states/mumbai.jpg";
import banglore from "@/assets/states/banglore.jpg";
import chennai from "@/assets/states/chennai.jpg";
import gurgaon from "@/assets/states/gurgaon.png";
import hyderabad from "@/assets/states/hyderabad.jpg";
import kolkata from "@/assets/states/kolkata.png";
import delhi from "@/assets/states/delhi.jpg";
import pune from "@/assets/states/pune.png";

// Optimized mock data using Unsplash Image API
const locations = [
  {
    id: 3,
    name: "Bangalore",
    image: banglore,
    attribution: "Mukul Jaiswal",
  },
  {
    id: 4,
    name: "Chennai",
    image: chennai,
    attribution: "Naman Jaswani",
  },
  {
    id: 2,
    name: "Delhi",
    image: delhi,
    attribution: "Brijeshwar Singh",
  },
  {
    id: 8,
    name: "Gurgaon",
    image: gurgaon,
    attribution: "Naman Jaswani",
  },
  {
    id: 5,
    name: "Hyderabad",
    image: hyderabad,
    attribution: "Ahmad syahrir",
  },
  {
    id: 6,
    name: "Kolkata",
    image: kolkata,
    attribution: "Brijeshwar Singh",
  },
  {
    id: 1,
    name: "Mumbai",
    image: mumbai,
    attribution: "Ahmad syahrir",
  },
  {
    id: 7,
    name: "Pune",
    image: pune,
    attribution: "Mukul Jaiswal",
  },
];

export const CreatorsByLocation = () => {
  const router = useRouter();
  return (
    <section className="w-full px-4 md:px-6 py-8 bg-white mt-8 mb-10 overflow-hidden">
      <div className="mb-6">
        <h2 className="bx-h2">
          Creators by Location
        </h2>
        <p className="text-[#6B6785] text-sm">
          Discover local talent right now
        </p>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 grid-rows-2 gap-4">
        {locations.map((location) => (
          <button
            key={location.id}
            onClick={() => router.push(`/brands/search?city=${encodeURIComponent(location.name)}`)}
            className="group relative h-36 rounded-3xl overflow-hidden cursor-pointer shadow-md transition-all hover:shadow-lg active:scale-95 text-left"
            type="button"
          >
            {/* Iconic Background Image */}
            <Image
              width={200}
              height={200}
              src={location.image}
              alt={`${location.name} Skyline`}
              className="absolute inset-0 w-full h-full object-cover grayscale-25 opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 ease-in-out"
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
          </button>
        ))}
      </div>
    </section>
  );
};
