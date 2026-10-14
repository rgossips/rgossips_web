"use client";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
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
      {/* Header. The eight tiles are a shortcut into a handful of metros —
          "See more" is the way out to the full creator list for anyone whose
          city is not one of them. Same shape and destination as the View All
          on Creator Categories, so the two sections behave alike. */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="bx-h2">
            Creators by Location
          </h2>
          <p className="text-[#6B6785] text-sm">
            Discover local talent right now
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/brands/search")}
          className="shrink-0 text-sm font-bold text-[#6A66C9] flex items-center gap-1 hover:opacity-70 cursor-pointer"
        >
          See more <ChevronRight size={14} />
        </button>
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

            {/* Scrim for text contrast.
                This used to be a bottom-half gradient (`bottom-0 h-1/2`)
                while the label is vertically CENTRED — so the text sat in
                the one band of the card that was never darkened. Over a pale
                photo (Chennai, Kolkata, Pune) white-on-white was unreadable.
                A full-card wash now sits under the label, with the bottom
                gradient kept for depth. */}
            <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-colors duration-300 z-0" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent z-0 transition-all duration-300" />

            {/* Centered White Text */}
            <div className="absolute inset-0 flex items-center justify-center z-10 px-2 text-center">
              <h3
                className="text-white text-base md:text-lg font-black tracking-tight uppercase group-hover:scale-110 transition-transform duration-300"
                /* Belt and braces: the wash handles the usual case, the
                   shadow covers a photo that is bright right behind the
                   glyphs. */
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.65)" }}
              >
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
