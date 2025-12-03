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

  // Auto slide
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [api]);

  // Sync dots
  useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section className="w-full px-3 py-6">
      <SectionTitle text="CREATORS USING OUR LINK IN BIO" />

      {/* Wrapper with arrows */}
      <div className="relative w-full mt-8">
        <button
          onClick={() => api?.scrollPrev()}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-md p-2 rounded-full z-20 hover:scale-105"
        >
          <FaChevronLeft size={18} />
        </button>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent className="gap-4 px-1">
            {creators.map((creator, index) => (
              <CarouselItem
                key={index}
                className="basis-[88%] sm:basis-[48%] md:basis-[32%] lg:basis-[24%]"
              >
                <CreatorCard {...creator} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <button
          onClick={() => api?.scrollNext()}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-md p-2 rounded-full z-20 hover:scale-105"
        >
          <FaChevronRight size={18} />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center mt-4 gap-2">
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
