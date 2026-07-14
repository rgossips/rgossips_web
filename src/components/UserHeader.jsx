"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import AlertPopup from "@/components/AlertPopup";
import { useAuth } from "@/context/AuthContext"; // Use the global hook
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const PEXELS_BANNERS = [
  { id: 1, url: "/bg/green.png" },
  { id: 2, url: "/bg/blue.png" },
  { id: 3, url: "/bg/red.png" },
  { id: 4, url: "/bg/yellow.png" },
];

export default function UserHeader() {
  const t = useTranslations("UserHeader");
  // Pull profile, role, and the setter from global context
  const { user, profile, setProfile, role } = useAuth();

  const [popup, setPopup] = useState(null); // compact popup replacing window.alert()
  const [pendingBanner, setPendingBanner] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null); // "select" | "upload"

  // If still loading context, return null or a skeleton
  if (!profile) return null;

  /* ---------- Banner Selection ---------- */
  const handleSelectBanner = (url) => {
    setPendingBanner(url);
    setDialogType("select");
    setIsDialogOpen(true);
  };

  /* ---------- Confirm ---------- */
  const confirmBannerChange = async () => {
    if (!pendingBanner || !user) return;

    try {
      const bannerPath = pendingBanner.startsWith("/")
        ? pendingBanner
        : "/" + pendingBanner;

      // 1. Update Firestore (Determining collection based on global role)
      const collectionName = role === "influencer" ? "influencers" : "brands";
      const userRef = doc(db, collectionName, user.uid);

      await updateDoc(userRef, {
        banner: bannerPath,
      });

      // 2. IMPORTANT: Update Global Context State
      // This makes the banner change everywhere in the app instantly
      setProfile((prev) => ({
        ...prev,
        banner: bannerPath,
      }));

      setPendingBanner(null);
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Failed to update banner URL:", err);
      setPopup(t("errors.updateBanner"));
    }
  };

  const cancelBannerChange = () => {
    setPendingBanner(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      {/* Banner - Uses global profile state */}
      <div className="relative h-48 w-full">
        <img
          src={profile?.banner || "/bg/green.png"}
          alt="Banner"
          className="object-cover w-full h-full"
        />
      </div>

      {/* Profile Section */}
      <div className="flex flex-col items-center text-center p-6 -mt-20">
        <Image
          width={160}
          height={160}
          alt="user"
          src={profile?.profilePic || "/default-avatar.png"}
          className="w-40 h-40 rounded-full border-4 border-white shadow-lg z-20 object-cover"
        />

        <h2 className="text-2xl font-semibold mt-3">{profile?.name}</h2>
        <p className="text-gray-500 text-sm capitalize">{t("roleCreator", { role })}</p>
        <p className="text-pink-500 text-sm">{profile?.instagram}</p>
      </div>

      {/* Preset Selection */}
      <div className="px-6 pb-6">
        <p className="text-sm font-medium mb-3">{t("chooseBannerPreset")}</p>
        <div className="grid grid-cols-4 gap-3">
          {PEXELS_BANNERS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectBanner(item.url)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                profile?.banner === item.url
                  ? "border-blue-600 scale-95"
                  : "border-transparent hover:border-blue-300"
              }`}
            >
              <img
                src={item.url}
                alt="preset"
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-sm text-center shadow-2xl">
            <h3 className="text-lg font-bold mb-2">{t("applyBannerTitle")}</h3>

            {pendingBanner && (
              <div className="relative h-32 w-full rounded-xl overflow-hidden mb-6 border">
                <img
                  src={pendingBanner}
                  alt="preview"
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={cancelBannerChange}
                className="w-full py-3 rounded-xl border font-medium hover:bg-gray-50 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={confirmBannerChange}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
              >
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
      <AlertPopup popup={popup} onClose={() => setPopup(null)} />
    </div>
  );
}
