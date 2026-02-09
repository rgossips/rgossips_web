"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Tick from "@/assets/login/SuccessIllustration.png";

const SuccessScreen = ({ onNext, loading = false }) => (
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
      <h2 className="text-2xl font-bold text-slate-900">You're All Set!</h2>
      <p className="text-sm text-slate-500 leading-relaxed">
        Your profile is ready. Now let's verify your{" "}
        <br className="hidden md:block" />
        phone number to start closing deals.
      </p>
    </div>

    <div className="w-full pt-4">
      <Button
        onClick={onNext}
        disabled={loading}
        className="w-full btn-purple h-[54px] rounded-2xl text-base font-semibold shadow-lg shadow-purple-100"
      >
        {loading ? "Creating Account..." : "Start Using Platform"}
      </Button>
    </div>
  </div>
);

export default SuccessScreen;
