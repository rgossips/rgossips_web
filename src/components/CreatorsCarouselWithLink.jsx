"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import Image from "next/image";
import SectionTitle from "./SectionTitle";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import CreatorCard from "./CreatorCard"; // <-- IMPORT YOUR CARD

export default function CreatorsCarouselWithLink() {
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);

  const creators = [
    {
      name: "tm.twins",
      verified: true,
      image:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress",
      posts: "159",
      followers: "1.3 M",
      following: "959",
      bio: "Mass Media Arts Majors @cau1988",
      link: "https://mywall.me/tm.twins",
    },
    {
      name: "realgreatstyles",
      verified: true,
      image:
        "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress",
      posts: "314",
      followers: "1 M",
      following: "—",
      bio: "GREATEST STYLES EVER LIVED",
      link: "https://mywall.me/realstyles",
    },
    {
      name: "urban.chic",
      verified: false,
      image:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress",
      posts: "98",
      followers: "540 K",
      following: "321",
      bio: "Streetwear | Fashion | Lifestyle",
      link: "https://mywall.me/urbanchic",
    },
    {
      name: "wander.with.me",
      verified: true,
      image:
        "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress",
      posts: "410",
      followers: "2.1 M",
      following: "1,201",
      bio: "Travel addict. Capturing moments worldwide ✈️",
      link: "https://mywall.me/wanderer",
    },
    {
      name: "fitflexguru",
      verified: false,
      image:
        "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress",
      posts: "205",
      followers: "890 K",
      following: "450",
      bio: "Fitness | Nutrition | Daily Workouts 💪",
      link: "https://mywall.me/fitflex",
    },
  ];

  // Auto slide (mobile/tablet only)
  useEffect(() => {
    if (!api) return;
    if (window.innerWidth >= 1024) return; // skip on laptop
    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [api]);

  // Sync dots (mobile/tablet only)
  useEffect(() => {
    if (!api) return;
    if (window.innerWidth >= 1024) return;
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section className="w-full px-3 py-6">
      <SectionTitle text="OUR TOP CREATOR" />
      {/* Desktop: 4 cards in a row, no scroll/arrows/dots */}
      <div className="hidden lg:flex justify-center gap-8 mt-8">
        {creators.slice(0, 4).map((creator, i) => (
          <div key={i} className="flex-1 max-w-xs">
            <CreatorCard {...creator} />
          </div>
        ))}
      </div>
      {/* Mobile/Tablet: Carousel with arrows/dots */}
      <div className="w-full mt-8 lg:hidden flex justify-center items-center gap-2 relative">
        <button
          onClick={() => api?.scrollPrev()}
          className="bg-white shadow-md p-2 rounded-full z-20 hover:scale-105"
          style={{ position: "relative" }}
        >
          <FaChevronLeft size={18} />
        </button>
        <div className="flex-1 flex justify-center">
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            setApi={setApi}
            className="w-full max-w-xs"
          >
            <CarouselContent className="gap-4 px-1">
              {creators.map((creator, index) => (
                <CarouselItem
                  key={index}
                  className="basis-full flex justify-center"
                >
                  <CreatorCard {...creator} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
        <button
          onClick={() => api?.scrollNext()}
          className="bg-white shadow-md p-2 rounded-full z-20 hover:scale-105"
          style={{ position: "relative" }}
        >
          <FaChevronRight size={18} />
        </button>
      </div>
      {/* Dots (mobile/tablet only) */}
      <div className="flex justify-center mt-4 gap-2 lg:hidden">
        {creators.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              current === i ? "bg-purple-600 w-4" : "bg-gray-300 w-2"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
