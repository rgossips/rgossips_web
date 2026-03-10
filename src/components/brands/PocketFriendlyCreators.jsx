"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const creators = [
  {
    name: "Rohan Sharma",
    category: "Tech & Gadgets",
    followers: "45K followers",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop",
  },
  {
    name: "Ananya Singh",
    category: "Fashion & Style",
    followers: "120K followers",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop",
  },
  {
    name: "Aryan Mehta",
    category: "Fitness & Health",
    followers: "80K followers",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop",
  },
  {
    name: "Sneha Kapoor",
    category: "Travel & Lifestyle",
    followers: "60K followers",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=200&auto=format&fit=crop",
  },
  {
    name: "Vikram Goel",
    category: "Food & Cafe",
    followers: "35K followers",
    image:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=200&h=200&auto=format&fit=crop",
  },
];

export default function PocketFriendlyCreators() {
  return (
    <section className="w-full px-4 lg:px-10 py-10 bg-white">
      <div className="flex flex-col mb-8">
        <h2 className="text-xl font-bold text-[#1C115A]">
          Pocket Friendly Creators
        </h2>
        <p className="text-sm text-slate-500">
          High engagement creators within your budget
        </p>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full relative"
      >
        <CarouselContent className="-ml-4">
          {creators.map((creator, index) => (
            <CarouselItem
              key={index}
              className="pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/4"
            >
              <div className="group bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col items-center text-center">
                {/* Profile Image with Gradient Border */}
                <div className="relative w-24 h-24 mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-400 p-[3px] transition-transform duration-700">
                    <div className="bg-white rounded-full p-1 h-full w-full">
                      <img
                        src={creator.image}
                        alt={creator.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                <h3 className="font-bold text-[#1C115A] text-lg leading-tight">
                  {creator.name}
                </h3>

                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mt-3">
                  {creator.category}
                </span>

                <p className="text-xs text-slate-400 mt-2 font-medium">
                  {creator.followers}
                </p>

                <button className="mt-6 w-full cursor-pointer py-3 bg-[#1C115A] text-white rounded-2xl text-xs font-bold hover:bg-[#5B3DF5] transition-colors active:scale-95">
                  View Profile
                </button>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Arrows - Hidden on small mobile for cleaner look */}
        <div className="hidden md:block">
          <CarouselPrevious className="-left-4 bg-white shadow-lg border-none hover:bg-slate-50" />
          <CarouselNext className="-right-4 bg-white shadow-lg border-none hover:bg-slate-50" />
        </div>
      </Carousel>
    </section>
  );
}
