import React from "react";
import one from "@/assets/influencers/1.jpg";
import two from "@/assets/influencers/2.jpg";
import Image from "next/image";
import { useTranslations } from "next-intl";

const FeaturedSection = () => {
  const t = useTranslations("FeaturedSection");
  return (
    <div className="my-10 px-10 lg:px-20 grid grid-cols-2 gap-x-20">
      <div className="flex flex-col items-center justify-center gap-10">
        {/* Text Section */}
        <div className="flex flex-col gap-3 text-center lg:text-left">
          <div className="text-lg text-gray-600">{t("eyebrow")}</div>
          <div className="font-bold text-4xl md:text-5xl text-gray-900">
            {t("heading")}
          </div>
        </div>

        {/* Image Section */}
        <div className="relative w-full max-w-3xl h-[400px] md:h-[500px] overflow-hidden rounded-xl">
          <Image
            src={one}
            alt={t("imageAlt")}
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
      <div className="flex flex-col-reverse items-center justify-center gap-10">
        {/* Text Section */}
        <div className="flex flex-col gap-3 text-center lg:text-left">
          <div className="text-lg text-gray-600">
            {t("description")}
          </div>
        </div>

        {/* Image Section */}
        <div className="relative w-full max-w-5xl h-[400px] md:h-[500px] overflow-hidden rounded-xl">
          <Image
            src={one}
            alt={t("imageAlt")}
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
    </div>
  );
};

export default FeaturedSection;
