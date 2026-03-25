"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import quotes from "@/assets/quotes.png";
import { Badge } from "./ui/badge";
import { TrendingUp } from "lucide-react";

const creators = [
  {
    id: 1,
    name: "Sara J.",
    role: "Hair",
    followers: "18K",
    quote: '"Finally monetizing my content! The brand matches are spot on."',
    earnings: "₹41K",
    time: "in 1 month",
    image: "https://i.pravatar.cc/150?img=3",
  },
  {
    id: 2,
    name: "Priya M.",
    role: "Skincare",
    followers: "14K",
    quote: '"Turned my small audience into a steady stream of income."',
    earnings: "₹37K",
    time: "in 4 weeks",
    image: "https://i.pravatar.cc/150?img=6",
  },
  {
    id: 3,
    name: "Ananya S.",
    role: "Beauty",
    followers: "15K",
    quote: '"Got my first brand deal in just 4 days of signing up."',
    earnings: "₹32K",
    time: "in 3 weeks",
    image: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: 4,
    name: "Aisha R.",
    role: "Lifestyle",
    followers: "9K",
    quote: '"My first paid collaboration happened here."',
    earnings: "₹18K",
    time: "in 2 weeks",
    image: "https://i.pravatar.cc/150?img=5",
  },
];

export default function CreatorsLikeYou() {
  const scrollRef = useRef(null);

  // Auto-scroll on mobile
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let scrollAmount = 0;
    const cardWidth = 220; // approx card width + gap
    const totalWidth = creators.length * cardWidth;

    const interval = setInterval(() => {
      scrollAmount += cardWidth;
      if (scrollAmount >= totalWidth) {
        scrollAmount = 0;
        el.scrollTo({ left: 0, behavior: "instant" });
      } else {
        el.scrollTo({ left: scrollAmount, behavior: "smooth" });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full bg-[#F7F7FB] py-6 px-4 lg:px-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 lg:mb-10">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-slate-900 uppercase">
            Creators Like You
          </h2>
          <p className="text-xs lg:text-sm text-slate-500">
            See how others are growing their income
          </p>
        </div>
        <button className="text-pink-500 text-sm font-semibold hover:underline shrink-0">
          See all
        </button>
      </div>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        {/* Featured Card */}
        <div className="bg-white w-full lg:max-w-[70%] min-h-full rounded-3xl p-5 lg:p-8 shadow-sm border flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4 lg:mb-6">
              <Image
                src="https://i.pravatar.cc/150?img=4"
                width={48}
                height={48}
                alt="Neha"
                className="rounded-full w-10 h-10 lg:w-12 lg:h-12"
              />
              <div>
                <h3 className="font-semibold text-sm lg:text-base">
                  Neha P.{" "}
                  <Badge className="btn-purple ml-2 lg:ml-5 text-[10px]">
                    Featured
                  </Badge>
                </h3>
                <p className="text-xs text-slate-500">Fashion · 20K</p>
              </div>
            </div>

            <Image
              src={quotes}
              alt="quotes"
              height={300}
              width={300}
              className="w-8 h-10 lg:w-10 lg:h-12 mt-6 lg:mt-16 mb-2 lg:mb-3"
            />
            <p className="text-xl lg:text-3xl font-bold text-slate-800 leading-snug lg:leading-relaxed">
              &ldquo;Brands started reaching out immediately after joining. Best
              platform!&rdquo;
            </p>
          </div>

          <div className="mt-6 lg:mt-8 bg-[#009966] text-white rounded-2xl px-5 lg:px-6 py-4 flex items-center gap-3">
            <TrendingUp size={20} className="opacity-80 shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                Record Earnings
              </p>
              <p className="text-2xl lg:text-3xl font-bold">
                ₹55K{" "}
                <span className="text-xs font-normal opacity-80">
                  in 5 weeks
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Small Cards — horizontal scroll on mobile, 2x2 grid on desktop */}
        <div
          ref={scrollRef}
          className="flex lg:grid lg:grid-cols-2 gap-4 lg:gap-6 overflow-x-auto lg:overflow-visible scrollbar-hide snap-x snap-mandatory pb-2 lg:pb-0"
        >
          {creators.map((person) => (
            <div
              key={person.id}
              className="bg-white rounded-2xl p-5 lg:p-6 border shadow-sm flex flex-col justify-between min-w-[200px] w-[200px] lg:w-auto lg:min-w-0 snap-start shrink-0 lg:shrink lg:aspect-square"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-3 lg:mb-4">
                  <Image
                    src={person.image}
                    width={36}
                    height={36}
                    alt={person.name}
                    className="rounded-full w-9 h-9"
                  />
                  <div>
                    <h4 className="font-semibold text-sm leading-tight">
                      {person.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {person.role} · {person.followers}
                    </p>
                  </div>
                </div>
                <p className="text-xs lg:text-sm text-slate-600 italic leading-relaxed">
                  {person.quote}
                </p>
              </div>

              <div className="mt-4 lg:mt-6 flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Earnings
                  </p>
                  <p className="text-lg font-bold text-slate-800">
                    {person.earnings}{" "}
                    <span className="text-[11px] font-normal text-slate-400">
                      {person.time}
                    </span>
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-50 flex items-center justify-center rounded-full">
                  <TrendingUp size={14} className="text-green-600" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
