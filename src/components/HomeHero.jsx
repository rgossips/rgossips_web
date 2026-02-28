"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight, Building2, Users, TrendingUp } from "lucide-react";
import { useGlobal } from "@/context/GlobalContext";
import { useRouter } from "next/navigation";
import one from "@/assets/home1.png";

const HomeHero = () => {
  const { setType } = useGlobal();
  const router = useRouter();

  return (
    <section className="relative w-full min-h-[90vh] flex items-center justify-center py-20 overflow-hidden bg-[#fcfdff]">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Content */}
        <div className="space-y-8">
          <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 w-fit max-w-[80vw] flex-wrap">
            {/* <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            </span> */}
            <span className="flex items-center gap-1.5 flex-wrap">
              🚀 Now live: AI-powered Influencer Matching — Try it free →
            </span>
          </Badge>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            Where Global Brands Meet <br />
            <span className="bg-gradient-to-r from-[#155DFC] to-[#9810FA] bg-clip-text text-transparent">
              The Right Creators.
            </span>
          </h1>

          <p className="text-slate-500 text-lg md:text-xl max-w-lg leading-relaxed font-medium">
            RGossips is the all-in-one influencer campaign platform that
            connects brands with verified creators globally — no agencies, no
            spreadsheets, no guesswork.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => {
                setType("brands");
                router.push("/login");
              }}
              className="cursor-pointer h-14 px-8 bg-gradient-to-r from-[#155DFC] to-[#9810FA] text-white rounded-2xl text-lg font-bold shadow-lg shadow-blue-200 group"
            >
              <Building2 className="mr-2 h-5 w-5" />
              I&apos;m a Brand
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              onClick={() => {
                setType("influencers");
                router.push("/login");
              }}
              variant="outline"
              className="cursor-pointer h-14 px-8 border-slate-200 text-slate-600 rounded-2xl text-lg font-bold hover:bg-slate-50 group"
            >
              <Users className="mr-2 h-5 w-5" />
              I&apos;m an Influencer
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Social Proof */}
          {/* <div className="flex items-center gap-6 pt-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-full border-4 border-white bg-gradient-to-br ${
                    i % 2 === 0
                      ? "from-blue-400 to-blue-600"
                      : "from-purple-400 to-purple-600"
                  }`}
                />
              ))}
              <div className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                +5K
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm font-bold text-slate-700">
                4.9/5{" "}
                <span className="text-slate-400 font-medium">
                  from 2,000+ reviews
                </span>
              </p>
            </div>
          </div> */}
        </div>

        {/* Right Content - Interactive Visual */}
        <div className="relative flex justify-center">
          <motion.div className="relative w-full max-w-[500px] aspect-square rounded-[3rem] overflow-visible">
            {/* Main Content*/}
            {/* <div className="absolute inset-4 rounded-[3rem] bg-linear-to-b from-[#EFF6FF] to-[#FAF5FF] backdrop-blur-sm border border-white/50 flex items-center justify-center">
              
            </div> */}
            <Image
              src={one}
              alt="Hero"
              fill
              className="object-cover"
              priority
            />

            {/* Floating Stat Card 1 */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -left-3 lg:-left-10 bottom-20 lg:bottom-88 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-4 z-20"
            >
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">+245%</p>
                <p className="text-xs text-slate-400 font-medium">
                  ROI Increase
                </p>
              </div>
            </motion.div>

            {/* Floating Stat Card 2 */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute -right-3 lg:-right-6 bottom-72 lg:bottom-24 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-4 z-20"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">50K+</p>
                <p className="text-xs text-slate-400 font-medium">
                  Active Users
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
