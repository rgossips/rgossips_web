"use client";

import Image from "next/image";
import React from "react";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const influencerData = [
  {
    id: 1,
    name: "Ananya S.",
    role: "Beauty",
    followers: "15K",
    quote: "Got my first brand deal in just 4 days!",
    earnings: "₹32K",
    time: "in 3 weeks",
    image: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: 2,
    name: "Riya K.",
    role: "Makeup",
    followers: "12K",
    quote: "Collaborated with 3 brands in my first month.",
    earnings: "₹21K",
    time: "in 2 weeks",
    image: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: 3,
    name: "Sara J.",
    role: "Hair",
    followers: "18K",
    quote: "Finally monetizing my content!",
    earnings: "₹41K",
    time: "in 1 month",
    image: "https://i.pravatar.cc/150?img=3",
  },
  {
    id: 4,
    name: "Neha P.",
    role: "Fashion",
    followers: "20K",
    quote: "Brands started reaching out after joining!",
    earnings: "₹55K",
    time: "in 5 weeks",
    image: "https://i.pravatar.cc/150?img=4",
  },
  {
    id: 5,
    name: "Aisha R.",
    role: "Lifestyle",
    followers: "9K",
    quote: "My first paid collaboration happened here.",
    earnings: "₹18K",
    time: "in 2 weeks",
    image: "https://i.pravatar.cc/150?img=5",
  },
  {
    id: 6,
    name: "Priya M.",
    role: "Skincare",
    followers: "14K",
    quote: "Turned my small audience into income!",
    earnings: "₹37K",
    time: "in 4 weeks",
    image: "https://i.pravatar.cc/150?img=6",
  },
];

const TopRatedInfluencers = () => {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true }),
  );

  return (
    <section className="w-full py-10 px-6">
      {/* Header */}
      <div className="flex justify-between items-center px-6 mb-8">
        <h2 className="font-bold uppercase text-xl text-slate-800">
          Creators Like You
        </h2>

        <button className="text-sm font-semibold cursor-pointer text-slate-400 hover:underline">
          Explore more
        </button>
      </div>

      {/* Carousel */}
      <Carousel
        plugins={[plugin.current]}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        opts={{
          align: "start",
          loop: true,
        }}
        className="flex overflow-x-auto gap-6 px-6 pb-6 snap-x snap-mandatory scrollbar-hide"
      >
        <CarouselContent>
          {influencerData.map((person) => (
            <CarouselItem
              key={person.id}
              className="snap-start flex-none w-[280px]"
            >
              {/* Card */}
              <div className="relative p-[1px] rounded-3xl bg-gradient-to-br from-[#F6339A] via-[#8E2DE2] to-[#34D399]">
                {/* Inner Card */}
                <div className="bg-white rounded-3xl p-6 h-[220px] flex flex-col justify-between">
                  {/* Top */}
                  <div className="flex items-center gap-3">
                    <Image
                      src={person.image}
                      width={48}
                      height={48}
                      alt={person.name}
                      className="rounded-full"
                    />

                    <div>
                      <h3 className="font-semibold text-sm">{person.name}</h3>
                      <p className="text-xs text-slate-700">
                        {person.role} · {person.followers}
                      </p>
                    </div>
                  </div>

                  {/* Quote */}
                  <p className="text-slate-800 text-sm italic line-clamp-2">
                    "{person.quote}"
                  </p>

                  {/* Earnings */}
                  <div className="btn-purple rounded-xl px-4 py-2 flex items-center gap-2 w-fit">
                    <span className="text-lg font-bold">{person.earnings}</span>
                    <span className="text-xs">{person.time}</span>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default TopRatedInfluencers;
