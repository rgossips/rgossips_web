"use client";

import React, { useRef, useState } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

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
  const { user, profile, signOut, refreshProfile } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);

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

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("userId", user.id);
      fd.append("file", file, file.name);
      fd.append("table", "brand_profiles");
      const { data, error } = await supabase.functions.invoke("upload-profile-photo", {
        body: fd,
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      await refreshProfile();
    } catch (err) {
      setUploadError(err.message || "Failed to upload logo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveCategories = async (next) => {
    if (!user?.id) return;
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
      alert("Failed to update categories: " + err.message);
    }
  };

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-10 font-sans">
      <div className="bg-linear-to-b from-[#4C75BE] to-[#4A3996] pt-12 pb-8 px-6 rounded-b-4xl mb-20">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
      </div>

      {/* Main card */}
      <div className="px-6 -mt-4 mb-8">
        <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
          <div className="flex flex-col items-center -mt-16">
            <div className="relative">
              <div className="w-24 h-24 bg-[#2563eb] rounded-[28px] flex items-center justify-center text-white text-3xl font-bold shadow-xl overflow-hidden">
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
                onChange={handleLogoChange}
              />
            </div>

            {uploadError && (
              <p className="mt-2 text-[11px] text-red-500">{uploadError}</p>
            )}

            <div className="text-center mt-4">
              <h2 className="text-xl font-extrabold text-gray-900">
                {displayName}
              </h2>
              {profile.instagram_username && (
                <p className="text-[11px] text-gray-400 font-semibold mt-1">
                  @{profile.instagram_username}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-8">
        {/* Brand Info */}
        <Section title="Brand Information">
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
        <Section title="Contact Details">
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100/50">
            {profile.contact_name && (
              <InfoRow
                icon={<User />}
                iconColor="text-green-500"
                bgColor="bg-green-50"
                label={profile.contact_name}
                sub="Brand Manager"
              />
            )}
            {profile.contact_phone && (
              <InfoRow
                icon={<Phone />}
                iconColor="text-green-500"
                bgColor="bg-green-50"
                label={profile.contact_phone}
                sub="Business Mobile"
                isVerified
              />
            )}
            {profile.contact_email && (
              <InfoRow
                icon={<Mail />}
                iconColor="text-red-400"
                bgColor="bg-red-50"
                label={profile.contact_email}
                sub="Email"
                last
              />
            )}
            {!profile.contact_name && !profile.contact_phone && !profile.contact_email && (
              <div className="p-5 text-center">
                <p className="text-[11px] text-gray-400">No contact details yet.</p>
              </div>
            )}
          </div>
        </Section>

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

        {/* Logout */}
        <Section title="Account">
          <button
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            className="w-full bg-white p-5 rounded-3xl flex items-center gap-4 text-red-500 font-bold border border-gray-100/50 shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <div className="p-2 bg-red-50 rounded-xl">
              <LogOut size={18} />
            </div>
            <span>Log Out</span>
          </button>
        </Section>
      </div>

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

const InfoRow = ({ icon, iconColor, bgColor, label, sub, last, isVerified }) => (
  <div
    className={`flex items-center gap-4 p-5 ${!last ? "border-b border-gray-50" : ""}`}
  >
    <div className={`p-2.5 ${bgColor} ${iconColor} rounded-xl`}>
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-bold text-gray-900 leading-tight truncate">
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

export default BrandProfile;
