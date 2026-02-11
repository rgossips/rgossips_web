"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Image from "next/image";
import tiger from "@/assets/brands/tigerAnalytics.png";
import nik from "@/assets/brands/nikBakers.jpg";
import taj from "@/assets/brands/taj.jpg";
import SectionTitle from "./SectionTitle";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const stories = [
  {
    video: "https://www.pexels.com/download/video/8243345/",
    creator: "@kishushroff",
    creatorImg:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress",
    brandImg: taj,
  },
  {
    video: "https://www.pexels.com/download/video/3699618/",
    creator: "@aassthaa_",
    creatorImg:
      "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress",
    brandImg: nik,
  },
  {
    video:
      "https://videos.pexels.com/video-files/3209828/3209828-hd_1280_720_25fps.mp4",
    creator: "@official_ryan_09",
    creatorImg:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress",
    brandImg: tiger,
  },
  {
    video: "https://www.pexels.com/download/video/8243345/",
    creator: "@kishushroff",
    creatorImg:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress",
    brandImg: taj,
  },
  {
    video: "https://www.pexels.com/download/video/3699618/",
    creator: "@aassthaa_",
    creatorImg:
      "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress",
    brandImg: nik,
  },
  {
    video:
      "https://videos.pexels.com/video-files/3209828/3209828-hd_1280_720_25fps.mp4",
    creator: "@official_ryan_09",
    creatorImg:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress",
    brandImg: tiger,
  },
  {
    video: "https://www.pexels.com/download/video/8243345/",
    creator: "@kishushroff",
    creatorImg:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress",
    brandImg: taj,
  },
  {
    video: "https://www.pexels.com/download/video/3699618/",
    creator: "@aassthaa_",
    creatorImg:
      "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress",
    brandImg: nik,
  },
  {
    video:
      "https://videos.pexels.com/video-files/3209828/3209828-hd_1280_720_25fps.mp4",
    creator: "@official_ryan_09",
    creatorImg:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress",
    brandImg: tiger,
  },
];

export default function CreatorStories() {
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);

  // Auto slide every 3 seconds
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [api]);

  // Update dot index
  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section className="w-full px-3 py-6 lg:px-8">
      {/* Heading */}
      <SectionTitle text={"TOP CREATOR STORIES"} />

      {/* Carousel */}
      {/* Carousel Wrapper with Arrows */}
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
            {stories.map((item, index) => (
              <CarouselItem
                key={index}
                className="pl-3 basis-3/4 sm:basis-1/3 md:basis-1/4"
              >
                <div className="rounded-2xl overflow-hidden shadow-md relative aspect-[9/16] bg-black">
                  {/* video */}
                  <video
                    src={item.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* creator & brand */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                      <Image
                        src={item.creatorImg}
                        alt="creator"
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <span className="text-white font-semibold text-md">X</span>

                    <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                      <Image
                        src={item.brandImg}
                        alt="brand"
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* creator username */}
                  <div className="absolute bottom-2 right-4 text-white text-sm opacity-90">
                    {item.creator}
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
        {stories.map((_, i) => (
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
