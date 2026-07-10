"use client";

import React, { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  ChevronRight,
  MapPin,
  Briefcase,
  User,
  Phone,
  Mail,
  Instagram,
  FileText,
  LogOut,
  Pencil,
  Camera,
  Loader2,
  X,
  Check,
  Plus,
  RotateCcw,
  UserMinus,
  Trash2,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import { useGlobalLoading } from "@/context/LoadingContext";
import LogoutConfirmDialog from "@/components/LogoutConfirmDialog";
import AlertPopup from "@/components/AlertPopup";
import BrandAccountActionsModal from "@/components/brands/BrandAccountActionsModal";
import TrustScoreInfoModal from "@/components/brands/TrustScoreInfoModal";
import InfoBadge from "@/components/brands/InfoBadge";
import { useBrandTrustScore } from "@/hooks/useBrandTrustScore";

// Cropper is heavy and only needed when user uploads a new logo — lazy-load it.
const Cropper = dynamic(() => import("react-easy-crop"), { ssr: false });

const CATEGORIES = [
  "Beauty & Skincare",
  "Fashion & Lifestyle",
  "Food & Beverage",
  "Health, Fitness & Wellness",
  "Travel & Hospitality",
  "Technology & Gadgets",
  "Parenting & Family",
  "Home & Decor",
  "Finance & Personal Finance",
  "Education & Career",
  "Gaming & Entertainment",
  "Automobile & Mobility",
  "Entrepreneurship & Business",
  "Sustainable & Eco-conscious Living",
  "Pet Care & Animals",
];

const BrandProfile = () => {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const { startLoading, stopLoading } = useGlobalLoading();
  const { trust, completion } = useBrandTrustScore();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [brandInfoOpen, setBrandInfoOpen] = useState(false);
  const [popup, setPopup] = useState(null); // compact popup replacing window.alert()
  const [contactOpen, setContactOpen] = useState(false);
  const [trustInfoOpen, setTrustInfoOpen] = useState(false);
  const [accountAction, setAccountAction] = useState(null); // "deactivate" | "delete" | null

  // Maps a profile-completion field label to the modal that lets the brand
  // fill it in — so the missing-field chips in the completion card are
  // actionable rather than just informational.
  const openFieldEditor = (label) => {
    if (label === "Contact email") setContactOpen(true);
    else if (label === "Categories") setCategoriesOpen(true);
    else if (label === "GST / PAN") setBrandInfoOpen(true);
  };

  // Cropper state for new logo upload
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const onCropComplete = useCallback((_, px) => setCroppedAreaPixels(px), []);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#5851DB]" />
      </div>
    );
  }

  const brandName =
    profile.gstin_trade_name ||
    profile.brand_name ||
    profile.contact_name ||
    "Brand";
  const displayName = profile.gstin_trade_name || profile.brand_name || brandName;
  const logoUrl = profile.logo_url;
  const initials = displayName.charAt(0).toUpperCase();
  const categories = Array.isArray(profile.categories) ? profile.categories : [];

  const handleLogoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getCroppedBlob = async (src, pixelCrop) => {
    const img = new window.Image();
    img.src = src;
    await new Promise((r) => (img.onload = r));
    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      img,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
    return new Promise((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92)
    );
  };

  const handleCropSave = async () => {
    if (!croppedAreaPixels || !imageSrc || !user?.id) return;
    setUploading(true);
    setUploadError("");
    startLoading("Uploading logo…");
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const fd = new FormData();
      fd.append("userId", user.id);
      fd.append("file", blob, "logo.jpg");
      fd.append("table", "brand_profiles");
      const { data, error } = await supabase.functions.invoke("upload-profile-photo", {
        body: fd,
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      await refreshProfile();
      setImageSrc(null);
    } catch (err) {
      setUploadError(err.message || "Failed to upload logo");
    } finally {
      setUploading(false);
      stopLoading();
    }
  };

  // Revert to the original Instagram-derived logo. Edge function looks up the
  // file create-profile saved at brand-icons/profiles/{userId}.jpg during
  // signup and restores logo_url to point at it.
  const handleRevertLogo = async () => {
    if (!user?.id) return;
    if (!window.confirm("Revert to your Instagram profile picture? Your custom upload will be replaced.")) return;
    setUploading(true);
    setUploadError("");
    startLoading("Reverting logo…");
    try {
      const { data, error } = await supabase.functions.invoke("update-profile", {
        body: {
          userId: user.id,
          table: "brand_profiles",
          revertBrandLogo: true,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      await refreshProfile();
    } catch (err) {
      setUploadError(err.message || "Failed to revert");
    } finally {
      setUploading(false);
      stopLoading();
    }
  };

  const saveCategories = async (next) => {
    if (!user?.id) return;
    startLoading("Saving categories…");
    try {
      const { data, error } = await supabase.functions.invoke("update-profile", {
        body: {
          userId: user.id,
          table: "brand_profiles",
          categories: next,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      await refreshProfile();
    } catch (err) {
      setPopup("Failed to update categories: " + err.message);
    } finally {
      stopLoading();
    }
  };

  // Single edit path for both modals — the shape of `payload` matches the
  // edge function's camelCase field names so callers don't have to know
  // about DB column names.
  const saveBrandFields = async (payload, loadingMsg) => {
    if (!user?.id) return;
    startLoading(loadingMsg);
    try {
      const { data, error } = await supabase.functions.invoke("update-profile", {
        body: {
          userId: user.id,
          table: "brand_profiles",
          ...payload,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      await refreshProfile();
    } catch (err) {
      setPopup("Failed to save: " + err.message);
      throw err;
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-10 font-sans">
      <div className="bg-linear-to-b from-[#4C75BE] to-[#4A3996] pt-12 pb-8 px-6 rounded-b-4xl mb-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
        </div>
      </div>

      {/* Hero card — logo + name + handle in a horizontal layout */}
      <div className="max-w-6xl mx-auto px-6 -mt-4 mb-8">
        <div className="bg-white rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
          {/* Avatar */}
          <div className="relative shrink-0 -mt-16 sm:-mt-20">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#2563eb] rounded-[28px] flex items-center justify-center text-white text-3xl font-bold shadow-xl overflow-hidden">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={20} className="text-white animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md cursor-pointer disabled:cursor-not-allowed"
              title="Change logo"
            >
              <div className="bg-[#5851DB] p-1.5 rounded-full text-white">
                <Camera size={12} />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoPick}
            />
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h2 className="text-2xl font-extrabold text-gray-900 break-words">
              {displayName}
            </h2>
            <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {profile.instagram_username && (
                <a
                  href={`https://instagram.com/${profile.instagram_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#E1306C] bg-pink-50 px-3 py-1.5 rounded-full hover:bg-pink-100 cursor-pointer"
                >
                  <Instagram size={12} />@{profile.instagram_username}
                </a>
              )}
              {profile.gstin_status && (
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full ${
                    profile.gstin_status === "Active"
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-gray-600 bg-gray-100"
                  }`}
                >
                  GST {profile.gstin_status}
                </span>
              )}
              {(profile.categories?.length || 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5851DB] bg-[#EBE9FE] px-3 py-1.5 rounded-full">
                  {profile.categories.length} categor{profile.categories.length === 1 ? "y" : "ies"}
                </span>
              )}
            </div>
            {logoUrl && (
              <button
                onClick={handleRevertLogo}
                disabled={uploading}
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-[#5851DB] cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={12} /> Revert logo to default
              </button>
            )}
            {uploadError && (
              <p className="mt-2 text-[11px] text-red-500">{uploadError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Profile completion + trust score */}
      <div className="max-w-6xl mx-auto px-6 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-gray-100/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Profile completion
            </p>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                completion.percent >= 100
                  ? "bg-emerald-50 text-emerald-600"
                  : completion.percent >= 67
                  ? "bg-indigo-50 text-indigo-600"
                  : "bg-orange-50 text-orange-600"
              }`}
            >
              {completion.percent}%
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completion.percent >= 100
                  ? "bg-emerald-500"
                  : completion.percent >= 67
                  ? "bg-indigo-500"
                  : "bg-orange-500"
              }`}
              style={{ width: `${completion.percent}%` }}
            />
          </div>
          {completion.missing.length > 0 ? (
            <p className="text-[11px] text-gray-500 leading-snug">
              Add{" "}
              {completion.missing.map((label, i) => (
                <React.Fragment key={label}>
                  {i > 0 && ", "}
                  <button
                    type="button"
                    onClick={() => openFieldEditor(label)}
                    className="font-semibold text-[#5851DB] underline decoration-dotted underline-offset-2 hover:text-[#4338CA] cursor-pointer"
                  >
                    {label}
                  </button>
                </React.Fragment>
              ))}{" "}
              to complete your profile.
            </p>
          ) : (
            <p className="text-[11px] text-emerald-600 font-semibold">
              Your brand profile is fully complete.
            </p>
          )}
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100/50 shadow-sm relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Trust score
              </p>
              <button
                type="button"
                onClick={() => setTrustInfoOpen((v) => !v)}
                aria-label="How is the trust score calculated?"
                title="How is this calculated?"
                className="cursor-pointer hover:scale-110 transition-transform inline-flex"
              >
                <InfoBadge size={18} />
              </button>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                trust.band === "Excellent" ? "bg-emerald-50 text-emerald-600" :
                trust.band === "Very Good" ? "bg-blue-50 text-blue-600" :
                trust.band === "Good"      ? "bg-indigo-50 text-indigo-600" :
                trust.band === "Fair"      ? "bg-amber-50 text-amber-600" :
                                             "bg-rose-50 text-rose-600"
              }`}
            >
              {trust.band}
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900 mb-1">
            {trust.score}
            <span className="text-sm font-bold text-gray-400 ml-1">/{trust.scaleMax ?? 900}</span>
          </p>
          {/* B13 — same phrasing as BrandHero + TrustSection so the
              cold-start caption reads identically on every surface. */}
          {trust.coldStart && (
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">
              Capped at {trust.coldStartCap} · {trust.coldStartThreshold ?? 3} campaigns to lift
            </p>
          )}
          <p className="text-[11px] text-gray-400 leading-snug">
            A weighted blend of five pillars — influencer reviews, campaign
            execution, verification, communication, and platform engagement.
            Tap the <Info size={11} className="inline -translate-y-px" /> to see the breakdown.
          </p>

          <TrustScoreInfoModal open={trustInfoOpen} onClose={() => setTrustInfoOpen(false)} />
        </div>
      </div>

      {/* Balanced two-column grid below */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="space-y-8 min-w-0">
        {/* Brand Info */}
        <Section
          title="Brand Information"
          action={
            <button
              onClick={() => setBrandInfoOpen(true)}
              className="flex items-center gap-1 text-[10px] font-bold text-[#5851DB] cursor-pointer"
            >
              <Pencil size={11} /> Edit
            </button>
          }
        >
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100/50">
            <InfoRow
              icon={<Briefcase />}
              iconColor="text-blue-500"
              bgColor="bg-blue-50"
              label={profile.gstin_legal_name || profile.brand_name || "—"}
              sub="Legal Name"
            />
            {profile.gstin_trade_name &&
              profile.gstin_trade_name !== profile.gstin_legal_name && (
                <InfoRow
                  icon={<Briefcase />}
                  iconColor="text-blue-400"
                  bgColor="bg-blue-50"
                  label={profile.gstin_trade_name}
                  sub="Trade Name"
                />
              )}
            {profile.gstin_business_type && (
              <InfoRow
                icon={<Briefcase />}
                iconColor="text-blue-400"
                bgColor="bg-blue-50"
                label={profile.gstin_business_type}
                sub="Business Type"
              />
            )}
            {(profile.gstin_address || profile.gstin_state) && (
              <InfoRow
                icon={<MapPin />}
                iconColor="text-blue-400"
                bgColor="bg-blue-50"
                label={
                  profile.gstin_address ||
                  `${profile.gstin_state || ""} ${profile.gstin_pincode || ""}`.trim()
                }
                sub="Registered Address"
                last
              />
            )}
          </div>
        </Section>

        {/* Categories */}
        <Section
          title="Categories"
          action={
            <button
              onClick={() => setCategoriesOpen(true)}
              className="flex items-center gap-1 text-[10px] font-bold text-[#5851DB] cursor-pointer"
            >
              <Pencil size={11} /> Edit
            </button>
          }
        >
          <div className="bg-white rounded-3xl p-5 border border-gray-100/50">
            {categories.length === 0 ? (
              <button
                onClick={() => setCategoriesOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold text-[#5851DB] border-2 border-dashed border-purple-200 rounded-2xl hover:bg-purple-50 cursor-pointer"
              >
                <Plus size={14} /> Add categories
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1.5 bg-[#EBE9FE] text-[#5851DB] rounded-full text-[11px] font-semibold"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Contact Details */}
        <Section
          title="Contact Details"
          action={
            <button
              onClick={() => setContactOpen(true)}
              className="flex items-center gap-1 text-[10px] font-bold text-[#5851DB] cursor-pointer"
            >
              <Pencil size={11} /> Edit
            </button>
          }
        >
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100/50">
            <InfoRow
              icon={<User />}
              iconColor="text-green-500"
              bgColor="bg-green-50"
              label={profile.contact_name || "Add brand manager name"}
              sub="Brand Manager"
              muted={!profile.contact_name}
            />
            <InfoRow
              icon={<Phone />}
              iconColor="text-green-500"
              bgColor="bg-green-50"
              label={profile.contact_phone || "Add business mobile"}
              sub="Business Mobile"
              isVerified={!!profile.contact_phone}
              muted={!profile.contact_phone}
            />
            <InfoRow
              icon={<Mail />}
              iconColor="text-red-400"
              bgColor="bg-red-50"
              label={profile.contact_email || "Add email address"}
              sub="Email"
              last
              muted={!profile.contact_email}
            />
          </div>
        </Section>
        </div>

        {/* Right column */}
        <div className="space-y-8 min-w-0">
        {/* Social */}
        {profile.instagram_username && (
          <Section title="Social">
            <a
              href={`https://instagram.com/${profile.instagram_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-4 rounded-2xl border border-gray-100/50 flex items-center gap-3 cursor-pointer"
            >
              <div className="p-2 bg-pink-500 rounded-lg">
                <Instagram size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] text-gray-400 font-extrabold uppercase">
                  Instagram
                </p>
                <p className="text-[11px] font-bold text-gray-900 truncate">
                  @{profile.instagram_username}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </a>
          </Section>
        )}

        {/* GSTIN */}
        {profile.gstin && (
          <Section title="Tax & Legal Documents">
            <div className="bg-white rounded-[32px] p-6 border border-gray-100/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400" />
              <div className="flex justify-between items-start mb-5">
                <div className="flex gap-3">
                  <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-extrabold text-gray-900">
                      GST Registration
                    </h4>
                    <p className="text-[9px] text-gray-400 font-semibold">
                      Goods & Services Tax
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[9px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider ${
                    profile.gstin_status === "Active"
                      ? "bg-green-50 text-green-500"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {profile.gstin_status || "—"}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-[8px] text-gray-400 font-extrabold uppercase mb-1">
                  GSTIN Number
                </p>
                <p className="text-[13px] font-extrabold text-gray-900 tracking-wider">
                  {profile.gstin}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-y-4">
                {profile.gstin_business_type && (
                  <Detail label="Business Type" value={profile.gstin_business_type} />
                )}
                {profile.gstin_state && (
                  <Detail label="State" value={profile.gstin_state} />
                )}
                {profile.gstin_registration_date && (
                  <Detail
                    label="Reg. Date"
                    value={profile.gstin_registration_date}
                  />
                )}
                {profile.gstin_pincode && (
                  <Detail label="Pincode" value={profile.gstin_pincode} />
                )}
              </div>
            </div>
          </Section>
        )}

        {/* Account */}
        <Section title="Account">
          <div className="bg-white rounded-3xl border border-gray-100/50 shadow-sm overflow-hidden divide-y divide-gray-50">
            <button
              onClick={() => setLogoutOpen(true)}
              className="w-full p-5 flex items-center gap-4 text-red-500 font-bold active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="p-2 bg-red-50 rounded-xl">
                <LogOut size={18} />
              </div>
              <span>Log Out</span>
            </button>

            <button
              onClick={() => setAccountAction("deactivate")}
              className="w-full p-5 flex items-start gap-4 text-left active:scale-[0.98] transition-transform cursor-pointer hover:bg-amber-50/40"
            >
              <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                <UserMinus size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">Deactivate Account</p>
                <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                  Temporarily hide your brand. Sign back in to restore.
                </p>
              </div>
            </button>

            <button
              onClick={() => setAccountAction("delete")}
              className="w-full p-5 flex items-start gap-4 text-left active:scale-[0.98] transition-transform cursor-pointer hover:bg-red-50/40"
            >
              <div className="p-2 bg-red-50 rounded-xl text-red-500">
                <Trash2 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-600">Delete Account</p>
                <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                  Soft delete with a 30-day grace period — admin can restore on request.
                </p>
              </div>
            </button>
          </div>
        </Section>
        <LogoutConfirmDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
        <BrandAccountActionsModal
          variant={accountAction}
          open={accountAction !== null}
          onClose={() => setAccountAction(null)}
        />
        </div>
      </div>

      {/* Crop logo modal */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 bg-black/50">
            <button
              onClick={() => {
                setImageSrc(null);
                setCroppedAreaPixels(null);
                setZoom(1);
                setCrop({ x: 0, y: 0 });
              }}
              disabled={uploading}
              className="text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <h3 className="text-white text-sm font-bold">Crop Logo</h3>
            <button
              onClick={handleCropSave}
              disabled={uploading || !croppedAreaPixels}
              className="text-sm font-bold px-5 py-2 rounded-xl transition-all disabled:opacity-50 bg-[#5851DB] text-white"
            >
              {uploading ? "Saving..." : "Save"}
            </button>
          </div>
          <div className="flex-1 relative">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="px-8 py-5 bg-black/50 flex items-center gap-4">
            <span className="text-white/60 text-xs font-bold shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-purple-500"
            />
          </div>
        </div>
      )}

      {categoriesOpen && (
        <CategoriesModal
          initial={categories}
          onClose={() => setCategoriesOpen(false)}
          onSave={async (next) => {
            await saveCategories(next);
            setCategoriesOpen(false);
          }}
        />
      )}

      {brandInfoOpen && (
        <BrandInfoModal
          profile={profile}
          onClose={() => setBrandInfoOpen(false)}
          onSave={async (payload) => {
            await saveBrandFields(payload, "Saving brand information…");
            setBrandInfoOpen(false);
          }}
        />
      )}

      {contactOpen && (
        <ContactDetailsModal
          profile={profile}
          onClose={() => setContactOpen(false)}
          onSave={async (payload) => {
            await saveBrandFields(payload, "Saving contact details…");
            setContactOpen(false);
          }}
        />
      )}
      <AlertPopup popup={popup} onClose={() => setPopup(null)} />
    </div>
  );
};

/* --- Helpers --- */

const Section = ({ title, children, action }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between px-2">
      <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.15em]">
        {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
);

const InfoRow = ({ icon, iconColor, bgColor, label, sub, last, isVerified, muted }) => (
  <div
    className={`flex items-center gap-4 p-5 ${!last ? "border-b border-gray-50" : ""}`}
  >
    <div className={`p-2.5 ${bgColor} ${iconColor} rounded-xl`}>
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <div className="flex-1 min-w-0">
      <p
        className={`text-[11px] font-bold leading-tight truncate ${
          muted ? "text-gray-400 italic font-medium" : "text-gray-900"
        }`}
      >
        {label}
      </p>
      <p className="text-[9px] text-gray-400 font-semibold mt-0.5">{sub}</p>
    </div>
    {isVerified && (
      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
    )}
  </div>
);

const Detail = ({ label, value }) => (
  <div>
    <p className="text-[8px] text-gray-400 font-extrabold uppercase mb-0.5">
      {label}
    </p>
    <p className="text-[10px] font-bold text-gray-900">{value}</p>
  </div>
);

const TrustComponent = ({ label, weight, percent, detail }) => (
  <div>
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-bold text-gray-700">{label}</span>
      <span className="text-[10px] font-bold text-[#5851DB] shrink-0">
        {percent}% · {weight} weight
      </span>
    </div>
    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1.5">
      <div
        className="h-full rounded-full bg-[#5851DB] transition-all"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
    <p className="text-[10px] text-gray-400 mt-1">{detail}</p>
  </div>
);

const CategoriesModal = ({ initial, onClose, onSave }) => {
  const [selected, setSelected] = useState(initial || []);
  const [saving, setSaving] = useState(false);

  const toggle = (c) =>
    setSelected((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center bg-black/40">
      <div className="w-full lg:max-w-md bg-white rounded-t-[32px] lg:rounded-[32px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Edit Categories</h3>
            <p className="text-[11px] text-gray-400">
              {selected.length} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 cursor-pointer"
            disabled={saving}
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const on = selected.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggle(c)}
                  className={`px-3 py-2 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    on
                      ? "bg-[#EBE9FE] border-[#5851DB] text-[#5851DB]"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {on && <Check size={12} />}
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={saving}
            className="py-3.5 rounded-2xl font-bold text-sm text-gray-700 border border-gray-200 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setSaving(true);
              await onSave(selected);
              setSaving(false);
            }}
            disabled={saving}
            className="py-3.5 rounded-2xl font-bold text-sm text-white bg-[#5851DB] shadow-lg shadow-purple-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Shared modal shell — same shape as CategoriesModal but reusable.
const EditModal = ({ title, subtitle, onClose, onSave, children, saveLabel = "Save", canSave = true }) => {
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center bg-black/40">
      <div className="w-full lg:max-w-lg bg-white rounded-t-[32px] lg:rounded-[32px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 -mr-2 cursor-pointer" disabled={saving}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">{children}</div>

        <div className="grid grid-cols-2 gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={saving}
            className="py-3.5 rounded-2xl font-bold text-sm text-gray-700 border border-gray-200 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setSaving(true);
              try {
                await onSave();
              } catch {
                /* parent handles error toast */
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving || !canSave}
            className="py-3.5 rounded-2xl font-bold text-sm text-white bg-[#5851DB] shadow-lg shadow-purple-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", placeholder, hint, ...props }) => (
  <div>
    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">
      {label}
    </label>
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-3.5 bg-gray-50 border border-gray-100 focus:border-purple-300 focus:bg-white rounded-xl text-sm font-bold text-gray-700 outline-none transition-all"
      {...props}
    />
    {hint && <p className="text-[10px] text-gray-400 mt-1 ml-1">{hint}</p>}
  </div>
);

const BrandInfoModal = ({ profile, onClose, onSave }) => {
  const [brandName, setBrandName] = useState(profile.brand_name || "");
  const [legalName, setLegalName] = useState(profile.gstin_legal_name || "");
  const [tradeName, setTradeName] = useState(profile.gstin_trade_name || "");
  const [businessType, setBusinessType] = useState(profile.gstin_business_type || "");
  const [address, setAddress] = useState(profile.gstin_address || "");
  const [state, setState] = useState(profile.gstin_state || "");
  const [pincode, setPincode] = useState(profile.gstin_pincode || "");

  return (
    <EditModal
      title="Edit Brand Information"
      subtitle="Visible to brands and creators on your profile"
      onClose={onClose}
      onSave={() =>
        onSave({
          brandName: brandName.trim(),
          gstinLegalName: legalName.trim(),
          gstinTradeName: tradeName.trim(),
          gstinBusinessType: businessType.trim(),
          gstinAddress: address.trim(),
          gstinState: state.trim(),
          gstinPincode: pincode.trim(),
        })
      }
    >
      <Field label="Brand Name" value={brandName} onChange={setBrandName} placeholder="e.g. Recent Gossips" hint="Used everywhere your brand is displayed." />
      <Field label="Legal Name" value={legalName} onChange={setLegalName} placeholder="As per GSTIN" />
      <Field label="Trade Name" value={tradeName} onChange={setTradeName} placeholder="Common name customers know you by" />
      <Field label="Business Type" value={businessType} onChange={setBusinessType} placeholder="e.g. Private Limited Company" />
      <Field label="Registered Address" value={address} onChange={setAddress} placeholder="Street, area" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="State" value={state} onChange={setState} placeholder="State" />
        <Field label="Pincode" value={pincode} onChange={(v) => setPincode(v.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit pincode" inputMode="numeric" />
      </div>
      {profile.gstin && (
        <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          These fields were auto-filled from GSTIN <span className="font-bold">{profile.gstin}</span>. Edits override the auto-fill but the original GSTIN is still on file.
        </p>
      )}
    </EditModal>
  );
};

const ContactDetailsModal = ({ profile, onClose, onSave }) => {
  const [contactName, setContactName] = useState(profile.contact_name || "");
  const [contactEmail, setContactEmail] = useState(profile.contact_email || "");

  const emailLooksOk =
    !contactEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim());

  // Phone is the account's login identity (OTP) — changing it from a profile
  // form would let a signed-in user lock themselves out. Surfaced read-only.
  return (
    <EditModal
      title="Edit Contact Details"
      subtitle="Used for campaign messaging and payouts"
      onClose={onClose}
      canSave={emailLooksOk}
      onSave={() =>
        onSave({
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
        })
      }
    >
      <Field label="Brand Manager" value={contactName} onChange={setContactName} placeholder="Person we'd reach out to" />

      <div>
        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">
          Business Mobile
        </label>
        <div className="w-full p-3.5 bg-gray-100 border border-gray-100 rounded-xl text-sm font-bold text-gray-500 flex items-center justify-between gap-3">
          <span className="truncate">{profile.contact_phone || "—"}</span>
          <span className="text-[10px] font-bold text-gray-400 shrink-0">Login number · not editable</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 ml-1">Contact support to change the phone number on your account.</p>
      </div>

      <Field label="Email" value={contactEmail} onChange={setContactEmail} type="email" placeholder="hello@yourbrand.com" hint="We'll send campaign updates and invoices here." />
      {contactEmail && !emailLooksOk && (
        <p className="text-[11px] text-rose-600 font-bold">That doesn't look like a valid email address.</p>
      )}
    </EditModal>
  );
};

export default BrandProfile;
