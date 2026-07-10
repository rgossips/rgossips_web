"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AlertPopup from "@/components/AlertPopup";
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
  const [popup, setPopup] = useState(null); // compact popup replacing window.alert()
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

  const validateInstagram = async () => {
    const targetUsername = formData.username.replace("@", "").trim();
    if (!targetUsername) {
      setPopup({ title: "Username required", message: "Please enter a username first.", tone: "info" });
      return;
    }
    try {
      // Server-side proxy: the Meta access token stays on the server and
      // never ships in the browser bundle. See
      // src/app/api/instagram/business-discovery/route.js.
      const response = await fetch("/api/instagram/business-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: targetUsername }),
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error ||
            "Account not found or not a Business/Creator profile",
        );
      }

      // Save into form
      setFormData((prev) => ({
        ...prev,
        instagram: data.username,
        instagramFollowers: data.followers_count,
        instagramProfilePic: data.profile_picture_url,
        biography: data.biography,
        instaId: data.id,
      }));

      setPopup({ title: "Validated ✅", message: `${data.followers_count} followers found.`, tone: "success" });
    } catch (err) {
      console.error("Instagram validation failed");
      setPopup(
        err.message ||
          "Validation failed. Ensure the account is Public & a Creator/Business account.",
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[75vh] overflow-y-auto px-3">
      {/* Header with Upload Photo Section */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">
          Set Up Your Creator Profile
        </h2>
        <p className="text-sm text-slate-500">
          Tell us about yourself so brands can find you
        </p>

        <div className="relative inline-block pt-2">
          <div className="w-20 h-20 bg-[#F3EFFF] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <User size={32} className="text-[#6347F9]/40" />
          </div>
          <button className="absolute bottom-0 right-0 btn-purple p-1.5 rounded-full border-2 border-white text-white cursor-pointer">
            <Camera size={14} />
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
          <Button
            onClick={validateInstagram}
            variant="outline"
            className="w-full h-10 rounded-xl border-slate-200 text-[#6347F9] hover:bg-[#F3EFFF] flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Instagram size={16} />
            Verify Instagram
          </Button>
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
              <option value="fashion">Fashion & Style</option>
              <option value="beauty">Beauty & Skincare</option>
              <option value="fitness">Fitness & Health</option>
              <option value="tech">Tech & Gadgets</option>
              <option value="food">Food & Cooking</option>
              <option value="travel">Travel & Adventure</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="gaming">Gaming</option>
              <option value="education">Education</option>
              <option value="entertainment">Entertainment & Comedy</option>
              <option value="music">Music & Dance</option>
              <option value="business">Business & Finance</option>
              <option value="photography">Photography & Art</option>
              <option value="parenting">Parenting & Family</option>
              <option value="other">Other</option>
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
        <div className="pt-3 border-t border-slate-100">
          <Label className="text-xs font-bold text-slate-900 ml-1">
            Social Links
          </Label>
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 ml-1">
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
                  className="h-12 pl-12 rounded-xl border-slate-200 focus:ring-[#6347F9]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 ml-1">
                YouTube Channel
                <span className="text-slate-400 font-normal ml-1">(optional)</span>
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
                  className="h-12 pl-12 rounded-xl border-slate-200 focus:ring-[#6347F9]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons — sticky on mobile so they stay visible without scrolling */}
      <div className="sticky bottom-0 -mx-8 px-8 pt-3 pb-2 bg-white border-t border-slate-100 space-y-3 md:static md:mx-0 md:px-0 md:pt-2 md:pb-0 md:border-0">
        <Button
          onClick={handleContinue}
          className="w-full cursor-pointer btn-purple h-[54px] rounded-3xl text-base font-semibold shadow-lg shadow-purple-100"
        >
          Save & Continue
        </Button>
        <button
          className="w-full cursor-pointer text-sm font-semibold text-[#6347F9] hover:underline"
          onClick={handleContinue}
        >
          Skip for now
        </button>
      </div>
      <AlertPopup popup={popup} onClose={() => setPopup(null)} />
    </div>
  );
};

export default ProfileDetails;
