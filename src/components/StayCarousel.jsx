"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Image from "next/image";
import { FaInstagram } from "react-icons/fa";
import SectionTitle from "./SectionTitle";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useRouter } from "next/navigation";

const stays = [
  {
    title: "Villa Nautica",
    nights: "2 Nights 3 Days",
    image:
      "https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg?auto=compress",
    location: "Lankanfinolhu, Maldives",
    avgPrice: "₹",
    followers: "100K+",
    priceType: "FREE",
  },
  {
    title: "Geetanjali Salon",
    nights: "1 Day Luxury",
    image:
      "https://images.pexels.com/photos/318236/pexels-photo-318236.jpeg?auto=compress",
    location: "Gurugram, India",
    avgPrice: "₹₹",
    followers: "30K+",
    priceType: "FREE",
  },
  {
    title: "Taj Exotica",
    nights: "3 Nights 4 Days",
    image:
      "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress",
    location: "South Male Atoll",
    avgPrice: "₹₹₹",
    followers: "200K+",
    priceType: "FREE",
  },
  {
    title: "Villa Nautica",
    nights: "2 Nights 3 Days",
    image:
      "https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg?auto=compress",
    location: "Lankanfinolhu, Maldives",
    avgPrice: "₹",
    followers: "100K+",
    priceType: "FREE",
  },
  {
    title: "Geetanjali Salon",
    nights: "1 Day Luxury",
    image:
      "https://images.pexels.com/photos/318236/pexels-photo-318236.jpeg?auto=compress",
    location: "Gurugram, India",
    avgPrice: "₹₹",
    followers: "30K+",
    priceType: "FREE",
  },
  {
    title: "Taj Exotica",
    nights: "3 Nights 4 Days",
    image:
      "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress",
    location: "South Male Atoll",
    avgPrice: "₹₹₹",
    followers: "200K+",
    priceType: "FREE",
  },
  {
    title: "Villa Nautica",
    nights: "2 Nights 3 Days",
    image:
      "https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg?auto=compress",
    location: "Lankanfinolhu, Maldives",
    avgPrice: "₹",
    followers: "100K+",
    priceType: "FREE",
  },
  {
    title: "Geetanjali Salon",
    nights: "1 Day Luxury",
    image:
      "https://images.pexels.com/photos/318236/pexels-photo-318236.jpeg?auto=compress",
    location: "Gurugram, India",
    avgPrice: "₹₹",
    followers: "30K+",
    priceType: "FREE",
  },
  {
    title: "Taj Exotica",
    nights: "3 Nights 4 Days",
    image:
      "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress",
    location: "South Male Atoll",
    avgPrice: "₹₹₹",
    followers: "200K+",
    priceType: "FREE",
  },
];

export default function StayCarousel() {
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);

  // Auto slide
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [api]);

  // Sync current dot
  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const router = useRouter();

  return (
    <section className="w-full px-3 py-6">
      <SectionTitle text={"PLAN YOUR STAY WITH US"} />

      {/* Wrapper with arrows */}
      <div className="relative w-full">
        {/* Left Arrow */}
        <button
          onClick={() => api?.scrollPrev()}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md p-2 rounded-full hover:scale-105"
        >
          <FaChevronLeft size={18} />
        </button>

        {/* Carousel */}
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent className="-ml-3">
            {stays.map((stay, index) => (
              <CarouselItem
                key={index}
                className="pl-3 basis-11/12 sm:basis-1/2 md:basis-1/3 cursor-pointer"
                onClick={() => router.push(`/hotel/${index + 1}`)}
              >
                <div className="rounded-2xl bg-white shadow-sm border overflow-hidden">
                  {/* Image */}
                  <div className="relative w-full h-48 rounded-xl overflow-hidden">
                    <Image
                      src={stay.image}
                      alt={stay.title}
                      fill
                      className="object-cover"
                    />

                    {/* Badge */}
                    <div className="absolute top-3 left-3 bg-white/90 px-3 py-[6px] rounded-full text-sm font-semibold text-purple-600 shadow">
                      ✨ {stay.nights}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {stay.title}
                    </h3>

                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                      <span>📍</span>
                      <span>{stay.location}</span>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-2 text-gray-700 font-medium">
                        <FaInstagram className="text-pink-500" />
                        {stay.followers}
                      </div>

                      <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                        {stay.priceType}
                      </span>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Right Arrow */}
        <button
          onClick={() => api?.scrollNext()}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md p-2 rounded-full hover:scale-105"
        >
          <FaChevronRight size={18} />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center mt-4 gap-2">
        {stays.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-all ${
              current === i ? "bg-purple-600 w-4" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
