"use client";
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Smartphone,
  Monitor,
  Tablet,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { getDeviceId } from "@/utils/device-session";
import { useTranslations } from "next-intl";

const formatLastActive = (iso, t) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return t("time.activeNow");
  const min = Math.floor(diff / 60_000);
  if (min < 60) return t("time.minutesAgo", { min });
  const hr = Math.floor(min / 60);
  if (hr < 24) return t("time.hoursAgo", { hr });
  const day = Math.floor(hr / 24);
  if (day < 7) return t("time.daysAgo", { day });
  return new Date(iso).toLocaleDateString();
};

const iconFor = (name = "") => {
  const lower = name.toLowerCase();
  if (lower.includes("iphone") || lower.includes("android")) return Smartphone;
  if (lower.includes("ipad")) return Tablet;
  return Monitor;
};

const TrustedDevices = ({ onBack }) => {
  const t = useTranslations("TrustedDevices");
  const supabase = createClient();
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLogoutAllOpen, setIsLogoutAllOpen] = useState(false);
  const currentDeviceId = getDeviceId();

  const fetchDevices = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("device_sessions")
      .select("id, device_id, device_name, user_agent, last_active_at, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("last_active_at", { ascending: false });
    if (error) console.error("device_sessions read failed:", error.message);
    setDevices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDevices();
  }, [user?.id]);

  const revokeDevice = async (sessionId) => {
    await supabase
      .from("device_sessions")
      .update({ is_active: false })
      .eq("id", sessionId);
    setDevices((prev) => prev.filter((d) => d.id !== sessionId));
  };

  const logoutAll = async () => {
    if (!user?.id) return;
    // Revoke everything except this device — current device handles its own
    // sign-out via the Log Out button.
    await supabase
      .from("device_sessions")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .neq("device_id", currentDeviceId);
    setIsLogoutAllOpen(false);
    fetchDevices();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans lg:pt-24 lg:px-40">
      <div className="sticky top-0 bg-white lg:bg-gray-50 z-20 px-6 py-4 lg:px-8 flex items-center gap-4 border-b border-gray-100">
        <button
          onClick={onBack}
          className="p-2 bg-pink-50 cursor-pointer text-pink-500 rounded-full active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div>
          <h1 className="text-lg lg:text-2xl font-black tracking-tight">
            {t("header.title")}
          </h1>
          <p className="hidden lg:block text-xs text-gray-400 font-bold">
            {t("header.subtitle")}
          </p>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-7 lg:gap-8 lg:max-w-7xl lg:mx-auto lg:px-8 lg:py-8">
        <div className="lg:col-span-7 p-5 lg:p-0 space-y-6">
          <div className="bg-[#EBF3FF] p-5 lg:p-6 rounded-2xl flex gap-4">
            <div className="mt-1 text-blue-500 flex-shrink-0">
              <Smartphone size={20} />
            </div>
            <p className="text-[11px] lg:text-[12px] font-bold text-gray-600 leading-relaxed">
              {t("info.description")}
            </p>
          </div>

          <div className="flex justify-between items-end px-1">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                {t("activeCount", { count: devices.length })}
              </span>
              <h3 className="text-sm font-black text-gray-900">
                {t("devicesLabel")}
              </h3>
            </div>
            {devices.length > 1 && (
              <button
                onClick={() => setIsLogoutAllOpen(true)}
                className="text-[11px] font-black text-rose-500 hover:underline cursor-pointer"
              >
                {t("logoutFromOthers")}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-pink-500" />
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-12">
              <Smartphone size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400">{t("empty.title")}</p>
              <p className="text-[11px] text-gray-300 mt-1">{t("empty.subtitle")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((d) => (
                <DeviceCard
                  key={d.id}
                  device={d}
                  isCurrent={d.device_id === currentDeviceId}
                  onRevoke={() => revokeDevice(d.id)}
                />
              ))}
            </div>
          )}

          <div className="bg-[#FFF9E6] p-5 lg:p-6 rounded-2xl flex gap-4 border border-yellow-100">
            <div className="mt-1 text-amber-500 flex-shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div className="space-y-2">
              <h4 className="text-[12px] lg:text-[13px] font-black text-amber-700">
                {t("security.title")}
              </h4>
              <p className="text-[11px] lg:text-[12px] font-bold text-amber-600/80 leading-relaxed">
                {t("security.description")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <LogoutAllModal
        isOpen={isLogoutAllOpen}
        onClose={() => setIsLogoutAllOpen(false)}
        onConfirm={logoutAll}
      />
    </div>
  );
};

const DeviceCard = ({ device, isCurrent, onRevoke }) => {
  const t = useTranslations("TrustedDevices");
  const Icon = iconFor(device.device_name || device.user_agent || "");
  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-5 flex items-start gap-4 shadow-sm">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-gray-100 ${
          isCurrent ? "bg-emerald-500" : "bg-blue-500"
        }`}
      >
        <Icon size={22} />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-black text-gray-900">
            {device.device_name || t("unknownDevice")}
          </h4>
          {isCurrent && (
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[9px] font-black rounded-full border border-indigo-100">
              {t("thisDevice")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <span
            className={`text-[10px] font-bold ${
              isCurrent ? "text-emerald-500" : ""
            }`}
          >
            {formatLastActive(device.last_active_at, t)}
          </span>
        </div>
        {!isCurrent && (
          <button
            onClick={onRevoke}
            className="mt-3 px-4 py-2 border border-rose-100 text-rose-500 text-[10px] font-black rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
          >
            {t("removeDevice")}
          </button>
        )}
      </div>
    </div>
  );
};

const LogoutAllModal = ({ isOpen, onClose, onConfirm }) => {
  const t = useTranslations("TrustedDevices");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
          <X size={28} className="text-rose-500" strokeWidth={3} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">
          {t("modal.title")}
        </h3>
        <p className="text-sm font-medium text-gray-400 mb-8 leading-relaxed">
          {t("modal.description")}
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-500 cursor-pointer"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 bg-[#EF4444] rounded-2xl text-sm font-black text-white shadow-lg shadow-rose-100 cursor-pointer"
          >
            {t("logoutOthers")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrustedDevices;
