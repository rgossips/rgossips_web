"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useBrandTrustScore } from "@/hooks/useBrandTrustScore";
import TrustScoreInfoModal from "@/components/brands/TrustScoreInfoModal";
import InfoBadge from "@/components/brands/InfoBadge";

const baseBrands = [
  "https://lh3.googleusercontent.com/d/16kk2EEAMw_Y0D3Jo4BCUKAwF2rE8ugLG",
  "https://lh3.googleusercontent.com/d/1ua9IVd7PYxaIP44G3XHLKgauW5VgTy2r",

  "https://lh3.googleusercontent.com/d/1rUYya-EIZPqE7lSZBa_TY_wKI5httO6H",
  "https://lh3.googleusercontent.com/d/1IuS3e9tDzB987BNDkQaEmVLkg6IYDiuy",
];

const BrandHero = () => {
  const t = useTranslations("BrandsBrandHero");
  const router = useRouter();
  const { profile } = useAuth();
  const { trust } = useBrandTrustScore();
  const [trustInfoOpen, setTrustInfoOpen] = useState(false);

  const brandName = profile?.gstin_trade_name || profile?.brand_name || profile?.contact_name || "Brand";
  const logoUrl = profile?.logo_url;
  const initials = brandName.charAt(0).toUpperCase();

  const trustMin = trust?.scaleMin ?? 300;
  const trustMax = trust?.scaleMax ?? 900;
  const trustScore = trust?.score || trustMin;
  const trustBand = trust?.band || "Building Trust";
  const trustBorder =
    trustBand === "Elite"
      ? "border-emerald-500"
      : trustBand === "Trusted"
        ? "border-blue-500"
        : trustBand === "Established"
          ? "border-indigo-500"
          : trustBand === "Emerging"
            ? "border-amber-500"
            : "border-slate-400";

  return (
    <section className="w-full bg-linear-to-b from-[#4C75BE] to-[#31508F] px-6 pt-12 pb-10 rounded-b-[40px] md:rounded-b-[60px] text-white">
      <div className="max-w-7xl mx-auto">
        {/* TOP ROW */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-white/10 flex items-center justify-center">
              {logoUrl ? <Image src={logoUrl} alt={brandName} fill className="object-cover" /> : <span className="text-white font-bold text-lg">{initials}</span>}
            </div>

            <div>
              <p className="text-slate-300 text-xs md:text-sm font-medium">{t("welcomeBack")}</p>
              <h3 className="text-white font-bold text-sm md:text-base">{brandName}</h3>
            </div>
          </div>

          {/* Mobile invite */}
          <button className="flex lg:hidden items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 py-2 px-4 rounded-full text-xs font-bold">
            {t("inviteEarn")}
            <div className="bg-white rounded-full p-0.5">
              <Plus size={14} className="text-[#16224E]" />
            </div>
          </button>
        </div>

        {/* HERO GRID */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT SIDE */}
          <div className="space-y-6">
            {/* <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs text-white/90">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Welcome back, Add your name
            </div> */}

            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight max-w-xl">
              {t.rich("heading", {
                br: () => <br />,
                accent: (c) => <span className="text-indigo-300">{c}</span>,
              })}
            </h1>

            {/* <p className="text-slate-300 text-sm md:text-base max-w-lg">
              Discover, verify, and collaborate with top-tier creators across
              all platforms. Build your next campaign in minutes.
            </p> */}
            <div className="flex items-center gap-5">
              <div className="flex lg:hidden -space-x-3">
                {baseBrands.map((i, index) => (
                  <Image key={index} src={i} width={36} height={36} alt="agency" className="rounded-full border-2 border-[#22376F]" />
                ))}
              </div>
              <div className="text-slate-100 opacity-90 font-light">{t("agenciesCount")}</div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-4 pt-2">
              <button
                onClick={() => {
                  router.push("/brands/search");
                }}
                className="flex cursor-pointer items-center justify-center gap-2 bg-white text-black px-8 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-100 transition"
              >
                {t("browseCreators")}
              </button>

              <button
                onClick={() => {
                  router.push("/brands/campaigns");
                }}
                className="bg-[#6A66C9] cursor-pointer px-8 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-[#6A66C9]/30 hover:brightness-110 transition"
              >
                {t("postRequirements")}
              </button>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="hidden lg:flex flex-col gap-6 items-end">
            {/* Agencies Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl w-[400px]">
              <p className="text-sm text-slate-300 mb-4">{t("trustedByAgencies")}</p>

              <div className="flex items-center">
                <div className="flex -space-x-3">
                  {baseBrands.map((i, index) => (
                    <Image key={index} src={i} width={36} height={36} alt="agency" className="rounded-full border-2 border-[#22376F]" />
                  ))}
                </div>

                <div className="ml-3 bg-[#22376F] text-xs px-3 py-1 rounded-full">+2k</div>
              </div>
            </div>

            {/* Trust Score Card */}
            <div className="bg-black/80 border border-white/10 p-5 rounded-2xl w-[400px] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-[#9C97B8] uppercase">{t("trustScoreLabel")}</p>
                  <button
                    onClick={() => setTrustInfoOpen(true)}
                    className="cursor-pointer hover:scale-110 transition-transform inline-flex"
                    aria-label={t("trustInfoAria")}
                    title={t("trustInfoTitle")}
                  >
                    <InfoBadge size={16} />
                  </button>
                </div>

                <div className="flex items-end gap-2 mt-1">
                  <span className="text-2xl font-bold">{trustScore}</span>
                  <span className="text-[#9C97B8] text-xs font-semibold">/{trustMax}</span>
                </div>
                {trust?.coldStart && <p className="text-amber-400 text-[9px] font-bold mt-1 uppercase tracking-wider">{t("coldStartNote", { cap: trust.coldStartCap })}</p>}
              </div>

              {/* Circle indicator */}
              <div className={`w-14 h-14 ${trustBorder} flex items-center justify-center text-[15px] font-bold text-center leading-tight px-1`}>{trustBand}</div>
            </div>
          </div>
        </div>
      </div>

      <TrustScoreInfoModal open={trustInfoOpen} onClose={() => setTrustInfoOpen(false)} />
    </section>
  );
};

export default BrandHero;
