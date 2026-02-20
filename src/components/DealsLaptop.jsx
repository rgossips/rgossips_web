"use client";

import Image from "next/image";
import React, { useEffect, useState, useCallback } from "react";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const DUMMY_STAYS = [
  {
    id: "stay-1",
    imageUrl:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800",
  },
  {
    id: "stay-2",
    imageUrl:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800",
  },
  {
    id: "stay-3",
    imageUrl:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800",
  },
  {
    id: "stay-4",
    imageUrl:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=800",
  },
  {
    id: "stay-5",
    imageUrl:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800",
  },
  {
    id: "stay-6",
    imageUrl:
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=800",
  },
];

export default function DealsLaptop() {
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  // Update current index when Embla scrolls
  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;

    onSelect(); // Set initial index
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  // Auto-play Logic
  useEffect(() => {
    if (!api || isHovered) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3500);

    return () => clearInterval(interval);
  }, [api, isHovered]);

  const getCardStyles = (index) => {
    const total = DUMMY_STAYS.length;
    let diff = index - current;

    // Handle loop math for 3D stack
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    const absDiff = Math.abs(diff);

    // Hide cards far from center
    if (absDiff > 2) return { opacity: 0, scale: 0.8, x: 0, zIndex: 0 };

    return {
      opacity: 1 - absDiff * 0.2,
      scale: 1 - absDiff * 0.15,
      x: diff * 150, // Adjust this for horizontal spread
      zIndex: 50 - absDiff,
    };
  };

  return (
    <section
      className="w-full py-20 overflow-hidden flex flex-col items-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-[1400px] w-full px-10 relative">
        {/* HIDDEN CONTROLLER 
          We use CarouselItem so Embla has 'slides' to calculate 
        */}
        <div className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden">
          <Carousel setApi={setApi} opts={{ loop: true, align: "center" }}>
            <CarouselContent>
              {DUMMY_STAYS.map((stay) => (
                <CarouselItem key={stay.id} className="basis-full">
                  <div className="h-1 w-1" />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* VISUAL STACK */}
        <div className="relative h-[450px] flex items-center justify-center">
          {DUMMY_STAYS.map((stay, i) => {
            const styles = getCardStyles(i);
            const isActive = current === i;

            return (
              <div
                key={stay.id}
                onClick={() => router.push(`/offers/${stay.id}`)}
                className="absolute w-[650px] aspect-[16/10] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer"
                style={{
                  transform: `translateX(${styles.x}px) scale(${styles.scale})`,
                  zIndex: styles.zIndex,
                  opacity: styles.opacity,
                }}
              >
                <div
                  className={`relative w-full h-full rounded-[40px] overflow-hidden transition-all duration-500
                    ${isActive ? "shadow-2xl brightness-100" : "shadow-md brightness-[0.8]"}
                  `}
                >
                  <Image
                    src={stay.imageUrl}
                    alt="deal"
                    fill
                    className="object-cover"
                    priority={isActive}
                  />

                  {/* UI Overlay */}
                  <div
                    className={`absolute inset-0 px-10 py-5 flex flex-col justify-between transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0"}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="bg-white/20 backdrop-blur-md border border-white/30 px-5 py-2 rounded-full text-white font-black text-[14px] uppercase tracking-widest">
                        Deal Of The Day
                      </span>
                      <div className="bg-white px-4 py-2 rounded-full font-black text-slate-900 shadow-lg text-xs">
                        06:31: <span className="text-[#E60076]">12</span>
                      </div>
                    </div>

                    <button className="w-fit bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white font-black px-10 py-4 rounded-2xl shadow-xl uppercase tracking-widest text-[11px]">
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CONTROLS */}
        <div className="flex items-center justify-center mt-12 gap-8">
          <button
            onClick={() => api?.scrollPrev()}
            className="p-3 rounded-full border border-gray-200 text-gray-400 hover:text-pink-500 hover:border-pink-500 transition-all bg-white shadow-sm active:scale-90"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex gap-3">
            {DUMMY_STAYS.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`h-2.5 transition-all duration-500 rounded-full ${
                  current === i ? "bg-[#F6339A] w-14" : "bg-gray-200 w-2.5"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => api?.scrollNext()}
            className="p-3 rounded-full border border-gray-200 text-gray-400 hover:text-pink-500 hover:border-pink-500 transition-all bg-white shadow-sm active:scale-90"
          >
            <ChevronLeft size={24} className="rotate-180" />
          </button>
        </div>
      </div>
    </section>
  );
}
