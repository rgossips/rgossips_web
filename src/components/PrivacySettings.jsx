import React, { useState } from "react";
import {
  ArrowLeft,
  Eye,
  Shield,
  Lock,
  Smartphone,
  UserMinus,
  ChevronRight,
} from "lucide-react";

const PrivacySecurityPage = ({
  onBack,
  onPasswordChange,
  onTrustedDevices,
  onDeactiveAccount,
}) => {
  // State for toggles
  const [settings, setSettings] = useState({
    publicProfile: true,
    showEmail: false,
    activityStatus: true,
    searchIndexing: true,
    twoFactor: true,
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white z-20 px-6 py-4 flex items-center gap-4 border-b border-gray-100">
        <button
          onClick={onBack}
          className="p-2 bg-pink-50 text-pink-500 rounded-full active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <h1 className="text-lg font-black tracking-tight">
          Privacy & Security
        </h1>
      </div>

      <div className="p-5 space-y-8">
        {/* Privacy Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="p-2 bg-blue-100 text-blue-500 rounded-xl">
              <Eye size={18} />
            </div>
            <h3 className="font-black text-xs uppercase tracking-wider text-gray-900">
              Privacy
            </h3>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 space-y-6 shadow-md">
            <ToggleRow
              title="Public Profile"
              description="Allow brands to find your profile"
              isEnabled={settings.publicProfile}
              onToggle={() => toggleSetting("publicProfile")}
            />
            <ToggleRow
              title="Show Email"
              description="Display email on public profile"
              isEnabled={settings.showEmail}
              onToggle={() => toggleSetting("showEmail")}
            />
            <ToggleRow
              title="Activity Status"
              description="Show when you're online"
              isEnabled={settings.activityStatus}
              onToggle={() => toggleSetting("activityStatus")}
            />
            <ToggleRow
              title="Search Indexing"
              description="Allow search engines to index profile"
              isEnabled={settings.searchIndexing}
              onToggle={() => toggleSetting("searchIndexing")}
            />
          </div>
        </section>

        {/* Security Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="p-2 bg-emerald-100 text-emerald-500 rounded-xl">
              <Shield size={18} />
            </div>
            <h3 className="font-black text-xs uppercase tracking-wider text-gray-900">
              Security
            </h3>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 space-y-6 shadow-md">
            {/* 2FA Toggle */}
            <ToggleRow
              title="Two-Factor Authentication"
              description="Extra security for your account"
              isEnabled={settings.twoFactor}
              onToggle={() => toggleSetting("twoFactor")}
            />

            <div className="h-[1px] bg-gray-50 w-full" />

            {/* Security Links */}
            <SecurityLink
              icon={<Lock size={18} />}
              onClick={onPasswordChange}
              title="Change Password"
              description="Update your password"
            />
            <SecurityLink
              onClick={onTrustedDevices}
              icon={<Smartphone size={18} />}
              title="Trusted Devices"
              description="Manage your devices"
            />
            <SecurityLink
              onClick={onDeactiveAccount}
              icon={<UserMinus size={18} />}
              title="Deactivate Account"
              description="Temporarily disable your account"
              isDestructive
            />
          </div>
        </section>
      </div>
    </div>
  );
};

// Toggle Row Component
const ToggleRow = ({ title, description, isEnabled, onToggle }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="space-y-1">
      <h4 className="text-[13px] font-black text-gray-900">{title}</h4>
      <p className="text-[10px] font-bold text-gray-400">{description}</p>
    </div>
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 outline-none border-2 ${
        isEnabled
          ? "bg-pink-500 border-pink-500"
          : "bg-gray-100 border-gray-200"
      }`}
      aria-pressed={isEnabled}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
          isEnabled ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

// Navigation Link Component
const SecurityLink = ({ icon, title, description, isDestructive, onClick }) => (
  <div
    className="flex items-center gap-4 cursor-pointer active:opacity-60 transition-opacity"
    onClick={onClick}
  >
    <div
      className={`p-2.5 rounded-xl ${isDestructive ? "bg-red-100 text-red-500" : "bg-gray-100 text-gray-600"}`}
    >
      {icon}
    </div>
    <div className="flex-1 space-y-1">
      <h4
        className={`text-[13px] font-black ${isDestructive ? "text-red-500" : "text-gray-900"}`}
      >
        {title}
      </h4>
      <p className="text-[10px] font-bold text-gray-400">{description}</p>
    </div>
    <ChevronRight size={18} className="text-gray-300" />
  </div>
);

export default PrivacySecurityPage;
