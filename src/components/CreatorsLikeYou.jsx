"use client";

import Image from "next/image";
import quotes from "@/assets/quotes.png";
import { Badge } from "./ui/badge";

const creators = [
  {
    id: 1,
    name: "Sara J.",
    role: "Hair",
    followers: "18K",
    quote: "Finally monetizing my content! The brand matches are spot on.",
    earnings: "₹41K",
    time: "in 1 month",
    image: "https://i.pravatar.cc/150?img=3",
  },
  {
    id: 2,
    name: "Priya M.",
    role: "Skincare",
    followers: "14K",
    quote: "Turned my small audience into a steady income stream.",
    earnings: "₹37K",
    time: "in 4 weeks",
    image: "https://i.pravatar.cc/150?img=6",
  },
  {
    id: 3,
    name: "Ananya S.",
    role: "Beauty",
    followers: "15K",
    quote: "Got my first brand deal in just 4 days of signing up.",
    earnings: "₹32K",
    time: "in 3 weeks",
    image: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: 4,
    name: "Aisha R.",
    role: "Lifestyle",
    followers: "9K",
    quote: "My first paid collaboration happened here.",
    earnings: "₹18K",
    time: "in 2 weeks",
    image: "https://i.pravatar.cc/150?img=5",
  },
];

export default function CreatorsLikeYou() {
  return (
    <section className="w-full bg-[#F7F7FB] py-6 lg:px-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 mx-auto">
        <div>
          <h2 className="text-xl font-bold text-slate-900 uppercase">
            Creators Like You
          </h2>
          <p className="text-sm text-slate-500">
            See how others are growing their income
          </p>
        </div>

        <button className="text-pink-500 text-sm font-semibold hover:underline">
          Explore more →
        </button>
      </div>

      {/* Layout */}
      <div className="flex justify-between gap-6 mx-auto">
        {/* Featured Card */}
        <div className="bg-white w-full max-w-[55%] min-h-full rounded-3xl p-8 shadow-sm border flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="https://i.pravatar.cc/150?img=4"
                width={48}
                height={48}
                alt="Neha"
                className="rounded-full"
              />

              <div>
                <h3 className="font-semibold">
                  Neha P. <Badge className="btn-purple ml-5">Featured</Badge>
                </h3>
                <p className="text-xs text-slate-500">Fashion · 20K</p>
              </div>
            </div>

            <Image
              src={quotes}
              alt="quotes"
              height={300}
              width={300}
              className="w-10 h-12 mt-16 mb-3"
            />
            <p className="text-3xl font-bold text-slate-800 leading-relaxed">
              “Brands started reaching out immediately after joining. Best
              platform!”
            </p>
          </div>

          <div className="mt-8 bg-[#009966] text-white rounded-xl px-6 py-4">
            <p className="text-xs uppercase opacity-80">Record Earnings</p>
            <p className="text-3xl font-bold">₹55K</p>
            <p className="text-xs opacity-80">in 5 weeks</p>
          </div>
        </div>

        {/* Small Cards */}
        <div className="grid sm:grid-cols-2 gap-6">
          {creators.map((person) => (
            <div
              key={person.id}
              className="bg-white rounded-2xl p-6 border shadow-sm aspect-square flex flex-col max-h- justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Image
                    src={person.image}
                    width={40}
                    height={40}
                    alt={person.name}
                    className="rounded-full"
                  />

                  <div>
                    <h4 className="font-semibold text-sm">{person.name}</h4>
                    <p className="text-xs text-slate-500">
                      {person.role} · {person.followers}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 italic">
                  "{person.quote}"
                </p>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400 uppercase">Earnings</p>
                  <p className="font-semibold">{person.earnings}</p>
                  <p className="text-xs text-slate-400">{person.time}</p>
                </div>

                <div className="w-8 h-8 bg-green-100 flex items-center justify-center rounded-full">
                  ↗
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
