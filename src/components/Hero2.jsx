import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

// Asset Imports
import gucci from "@/assets/brands/gucci.png";
import burberry from "@/assets/brands/burberry.png";
import channel from "@/assets/brands/channel.png";
import louisVitton from "@/assets/brands/louisVitton.png";
import puma from "@/assets/brands/puma.png";
import rolex from "@/assets/brands/rolex.png";
import tommyHilfiger from "@/assets/brands/tommyHilfiger.png";
import versace from "@/assets/brands/versace.png";

const brands = [
  { name: "Gucci", logo: gucci },
  { name: "Burberry", logo: burberry },
  { name: "Channel", logo: channel },
  { name: "Louis Vitton", logo: louisVitton },
  { name: "Puma", logo: puma },
  { name: "Rolex", logo: rolex },
  { name: "Tommy Hilfiger", logo: tommyHilfiger },
  { name: "Versace", logo: versace },
];

const BrandSlider = () => {
  return (
    <div className="relative flex w-full overflow-hidden bg-white py-12">
      <div className="flex w-max">
        <motion.div
          className="flex gap-20 pr-20 items-center"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 25,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {/* Double the list for seamless loop */}
          {[...brands, ...brands].map((brand, index) => (
            <div
              key={index}
              className="relative w-32 h-12 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <Image
                src={brand.logo}
                alt={brand.name}
                fill
                className="object-contain"
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Side Fades for that high-end look */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
    </div>
  );
};

const Hero2 = () => {
  return (
    <section className="bg-white pt-16 md:pt-24 overflow-hidden max-w-full px-10 lg:px-0 border-b border-slate-50">
      <div className="container mx-auto px-4 text-center">
        {/* Announcement Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-8">
          <span role="img" aria-label="rocket">
            🚀
          </span>
          <p className="text-sm font-medium text-slate-800">
            Now live: AI-powered Influencer Matching —{" "}
            <span className="text-slate-500">Try it free</span>
          </p>
          <span className="text-indigo-600">→</span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
          Where Global Brands <br className="hidden md:block" />
          Meet The Right Creators.
        </h1>

        {/* Subtext */}
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-500 leading-relaxed mb-10">
          RGossips is the all-in-one influencer campaign platform that connects
          brands with verified creators globally — no agencies, no spreadsheets,
          no guesswork.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button className="w-full cursor-pointer sm:w-auto px-8 py-4 bg-[#FF5A5F] text-white font-semibold rounded-xl shadow-lg shadow-rose-200 hover:bg-[#ff444a] hover:-translate-y-0.5 transition-all active:scale-95">
            Start for Free — No credit card needed
          </button>
          <button className="w-full cursor-pointer sm:w-auto px-8 py-4 border-2 border-indigo-400 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 hover:-translate-y-0.5 transition-all active:scale-95">
            I'm an Influencer — Join the Community
          </button>
        </div>

        {/* Trust & Ratings */}
        <div className="mb-16">
          <p className="text-sm text-slate-400 font-medium mb-3 uppercase tracking-wider">
            Trusted by 5,000+ brands & 200,000+ influencers across 30+ countries
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-3">
            <div className="flex text-yellow-400">
              {"★★★★★".split("").map((star, i) => (
                <span key={i} className="text-xl">
                  {star}
                </span>
              ))}
            </div>
            <div className="hidden md:block h-4 w-px bg-slate-300 mx-2" />
            <p className="text-sm font-semibold text-slate-800">
              4.8/5 from 2,400+ reviews
            </p>
            <div className="hidden md:block h-4 w-px bg-slate-300 mx-2" />
            <p className="text-sm font-semibold text-slate-800">
              #1 Rated Influencer Platform in India
            </p>
          </div>
        </div>

        {/* Infinite Slider */}
        <BrandSlider />
      </div>
    </section>
  );
};

export default Hero2;
