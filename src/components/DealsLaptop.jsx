"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { FaInstagram } from "react-icons/fa";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";
import { useRouter } from "next/navigation";

const DUMMY_STAYS = [
  {
    id: "stay-1",
    displayTitle: "The Azure Glass Resort",
    location: "Maldives, Indian Ocean",
    imageUrl:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800",
    brand: { instagramFollowers: "120K" },
  },
  {
    id: "stay-2",
    displayTitle: "Urban Oasis Suites",
    location: "Downtown Tokyo, Japan",
    imageUrl:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800",
    brand: { instagramFollowers: "45K" },
  },
  {
    id: "stay-3",
    displayTitle: "Alpine Heritage Lodge",
    location: "Zermatt, Switzerland",
    imageUrl:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800",
    brand: { instagramFollowers: "88K" },
  },
  {
    id: "stay-4",
    displayTitle: "Terrace Palms Boutique",
    location: "Marrakech, Morocco",
    imageUrl:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=800",
    brand: { instagramFollowers: "250K" },
  },
];

const DealsLaptop = () => {
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    if (!api || isHovered) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [api, isHovered]);

  return (
    <section className="w-full max-w-[1400px] px-4 py-16 flex flex-col items-center overflow-hidden">
      <div
        className="w-full flex justify-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative w-full overflow-visible">
          <Carousel
            opts={{ align: "center", loop: true }}
            setApi={setApi}
            className="w-full"
          >
            {/* Using a negative margin on CarouselContent to "squish" the items together for overlap */}
            <CarouselContent className="-ml-4 md:-ml-8 overflow-visible">
              {DUMMY_STAYS.map((stay, i) => {
                const isActive = current === i;
                const isEdgeCase =
                  (current === 0 && i === DUMMY_STAYS.length - 1) ||
                  (current === DUMMY_STAYS.length - 1 && i === 0);

                return (
                  <CarouselItem
                    key={stay.id}
                    // Adjusted basis and used padding/negative margin for overlapping
                    className="basis-[85%] md:basis-[65%] lg:basis-[65%] transition-all duration-500 overflow-visible"
                    style={{
                      // Crucial: Active card must have higher z-index than siblings
                      zIndex: isActive ? 50 : 10,
                      marginRight:
                        i === DUMMY_STAYS.length - 1 ? "-250px" : "0",
                    }}
                  >
                    <div
                      onClick={() => router.push(`/offers/${stay.id}`)}
                      className={`relative w-full rounded-[40px] bg-white border cursor-pointer transition-all duration-700 ease-in-out
                        ${isActive ? "shadow-2xl opacity-100" : "shadow-md opacity-40"}
                      `}
                      style={{
                        // Scale down non-active cards to create the "shorter" look seen in the image
                        transform: isActive ? "scale(1)" : "scale(0.85)",
                        // Shift side cards slightly closer to the center card for overlap
                        marginLeft: isActive
                          ? "0"
                          : i < current
                            ? "15%"
                            : "-15%",
                        marginRight: isActive
                          ? "0"
                          : i > current
                            ? "15%"
                            : "-15%",
                      }}
                    >
                      {/* Image Container */}
                      <div className="relative w-full h-[400px] overflow-hidden rounded-2xl">
                        <Image
                          src={stay.imageUrl}
                          alt={stay.displayTitle}
                          fill
                          className="object-cover"
                        />

                        <div className="absolute top-6 left-6 bg-white/20 backdrop-blur-md border border-white/30 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                          Deal Of The Day
                        </div>

                        <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md border border-white/50 px-4 py-2 rounded-full text-xs font-black text-slate-800 shadow-xl">
                          06:31: <span className="text-[#E60076]">12</span>
                        </div>
                        <div className="absolute bottom-6 left-8">
                          {/* Reference image "Apply Now" style */}
                          <button className="bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white cursor-pointer text-xs uppercase tracking-[0.2em] font-black px-8 py-4 rounded-2xl shadow-lg hover:brightness-110 transition-all">
                            Apply Now
                          </button>
                        </div>
                      </div>

                      {/* Card Bottom Content */}
                      {/* <div className="p-6 md:p-8">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg md:text-2xl font-black text-slate-800 uppercase tracking-tight">
                              {stay.displayTitle}
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">
                              {stay.location}
                            </p>
                          </div>

                         
                        </div>

                        <div className="flex items-center gap-2 mt-6 text-slate-400 text-sm">
                          <FaInstagram className="text-[#F6339A]" size={16} />
                          <span className="font-bold text-slate-600">
                            {stay.brand.instagramFollowers} Followers
                          </span>
                        </div>
                      </div> */}
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center mt-12 gap-3">
        {DUMMY_STAYS.map((_, i) => (
          <button
            key={i}
            onClick={() => api?.scrollTo(i)}
            className={`h-2 rounded-full transition-all duration-500 ${
              current === i ? "bg-[#F6339A] w-12" : "bg-slate-200 w-2"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default DealsLaptop;
