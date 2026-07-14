"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Video,
  Smartphone,
  Youtube,
  Image as ImageIcon,
  Clapperboard,
} from "lucide-react";

// `label` is a message key resolved via t(`services.${id}`) at render.
const services = [
  { id: "reels", icon: <Video size={24} /> },
  { id: "stories", icon: <Smartphone size={24} /> },
  { id: "shorts", icon: <Youtube size={24} /> },
  { id: "posts", icon: <ImageIcon size={24} /> },
  { id: "ugc", icon: <Clapperboard size={24} /> },
];

const Preferences = ({ onNext, onSkip }) => {
  const t = useTranslations("Auth.preferences");
  const [selectedServices, setSelectedServices] = useState([]);

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 text-center">{t("title")}</h2>
        <p className="text-slate-500 text-sm text-center">{t("subtitle")}</p>
      </div>

      {/* Service Selection Grid */}
      <div className="grid grid-cols-3 gap-3">
        {services.slice(0, 3).map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            label={t(`services.${service.id}`)}
            isSelected={selectedServices.includes(service.id)}
            onClick={() => toggleService(service.id)}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-[80%] mx-auto">
        {services.slice(3).map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            label={t(`services.${service.id}`)}
            isSelected={selectedServices.includes(service.id)}
            onClick={() => toggleService(service.id)}
          />
        ))}
      </div>

      {/* Sticky footer on mobile — the parent scroll container has
          overflow-y-auto, so this row pins to the bottom of the visible
          card while the form above scrolls. The negative horizontal
          margin + padding cancel the parent's px-8, so the white
          background spans the full card width. */}
      <div className="sticky bottom-0 -mx-8 px-8 pt-3 pb-2 bg-white border-t border-slate-100 space-y-3 md:static md:mx-0 md:px-0 md:pt-0 md:pb-0 md:border-0">
        <Button
          onClick={() => onNext({ services: selectedServices })}
          disabled={selectedServices.length === 0}
          className="w-full btn-purple h-[54px] rounded-2xl text-base font-semibold shadow-lg shadow-purple-100"
        >
          {t("continue")}
        </Button>
        {onSkip && (
          <button
            onClick={onSkip}
            className="w-full py-3 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            {t("skip")}
          </button>
        )}
      </div>
    </div>
  );
};

const ServiceCard = ({ service, label, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 aspect-square ${
      isSelected
        ? "border-[#6347F9] bg-[#F3EFFF] text-[#6347F9]"
        : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
    }`}
  >
    <div
      className={`${isSelected ? "text-[#6347F9]" : "text-[#6347F9]/50"} mb-2`}
    >
      {service.icon}
    </div>
    <span className="text-[10px] font-bold text-center leading-tight">
      {label}
    </span>
  </button>
);

export default Preferences;
