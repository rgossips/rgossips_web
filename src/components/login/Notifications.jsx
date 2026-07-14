"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Bell from "@/assets/login/BellIllustration.webp";
import Image from "next/image";

const Notifications = ({ onNext }) => {
  const t = useTranslations("Auth.notifications");
  return (
    <div className="flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Visual Header Section */}
      <div className="relative w-full flex justify-center pt-4">
        {/* Glow effect behind the image */}
        <div className="absolute inset-0 bg-[#6347F9] opacity-5 blur-3xl rounded-full scale-75" />

        <Image
          src={Bell}
          alt="Notifications Illustration"
          className="relative z-10 w-full max-w-[600px] h-auto object-contain"
          priority
        />
      </div>

      {/* Text Content */}
      <div className="text-center space-y-2 px-4">
        <h2 className="text-2xl font-bold text-slate-900 leading-tight">{t("title")}</h2>
        <p className="text-sm text-slate-500 leading-relaxed max-w-[280px] mx-auto">{t("subtitle")}</p>
      </div>

      {/* Action Buttons — sticky on mobile so they stay visible without scrolling */}
      <div className="w-full sticky bottom-0 -mx-8 px-8 pt-3 pb-2 bg-white border-t border-slate-100 space-y-3 md:static md:mx-0 md:px-0 md:pt-2 md:pb-0 md:border-0">
        <Button
          onClick={() => onNext(true)}
          className="w-full btn-purple h-[54px] rounded-2xl text-base font-semibold shadow-lg shadow-purple-100"
        >
          {t("enable")}
        </Button>
        <button
          onClick={() => onNext(false)}
          className="w-full py-2 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
        >
          {t("notNow")}
        </button>
      </div>
    </div>
  );
};

export default Notifications;
