import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const PEXELS_BANNERS = [
  { id: 1, url: "/bg/green.png" },
  { id: 2, url: "/bg/blue.png" },
  { id: 3, url: "/bg/red.png" },
  { id: 4, url: "/bg/yellow.png" },
];

export default function UserHeader({ userData }) {
  const [banner, setBanner] = useState(
    userData?.banner ? userData.banner : "/bg/green.png"
  );

  const { user } = useAuth();
  const [pendingBanner, setPendingBanner] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null); // "select" | "upload"

  /* ---------- Banner Selection ---------- */
  const handleSelectBanner = (url) => {
    setPendingBanner(url);
    setDialogType("select");
    setIsDialogOpen(true);
  };

  /* ---------- Upload ---------- */
  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPendingBanner(url);
    setDialogType("upload");
    setIsDialogOpen(true);
  };

  /* ---------- Confirm ---------- */
  const confirmBannerChange = async () => {
    if (!pendingBanner || !user) return;

    try {
      // Update Firestore
      const userRef = doc(db, "influencers", user.uid);
      await updateDoc(userRef, {
        banner: pendingBanner.startsWith("/")
          ? pendingBanner
          : "/" + pendingBanner,
      });

      // Update local state
      setBanner(pendingBanner);
      setPendingBanner(null);
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Failed to update banner URL:", err);
    }
  };
  /* ---------- Cancel ---------- */
  const cancelBannerChange = () => {
    setPendingBanner(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      {/* Banner */}
      <div className="relative h-48 w-full">
        <img src={banner} alt="Banner" className="object-cover w-full h-full" />
      </div>

      {/* Profile */}
      <div className="flex flex-col items-center text-center p-6 -mt-20">
        <Image
          width={300}
          height={300}
          alt="user"
          src={userData?.profilePic}
          className="w-40 h-40 rounded-full border-4 border-white shadow-lg z-20"
        />

        <h2 className="text-2xl font-semibold mt-3">{userData?.name}</h2>
        <p className="text-gray-500 text-sm">Influencer • Creator</p>
        <p className="text-pink-500 text-sm">{userData?.instagram}</p>
      </div>

      {/* Presets */}
      <div className="px-6 pb-6">
        <p className="text-sm font-medium mb-3">Choose a banner</p>

        <div className="grid grid-cols-4 gap-3 overflow-x-hidden">
          {PEXELS_BANNERS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectBanner(item.url)}
              className="relative aspect-square rounded-lg overflow-hidden border hover:border-blue-500 shrink-0 cursor-pointer"
            >
              <img src={item.url} alt="banner" className="object-cover" />
            </button>
          ))}
        </div>

        {/* Upload Button */}
        {/* <label className="block mt-4">
          <div className="w-full text-center py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
            Upload New Banner
          </div>
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleBannerUpload}
          />
        </label> */}
      </div>

      {/* Confirmation Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-2">
              {dialogType === "upload"
                ? "Upload banner for your profile?"
                : "Apply this banner?"}
            </h3>

            {pendingBanner && (
              <div className="relative h-32 w-full rounded-lg overflow-hidden mb-4">
                <img
                  src={pendingBanner}
                  alt="preview"
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={cancelBannerChange}
                className="w-full py-2 rounded-lg border cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmBannerChange}
                className="w-full py-2 cursor-pointer rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
