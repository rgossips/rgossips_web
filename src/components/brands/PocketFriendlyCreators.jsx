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
    category: "Tech",
    followers: "45K followers",
    image: "/creator1.jpg",
  },
  {
    name: "Ananya Singh",
    category: "Fashion",
    followers: "120K followers",
    image: "/creator2.jpg",
  },
  {
    name: "Aryan Mehta",
    category: "Fitness",
    followers: "80K followers",
    image: "/creator3.jpg",
  },
  {
    name: "Sneha Kapoor",
    category: "Lifestyle",
    followers: "60K followers",
    image: "/creator4.jpg",
  },
];

export default function PocketFriendlyCreators() {
  return (
    <section className="w-full px-4 lg:px-6 py-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        Pocket Friendly Creators
      </h2>

      <Carousel
        opts={{
          align: "start",
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {creators.map((creator, index) => (
            <CarouselItem
              key={index}
              className="pl-2 basis-[80%] sm:basis-1/2 lg:basis-1/3"
            >
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col items-center text-center">
                <Image
                  src={creator.image}
                  alt={creator.name}
                  width={60}
                  height={60}
                  className="rounded-full object-cover mb-3"
                />

                <h3 className="font-semibold text-gray-800">{creator.name}</h3>

                <span className="text-xs bg-gray-100 px-3 py-1 rounded-full mt-2">
                  {creator.category}
                </span>

                <p className="text-xs text-gray-500 mt-2">
                  {creator.followers}
                </p>

                <button className="mt-4 w-full border border-indigo-500 text-indigo-600 rounded-full py-2 text-sm font-medium hover:bg-indigo-50 transition">
                  Contact
                </button>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
}
