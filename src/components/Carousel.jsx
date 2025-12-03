"use client";

import * as React from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import one from "@/assets/influencers/1.jpg";
import two from "@/assets/influencers/2.jpg";
import three from "@/assets/influencers/3.jpg";
import four from "@/assets/influencers/4.jpg";

export default function HomeCarousel() {
  const slides = [one, two, three, four];
  const [current, setCurrent] = React.useState(0);
  const total = slides.length;

  // Auto-slide every 5 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(timer);
  }, [total]);

  // Manual navigation
  const nextSlide = () => setCurrent((prev) => (prev + 1) % total);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + total) % total);

  return (
    <section className="relative w-full h-[90vh] lg:h-[93vh] overflow-hidden">
      <Carousel className="w-full h-[90vh] lg:h-[93vh]">
        <CarouselContent
          className="h-[90vh] lg:h-[93vh] transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(-${current * 100}%)`,
            display: "flex",
          }}
        >
          {slides.map((src, index) => (
            <CarouselItem
              key={index}
              className="h-full w-full relative shrink-0"
            >
              <Image
                src={src}
                alt={`Slide ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Custom navigation arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-8 lg:left-20 cursor-pointer top-1/2 -translate-y-1/2 z-20 p-4 text-white hover:text-gray-200 transition-all"
        >
          <ChevronLeft className="w-12 lg:w-16 h-12  lg:h-16 drop-shadow-lg" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-8 lg:right-20 cursor-pointer top-1/2 -translate-y-1/2 z-20 p-4 text-white hover:text-gray-200 transition-all"
        >
          <ChevronRight className="w-12 lg:w-16 h-12  lg:h-16 drop-shadow-lg" />
        </button>
      </Carousel>

      {/* Optional overlay for gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
    </section>
  );
}
