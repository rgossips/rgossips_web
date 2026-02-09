"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Video,
  Smartphone,
  Youtube,
  Image as ImageIcon,
  Clapperboard,
  ChevronDown,
} from "lucide-react";

const services = [
  { id: "reels", label: "Reels", icon: <Video size={24} /> },
  { id: "stories", label: "Stories", icon: <Smartphone size={24} /> },
  { id: "shorts", label: "YouTube Shorts", icon: <Youtube size={24} /> },
  { id: "posts", label: "Static Posts", icon: <ImageIcon size={24} /> },
  { id: "ugc", label: "UGC Videos", icon: <Clapperboard size={24} /> },
];

const rateRanges = [
  "₹10,000 - ₹50,000",
  "₹50,000 - ₹1,00,000",
  "₹1,00,00,000 - ₹2,50,000",
  "₹2,50,000 - ₹5,00,000",
  "₹5,00,000 - ₹10,00,000",
  "₹10,00,000+",
];

const Preferences = ({ onNext }) => {
  const [selectedServices, setSelectedServices] = useState([]);
  const [rateRange, setRateRange] = useState("");

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 text-center">
          Collaboration Preferences
        </h2>
        <p className="text-slate-500 text-sm text-center">
          Tell brands what you offer
        </p>
      </div>

      {/* Service Selection Grid */}
      <div className="grid grid-cols-3 gap-3">
        {services.slice(0, 3).map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
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
            isSelected={selectedServices.includes(service.id)}
            onClick={() => toggleService(service.id)}
          />
        ))}
      </div>

      {/* Rate Range Dropdown */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 ml-1">Rate Range</p>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6347F9]">
            <span className="text-lg font-bold">₹</span>
          </div>
          <select
            value={rateRange}
            onChange={(e) => setRateRange(e.target.value)}
            className="flex h-14 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-12 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#6347F9] appearance-none"
          >
            <option value="" disabled>
              Select rate range
            </option>
            {rateRanges.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
        </div>
      </div>

      <Button
        onClick={() => onNext({ services: selectedServices, rateRange })}
        disabled={selectedServices.length === 0 || !rateRange}
        className="w-full btn-purple h-[54px] rounded-2xl text-base font-semibold shadow-lg shadow-purple-100"
      >
        Continue
      </Button>
    </div>
  );
};

const ServiceCard = ({ service, isSelected, onClick }) => (
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
      {service.label}
    </span>
  </button>
);

export default Preferences;
