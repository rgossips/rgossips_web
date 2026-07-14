import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import mobileImg from "@/assets/mobile1.png";
import gplay from "@/assets/gplay.png";
import appstore from "@/assets/apple.png";

const AppSection = () => {
  const t = useTranslations("AppComponent");

  const features = [
    "realtimeNotifications",
    "messaging",
    "approval",
    "analytics",
    "paymentTracking",
  ];

  return (
    <section className="w-full bg-[#F3E8FF] pt-20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-end justify-between gap-10">
        {/* Left Side: Content - Pushed up slightly to center with the phone body */}
        <div className="w-full lg:w-1/2 pb-20 space-y-8 lg:pr-10">
          <h2 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
            {t.rich("heading", { br: () => <br /> })}
          </h2>

          <ul className="space-y-5">
            {features.map((feature, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 text-slate-600 text-lg md:text-xl font-medium"
              >
                <ArrowRight className="text-purple-500 w-5 h-5 flex-shrink-0" />
                {t(`features.${feature}`)}
              </motion.li>
            ))}
          </ul>

          {/* App Store Buttons */}
          <div className="flex flex-wrap gap-4 pt-4">
            <button className="flex items-center gap-3 bg-black text-white px-5 py-3 rounded-2xl hover:bg-zinc-800 transition-colors border border-white/10 shadow-lg">
              <Image src={appstore} alt="Apple" width={22} height={22} />
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-zinc-400">
                  {t("appStore.label")}
                </p>
                <p className="text-lg font-semibold leading-none">App Store</p>
              </div>
            </button>
            <button className="flex items-center gap-3 bg-black text-white px-5 py-3 rounded-2xl hover:bg-zinc-800 transition-colors border border-white/10 shadow-lg">
              <Image src={gplay} alt="Google" width={22} height={22} />
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-zinc-400">
                  {t("googlePlay.label")}
                </p>
                <p className="text-lg font-semibold leading-none">
                  Google Play
                </p>
              </div>
            </button>
          </div>

          {/* Ratings */}
          <div className="flex items-center gap-8 pt-2">
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-700">{t("ratings.ios")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-700">
                {t("ratings.android")}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Mobile Mockup - Using "items-end" on parent makes it hit the bottom */}
        <div className="w-full lg:w-1/2 relative flex justify-center lg:justify-end">
          {/* Subtle glow behind phone */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-400/10 blur-[120px] rounded-full" />

          <motion.div
            initial={{ y: 100, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // Clean spring-like ease
            className="relative z-10 w-full max-w-[480px]"
          >
            <Image
              src={mobileImg}
              alt="RGossips Mobile App"
              priority
              className="drop-shadow-[0_35px_35px_rgba(0,0,0,0.15)] w-full h-auto block"
            />

            {/* Notification Tooltip */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-[15%] -right-2 md:-right-8 bg-white/95 backdrop-blur px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white"
            >
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs md:text-sm font-bold text-slate-800 whitespace-nowrap">
                {t("notification")}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AppSection;
