"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { FaInstagram, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import SectionTitle from "./SectionTitle";
import { useEffect, useRef } from "react";

const experiences = [
  {
    video: "https://www.pexels.com/download/video/9401757/",
    title: "Luxury Resort Stay",
    price: 2000,
    instaFollowers: "12k",
    brand: {
      logo: "https://images.pexels.com/photos/4050298/pexels-photo-4050298.jpeg?auto=compress",
      name: "LuxuryStay",
      location: "Bali, Indonesia",
    },
  },
  {
    video: "https://www.pexels.com/download/video/8941267/",
    title: "Gourmet Fine Dining",
    price: 1500,
    instaFollowers: "8k",
    brand: {
      logo: "https://images.pexels.com/photos/4050298/pexels-photo-4050298.jpeg?auto=compress",
      name: "GourmetPlace",
      location: "Paris, France",
    },
  },
  {
    video: "https://www.pexels.com/download/video/9401757/",
    title: "Spa & Wellness",
    price: 1800,
    instaFollowers: "20k",
    brand: {
      logo: "https://images.pexels.com/photos/4050298/pexels-photo-4050298.jpeg?auto=compress",
      name: "RelaxSpa",
      location: "Tokyo, Japan",
    },
  },
  {
    video: "https://www.pexels.com/download/video/9401757/",
    title: "Luxury Resort Stay",
    price: 2000,
    instaFollowers: "12k",
    brand: {
      logo: "https://images.pexels.com/photos/4050298/pexels-photo-4050298.jpeg?auto=compress",
      name: "LuxuryStay",
      location: "Bali, Indonesia",
    },
  },
  {
    video: "https://www.pexels.com/download/video/8941267/",
    title: "Gourmet Fine Dining",
    price: 1500,
    instaFollowers: "8k",
    brand: {
      logo: "https://images.pexels.com/photos/4050298/pexels-photo-4050298.jpeg?auto=compress",
      name: "GourmetPlace",
      location: "Paris, France",
    },
  },
  {
    video: "https://www.pexels.com/download/video/9401757/",
    title: "Spa & Wellness",
    price: 1800,
    instaFollowers: "20k",
    brand: {
      logo: "https://images.pexels.com/photos/4050298/pexels-photo-4050298.jpeg?auto=compress",
      name: "RelaxSpa",
      location: "Tokyo, Japan",
    },
  },
  {
    video: "https://www.pexels.com/download/video/9401757/",
    title: "Luxury Resort Stay",
    price: 2000,
    instaFollowers: "12k",
    brand: {
      logo: "https://images.pexels.com/photos/4050298/pexels-photo-4050298.jpeg?auto=compress",
      name: "LuxuryStay",
      location: "Bali, Indonesia",
    },
  },
  {
    video: "https://www.pexels.com/download/video/8941267/",
    title: "Gourmet Fine Dining",
    price: 1500,
    instaFollowers: "8k",
    brand: {
      logo: "https://images.pexels.com/photos/4050298/pexels-photo-4050298.jpeg?auto=compress",
      name: "GourmetPlace",
      location: "Paris, France",
    },
  },
  {
    video: "https://www.pexels.com/download/video/9401757/",
    title: "Spa & Wellness",
    price: 1800,
    instaFollowers: "20k",
    brand: {
      logo: "https://images.pexels.com/photos/4050298/pexels-photo-4050298.jpeg?auto=compress",
      name: "RelaxSpa",
      location: "Tokyo, Japan",
    },
  },
];

export default function TopExperienceCarousel() {
  const carouselWrapperRef = useRef(null);

  // Auto-scroll every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselWrapperRef.current) {
        const nextButton = carouselWrapperRef.current.querySelector(
          "[data-carousel-next]"
        );
        nextButton?.click();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full px-4">
      <SectionTitle text="Top Experiences" />

      <div ref={carouselWrapperRef} className="relative w-full">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full relative"
        >
          <CarouselContent className="">
            {experiences.map((item, i) => (
              <CarouselItem
                key={i}
                className="basis-[88%] sm:basis-1/2 md:basis-1/3"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[16/9]">
                  <video
                    src={item.video}
                    autoPlay
                    muted
                    loop
                    className="w-full h-full object-cover"
                  />

                  {/* Price Card */}
                  <div
                    className="flex lg:flex-col absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-md
  text-center  
  px-2 py-1 
  gap-1
  flex-wrap
  max-w-[150px] sm:max-w-none
"
                  >
                    <span className="flex bg-blue-800 rounded-lg text-[10px] sm:text-xs font-semibold text-white px-2 py-1 w-fit">
                      Free till:
                    </span>
                    <span className="flex items-center justify-center w-fit text-[11px] sm:text-sm font-bold text-gray-800">
                      {item.price} Rs
                    </span>
                  </div>

                  {/* Brand Info */}
                  <div className="absolute bottom-3 left-3 text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <FaInstagram size={20} className="text-pink-500" />
                      <span className="text-sm sm:text-base font-semibold">
                        {item.instaFollowers} followers
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <Image
                        width={300}
                        height={200}
                        src={item.brand.logo}
                        alt={item.brand.name}
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                      />
                      <span className="text-sm sm:text-base font-bold">
                        {item.brand.name}
                      </span>
                    </div>

                    <span className="text-[10px] sm:text-xs">
                      {item.brand.location}
                    </span>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Custom Left Arrow */}
          <CarouselPrevious
            className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg z-10"
            data-carousel-prev
          >
            <FaChevronLeft className="text-gray-700 w-5 h-5" />
          </CarouselPrevious>

          {/* Custom Right Arrow */}
          <CarouselNext
            className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg z-10"
            data-carousel-next
          >
            <FaChevronRight className="text-gray-700 w-5 h-5" />
          </CarouselNext>
        </Carousel>
      </div>
    </section>
  );
}
