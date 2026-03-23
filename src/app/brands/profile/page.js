"use client";

import React from "react";
import {
  ChevronLeft,
  CheckCircle2,
  ChevronRight,
  Globe,
  MapPin,
  Briefcase,
  User,
  Phone,
  Mail,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  FileText,
  Lock,
  Bell,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";

const BrandProfile = () => {
  const router = useRouter();

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-10 font-sans">
      {/* 1. Header Section - No overlap with the card below */}
      <div className="bg-linear-to-b from-[#4C75BE] to-[#4A3996] pt-12 pb-8 px-6 rounded-b-4xl mb-20">
        <div className="flex items-center text-white mb-4">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <div className="w-8" />
        </div>
      </div>

      {/* 2. Main Profile Card - Now positioned completely outside/below the blue header */}
      <div className="px-6 -mt-4 mb-8">
        <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
          {/* Avatar positioned relatively within the card flow */}
          <div className="flex flex-col items-center -mt-16">
            <div className="relative">
              <div className="w-24 h-24 bg-[#2563eb] rounded-[28px] flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                N
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md">
                <div className="bg-blue-600 p-1.5 rounded-full text-white">
                  <Instagram size={12} />
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center justify-center gap-1.5">
                Nike India
                <CheckCircle2
                  size={18}
                  className="text-blue-500 fill-blue-500/10"
                />
              </h2>
              <p className="text-[11px] text-gray-400 font-semibold mt-1">
                @nikeindia • ID: NK-I30452
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            <StatBox label="Campaigns" value="58" color="text-blue-600" />
            <StatBox label="Rating" value="4.8★" color="text-green-500" />
            <StatBox label="Paid Out" value="₹4.2Cr" color="text-orange-500" />
          </div>
        </div>
      </div>

      {/* 3. Information Sections */}
      <div className="px-6 space-y-8">
        {/* Brand Info */}
        <Section title="Brand Information">
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100/50">
            <InfoRow
              icon={<Briefcase />}
              iconColor="text-blue-400"
              bgColor="bg-blue-50"
              label="Nike India Pvt. Ltd."
              sub="Brand / Company Name"
            />
            <InfoRow
              icon={<Globe />}
              iconColor="text-blue-500"
              bgColor="bg-blue-50"
              label="nikeindia.com"
              sub="Website"
              isLink
            />
            <InfoRow
              icon={<MapPin />}
              iconColor="text-blue-300"
              bgColor="bg-blue-50"
              label="Mumbai, Maharashtra"
              sub="Headquarters"
            />
            <InfoRow
              icon={<Briefcase />}
              iconColor="text-blue-400"
              bgColor="bg-blue-50"
              label="Sportswear • Fitness • Lifestyle"
              sub="Brand Categories"
              last
            />
          </div>
        </Section>

        {/* Contact Details */}
        <Section title="Contact Details">
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100/50">
            <InfoRow
              icon={<User />}
              iconColor="text-green-400"
              bgColor="bg-green-50"
              label="Nishant Mehta"
              sub="Brand Manager"
            />
            <InfoRow
              icon={<Phone />}
              iconColor="text-green-500"
              bgColor="bg-green-50"
              label="+91 91001 10001"
              sub="Business Mobile"
              isVerified
            />
            <InfoRow
              icon={<Mail />}
              iconColor="text-red-400"
              bgColor="bg-red-50"
              label="collaboration@nikeindia.com"
              sub="Partnership Email"
              isVerified
              last
            />
          </div>
        </Section>

        {/* Social Media */}
        <Section title="Social Media">
          <div className="grid grid-cols-2 gap-3">
            <SocialCard
              icon={<Instagram className="text-white" />}
              iconBg="bg-pink-500"
              label="Instagram"
              handle="@nikeindia"
            />
            <SocialCard
              icon={<Youtube className="text-white" />}
              iconBg="bg-red-600"
              label="YouTube"
              handle="@nikeindia"
            />
            <SocialCard
              icon={<Twitter className="text-white" />}
              iconBg="bg-black"
              label="X (Twitter)"
              handle="@nikeindia"
            />
            <SocialCard
              icon={<Facebook className="text-white" />}
              iconBg="bg-blue-600"
              label="Facebook"
              handle="Nike India"
            />
          </div>
        </Section>

        {/* Docs */}
        <Section title="Tax & Legal Documents">
          <DocCard
            type="GST Registration"
            status="Active"
            id="27AAACN0611Q1Z4"
            details={[
              { label: "Business Type", val: "Pvt. Ltd." },
              { label: "State Code", val: "27 - Maharashtra" },
              { label: "Reg. Date", val: "01 Jul 2017" },
              { label: "Filing Cycle", val: "Monthly" },
            ]}
          />
        </Section>

        {/* Account & Logout */}
        <Section title="Account">
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100/50 mb-4">
            <ControlRow
              icon={<Lock />}
              iconColor="text-blue-500"
              bgColor="bg-blue-50"
              label="Change Password"
            />
            <ControlRow
              icon={<Bell />}
              iconColor="text-blue-400"
              bgColor="bg-blue-50"
              label="Notification Preferences"
            />
            <ControlRow
              icon={<Settings />}
              iconColor="text-orange-400"
              bgColor="bg-orange-50"
              label="Account Settings"
              last
            />
          </div>
          <button
            onClick={() => {
              router.push("/login");
            }}
            className="w-full bg-white p-5 rounded-3xl flex items-center gap-4 text-red-500 font-bold border border-gray-100/50 shadow-sm active:scale-95 transition-transform"
          >
            <div className="p-2 bg-red-50 rounded-xl">
              <LogOut size={18} />
            </div>
            <span>Log Out</span>
          </button>
        </Section>
      </div>
    </div>
  );
};

/* --- Helpers --- */

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.15em] px-2">
      {title}
    </h3>
    {children}
  </div>
);

const StatBox = ({ label, value, color }) => (
  <div className="bg-[#F8F9FE] py-3 px-1 rounded-2xl text-center border border-gray-50">
    <p className={`text-[13px] font-extrabold ${color}`}>{value}</p>
    <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5 tracking-tight">
      {label}
    </p>
  </div>
);

const InfoRow = ({
  icon,
  iconColor,
  bgColor,
  label,
  sub,
  last,
  isLink,
  isVerified,
}) => (
  <div
    className={`flex items-center gap-4 p-5 ${!last ? "border-b border-gray-50" : ""}`}
  >
    <div className={`p-2.5 ${bgColor} ${iconColor} rounded-xl`}>
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <div className="flex-1">
      <p className="text-[11px] font-bold text-gray-900 leading-tight">
        {label}
      </p>
      <p className="text-[9px] text-gray-400 font-semibold mt-0.5">{sub}</p>
    </div>
    <div className="flex items-center gap-2">
      {isVerified && (
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
      )}
      {isLink ? (
        <ExternalLink size={14} className="text-gray-300" />
      ) : (
        <ChevronRight size={16} className="text-gray-300" />
      )}
    </div>
  </div>
);

const SocialCard = ({ icon, iconBg, label, handle }) => (
  <div className="bg-white p-4 rounded-2xl border border-gray-50 flex items-center gap-3">
    <div className={`p-2 ${iconBg} rounded-lg`}>
      {React.cloneElement(icon, { size: 16 })}
    </div>
    <div className="overflow-hidden">
      <p className="text-[8px] text-gray-400 font-extrabold uppercase leading-none">
        {label}
      </p>
      <p className="text-[10px] font-bold text-gray-900 mt-1 truncate">
        {handle}
      </p>
    </div>
  </div>
);

const DocCard = ({ type, status, id, details }) => (
  <div className="bg-white rounded-[32px] p-6 border border-gray-100/50 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400" />
    <div className="flex justify-between items-start mb-6">
      <div className="flex gap-3">
        <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500">
          <FileText size={20} />
        </div>
        <div>
          <h4 className="text-[11px] font-extrabold text-gray-900">{type}</h4>
          <p className="text-[9px] text-gray-400 font-semibold">
            Goods & Services Tax
          </p>
        </div>
      </div>
      <span className="text-[9px] font-bold px-3 py-1 bg-green-50 text-green-500 rounded-lg uppercase tracking-wider">
        {status}
      </span>
    </div>

    <div className="mb-5">
      <p className="text-[8px] text-gray-400 font-extrabold uppercase mb-1">
        GSTIN Number
      </p>
      <p className="text-[13px] font-extrabold text-gray-900 tracking-wider">
        {id}
      </p>
    </div>

    <div className="grid grid-cols-2 gap-y-4">
      {details.map((d, i) => (
        <div key={i}>
          <p className="text-[8px] text-gray-400 font-extrabold uppercase mb-0.5">
            {d.label}
          </p>
          <p className="text-[10px] font-bold text-gray-900">{d.val}</p>
        </div>
      ))}
    </div>
  </div>
);

const ControlRow = ({ icon, iconColor, bgColor, label, last }) => (
  <div
    className={`flex items-center gap-4 p-5 ${!last ? "border-b border-gray-50" : ""}`}
  >
    <div className={`p-2.5 ${bgColor} ${iconColor} rounded-xl`}>
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <span className="flex-1 text-[11px] font-bold text-gray-700">{label}</span>
    <ChevronRight size={16} className="text-gray-300" />
  </div>
);

export default BrandProfile;
