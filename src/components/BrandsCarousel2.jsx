"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import SectionTitle from "./SectionTitle";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function BrandsCarousel() {
  const brands = [
    {
      image: "https://images.pexels.com/photos/428340/pexels-photo-428340.jpeg",
      name: "Romeo Lane",
    },
    {
      image: "https://images.pexels.com/photos/775280/pexels-photo-775280.jpeg",
      name: "Centaury Birds Park Gurgaon",
    },
    {
      image:
        "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg",
      name: "Geetanjali Salon",
    },
    {
      image:
        "https://images.pexels.com/photos/3735611/pexels-photo-3735611.jpeg",
      name: "Nomad's Tour and Travels",
    },
    {
      image: "https://images.pexels.com/photos/428340/pexels-photo-428340.jpeg",
      name: "Romeo Lane",
    },
    {
      image: "https://images.pexels.com/photos/775280/pexels-photo-775280.jpeg",
      name: "Centaury Birds Park Gurgaon",
    },
    {
      image:
        "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg",
      name: "Geetanjali Salon",
    },
    {
      image:
        "https://images.pexels.com/photos/3735611/pexels-photo-3735611.jpeg",
      name: "Nomad's Tour and Travels",
    },
    {
      image: "https://images.pexels.com/photos/428340/pexels-photo-428340.jpeg",
      name: "Romeo Lane",
    },
    {
      image: "https://images.pexels.com/photos/775280/pexels-photo-775280.jpeg",
      name: "Centaury Birds Park Gurgaon",
    },
    {
      image:
        "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg",
      name: "Geetanjali Salon",
    },
    {
      image:
        "https://images.pexels.com/photos/3735611/pexels-photo-3735611.jpeg",
      name: "Nomad's Tour and Travels",
    },
    {
      image: "https://images.pexels.com/photos/428340/pexels-photo-428340.jpeg",
      name: "Romeo Lane",
    },
    {
      image: "https://images.pexels.com/photos/775280/pexels-photo-775280.jpeg",
      name: "Centaury Birds Park Gurgaon",
    },
    {
      image:
        "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg",
      name: "Geetanjali Salon",
    },
    {
      image:
        "https://images.pexels.com/photos/3735611/pexels-photo-3735611.jpeg",
      name: "Nomad's Tour and Travels",
    },
  ];

  const [api, setApi] = useState(null);

  // Auto slide
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [api]);

  return (
    <section className="w-full px-3 py-6">
      <SectionTitle text={`BRANDS YOU'LL LOVE`} />

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
            {brands.map((b, index) => (
              <CarouselItem
                key={index}
                className="pl-3 basis-1/2 sm:basis-1/3 md:basis-1/5 lg:basis-1/6"
              >
                <div className="flex flex-col items-center w-full">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-md">
                    <Image
                      src={b.image}
                      alt={b.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <p className="text-sm mt-3 text-center">{b.name}</p>
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
    </section>
  );
}
