"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

const stories = [
  {
    id: 1,
    title: "THE AZURE GLASS...",
    subtitle: "Resort Experience",
    image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&h=600&fit=crop",
    creator: "Priya M.",
  },
  {
    id: 2,
    title: "Urban Night Life",
    subtitle: "City Adventures",
    image:
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=600&fit=crop",
    creator: "Rahul K.",
  },
  {
    id: 3,
    title: "Golden Hour Magic",
    subtitle: "Travel Diaries",
    image:
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&h=600&fit=crop",
    creator: "Anita S.",
  },
  {
    id: 4,
    title: "Mountain Retreat",
    subtitle: "Wellness Journey",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=600&fit=crop",
    creator: "Dev P.",
  },
  {
    id: 5,
    title: "Coastal Vibes",
    subtitle: "Beach Life",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=600&fit=crop",
    creator: "Meera R.",
  },
];

export default function TopCreatorStories() {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = dir === "left" ? -320 : 320;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className="w-full lg:max-w-[1480px] lg:mx-auto px-4 lg:px-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Top Creator Stories
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspiring content from top creators
          </p>
        </div>
        <div className="hidden lg:flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight size={16} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Stories Row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {stories.map((story) => (
          <div
            key={story.id}
            className="min-w-[200px] lg:min-w-60 shrink-0 snap-start relative rounded-2xl overflow-hidden aspect-3/4 cursor-pointer group"
          >
            {/* Background Image */}
            <Image
              src={story.image}
              alt={story.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play size={20} className="text-white ml-0.5" fill="white" />
              </div>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold text-sm leading-tight mb-1">
                {story.title}
              </h3>
              <p className="text-white/70 text-xs">{story.creator}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
