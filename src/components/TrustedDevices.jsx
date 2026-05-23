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

const formatLastActive = (iso) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "Active now";
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
};

const iconFor = (name = "") => {
  const lower = name.toLowerCase();
  if (lower.includes("iphone") || lower.includes("android")) return Smartphone;
  if (lower.includes("ipad")) return Tablet;
  return Monitor;
};

const TrustedDevices = ({ onBack }) => {
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
            Trusted Devices
          </h1>
          <p className="hidden lg:block text-xs text-gray-400 font-bold">
            Manage devices logged into your account
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
              These are the devices currently logged into your account. Remove
              any devices you don't recognize.
            </p>
          </div>

          <div className="flex justify-between items-end px-1">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                {devices.length} Active
              </span>
              <h3 className="text-sm font-black text-gray-900">Devices</h3>
            </div>
            {devices.length > 1 && (
              <button
                onClick={() => setIsLogoutAllOpen(true)}
                className="text-[11px] font-black text-rose-500 hover:underline cursor-pointer"
              >
                Logout from others
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
              <p className="text-sm font-bold text-gray-400">No active devices</p>
              <p className="text-[11px] text-gray-300 mt-1">Sign in on a device to see it here</p>
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
                Security Tip
              </h4>
              <p className="text-[11px] lg:text-[12px] font-bold text-amber-600/80 leading-relaxed">
                If you see a device you don't recognize, remove it immediately.
                That device will be signed out within a minute.
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
            {device.device_name || "Unknown device"}
          </h4>
          {isCurrent && (
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[9px] font-black rounded-full border border-indigo-100">
              This device
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <span
            className={`text-[10px] font-bold ${
              isCurrent ? "text-emerald-500" : ""
            }`}
          >
            {formatLastActive(device.last_active_at)}
          </span>
        </div>
        {!isCurrent && (
          <button
            onClick={onRevoke}
            className="mt-3 px-4 py-2 border border-rose-100 text-rose-500 text-[10px] font-black rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
          >
            Remove Device
          </button>
        )}
      </div>
    </div>
  );
};

const LogoutAllModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
          <X size={28} className="text-rose-500" strokeWidth={3} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">
          Logout from other devices?
        </h3>
        <p className="text-sm font-medium text-gray-400 mb-8 leading-relaxed">
          You will be logged out from every device except this one. They'll
          have to sign in again.
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-500 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 bg-[#EF4444] rounded-2xl text-sm font-black text-white shadow-lg shadow-rose-100 cursor-pointer"
          >
            Logout Others
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrustedDevices;
