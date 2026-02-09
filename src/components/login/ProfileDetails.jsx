"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Camera,
  User,
  AtSign,
  MapPin,
  Instagram,
  Youtube,
  ChevronDown,
} from "lucide-react";

const ProfileDetails = ({ onNext }) => {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    niche: "",
    location: "",
    instagram: "",
    youtube: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = () => {
    onNext(formData);
  };
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[75vh] overflow-y-auto px-3">
      {/* Header with Upload Photo Section */}
      <div className="text-center space-y-4">
        <h2 className="text-xl font-bold text-[#6347F9]">
          Set Up Your Creator Profile
        </h2>

        <div className="relative inline-block">
          <div className="w-24 h-24 bg-[#F3EFFF] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <User size={40} className="text-[#6347F9]/40" />
          </div>
          <button className="absolute bottom-0 right-0 btn-purple p-1.5 rounded-full border-2 border-white text-white">
            <Camera size={16} />
          </button>
        </div>
        <p className="text-xs text-slate-400 font-medium">Upload Photo</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 ml-1">
            Full Name
          </Label>
          <div className="relative">
            <User
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6347F9]/60"
              size={18}
            />
            <Input
              placeholder="Your name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="h-12 pl-12 rounded-xl border-slate-200 focus:ring-[#6347F9]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 ml-1">
            Username
          </Label>
          <div className="relative">
            <AtSign
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6347F9]/60"
              size={18}
            />
            <Input
              placeholder="@yourhandle"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="h-12 pl-12 rounded-xl border-slate-200"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 ml-1">
            Niche / Category
          </Label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6347F9]/60">
              <div className="w-4 h-4 border-2 border-slate-400 rounded-sm" />
            </div>
            <select
              name="niche"
              value={formData.niche}
              onChange={handleChange}
              className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-12 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-[#6347F9] appearance-none"
            >
              <option value="" disabled>
                Select niche
              </option>
              <option value="fitness">Fitness</option>
              <option value="tech">Tech</option>
            </select>
            <ChevronDown
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6347F9]/60"
              size={18}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 ml-1">
            Location
          </Label>
          <div className="relative">
            <MapPin
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6347F9]/60"
              size={18}
            />
            <Input
              placeholder="City, Country"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="h-12 pl-12 rounded-xl border-slate-200"
            />
          </div>
        </div>

        {/* Social Links Section */}
        <div className="pt-2">
          <Label className="text-xs font-bold text-slate-900 ml-1">
            Social Links
          </Label>
          <div className="mt-3 space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px]  ml-1 font-medium">
                Instagram Handle
              </Label>
              <div className="relative">
                <Instagram
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6347F9]/60"
                  size={18}
                />
                <Input
                  placeholder="@instagram"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  className="h-12 pl-12 rounded-xl border-slate-200"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] ml-1 font-medium">
                YouTube Channel (optional)
              </Label>
              <div className="relative">
                <Youtube
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6347F9]/60"
                  size={18}
                />
                <Input
                  placeholder="Channel link"
                  name="youtube"
                  value={formData.youtube}
                  onChange={handleChange}
                  className="h-12 pl-12 rounded-xl border-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3 pt-2">
        <Button
          onClick={handleContinue}
          className="w-full btn-purple h-[54px] rounded-3xl text-base font-semibold shadow-lg shadow-purple-100"
        >
          Save & Continue
        </Button>
        <button
          className="w-full text-sm font-semibold text-[#6347F9] hover:underline"
          onClick={handleContinue}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default ProfileDetails;
