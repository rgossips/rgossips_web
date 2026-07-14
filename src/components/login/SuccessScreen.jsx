"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Tick from "@/assets/login/SuccessIllustration.webp";

const SuccessScreen = ({ onNext, loading = false }) => {
  const t = useTranslations("Auth.success");
  return (
  <div className="flex flex-col items-center justify-center text-center space-y-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* Animated Illustration Container */}
    <div className="relative">
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-[#6347F9] opacity-10 blur-3xl rounded-full" />

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
        className="relative z-10 w-72 h-72 flex items-center justify-center"
      >
        <Image
          src={Tick}
          alt="Success"
          width={360}
          height={360}
          priority
          className="object-contain"
        />
      </motion.div>
    </div>

    <div className="space-y-3 px-4">
      <h2 className="text-2xl font-bold text-slate-900">{t("title")}</h2>
      <p className="text-sm text-slate-500 leading-relaxed">{t("subtitle")}</p>
    </div>

    <div className="w-full pt-4">
      <Button
        onClick={onNext}
        disabled={loading}
        className="w-full btn-purple h-[54px] rounded-2xl text-base font-semibold shadow-lg shadow-purple-100"
      >
        {loading ? t("creating") : t("start")}
      </Button>
    </div>
  </div>
  );
};

export default SuccessScreen;
