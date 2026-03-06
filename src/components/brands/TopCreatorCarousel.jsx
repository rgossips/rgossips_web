"use client";

import React from "react";
import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const topCreators = [
  {
    id: 1,
    name: "Rohan Sharma",
    location: "Mumbai",
    followers: "45k",
    rating: 4.9,
    priceRange: "₹2k - 5k",
    image:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&h=300&fit=crop",
  },
  {
    id: 2,
    name: "Ananya Iyer",
    location: "Bangalore",
    followers: "52k",
    rating: 4.8,
    priceRange: "₹3k - 6k",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=300&fit=crop",
  },
  // Add more creators as needed
];

export const TopCreatorsCarousel = () => {
  return (
    <section className="w-full px-4 lg:px-6 bg-white py-8 lg:py-10">
      {/* Header Section */}
      <div className="px-6 mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-[#1C115A]">Top Creators</h2>
          <p className="text-slate-500 font-medium text-sm">
            High impact, low cost
          </p>
        </div>
        <button className="text-[#5B3DF5] font-bold text-sm hover:underline">
          See all
        </button>
      </div>

      {/* Carousel Section */}
      <div className="px-6">
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {topCreators.map((creator) => (
              <CarouselItem
                key={creator.id}
                className="pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3"
              >
                <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden group">
                  {/* Image Container */}
                  <div className="relative h-48 w-full">
                    <Image
                      src={creator.image}
                      alt={creator.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Rating Badge */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                      <Star
                        size={14}
                        className="fill-orange-400 text-orange-400"
                      />
                      <span className="text-xs font-black text-slate-800">
                        {creator.rating}
                      </span>
                    </div>
                  </div>

                  {/* Content Container */}
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-black text-[#1C115A] text-lg leading-tight">
                          {creator.name}
                        </h3>
                        <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                          <MapPin size={12} />
                          <span>
                            {creator.location} • {creator.followers} followers
                          </span>
                        </div>
                      </div>
                      <span className="text-[#5B3DF5] font-black text-sm">
                        {creator.priceRange}
                      </span>
                    </div>

                    {/* Action Button */}
                    <button className="w-full py-3.5 rounded-2xl bg-slate-50 text-[#1C115A] font-black text-sm hover:bg-[#5B3DF5] hover:text-white transition-all duration-300">
                      View Profile
                    </button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};
