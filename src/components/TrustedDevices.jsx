import React, { useState } from "react";
import { ArrowLeft, Smartphone, Tablet, AlertTriangle, X } from "lucide-react";

const TrustedDevices = ({ onBack }) => {
  const [isLogoutAllOpen, setIsLogoutAllOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white pb-10 font-sans">
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 bg-pink-50 text-pink-500 rounded-full"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <h1 className="text-lg font-black tracking-tight">Trusted Devices</h1>
      </div>

      <div className="p-5 space-y-6">
        {/* Top Info Box */}
        <div className="bg-[#EBF3FF] p-5 rounded-[1.5rem] flex gap-4">
          <div className="mt-1 text-blue-500">
            <Smartphone size={20} />
          </div>
          <p className="text-[11px] font-bold text-gray-600 leading-relaxed">
            These are the devices currently logged into your account. Remove any
            devices you don't recognize.
          </p>
        </div>

        {/* Device List Header */}
        <div className="flex justify-between items-end px-1">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              2 Active
            </span>
            <h3 className="text-sm font-black text-gray-900">Devices</h3>
          </div>
          <button
            onClick={() => setIsLogoutAllOpen(true)}
            className="text-[11px] font-black text-rose-500 hover:underline"
          >
            Logout from all
          </button>
        </div>

        {/* Devices */}
        <div className="space-y-4">
          <DeviceCard
            icon={<Smartphone size={22} />}
            name="iPhone 14 Pro"
            location="New York, USA"
            status="Active now"
            isCurrent={true}
            color="bg-emerald-500"
          />
          <DeviceCard
            icon={<Tablet size={22} />}
            name="iPad Air"
            location="Los Angeles, USA"
            status="3 days ago"
            color="bg-blue-500"
          />
        </div>

        {/* Security Tip */}
        <div className="bg-[#FFF9E6] p-5 rounded-[1.5rem] flex gap-4 border border-yellow-100">
          <div className="mt-1 text-amber-500">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-[12px] font-black text-amber-700">
              Security Tip
            </h4>
            <p className="text-[11px] font-bold text-amber-600/80 leading-relaxed">
              If you see a device you don't recognize, remove it immediately and
              change your password.
            </p>
          </div>
        </div>
      </div>

      {/* Reusable Logout Modal tailored for "Logout All" */}
      <LogoutAllModal
        isOpen={isLogoutAllOpen}
        onClose={() => setIsLogoutAllOpen(false)}
        onConfirm={() => {
          console.log("Logged out from all devices");
          setIsLogoutAllOpen(false);
        }}
      />
    </div>
  );
};

// Device Item Component
const DeviceCard = ({ icon, name, location, status, isCurrent, color }) => (
  <div className="bg-white border border-gray-100 rounded-[2rem] p-5 flex items-start gap-4 shadow-sm">
    <div
      className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-gray-100`}
    >
      {icon}
    </div>
    <div className="flex-1 space-y-1">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-black text-gray-900">{name}</h4>
        {isCurrent && (
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[9px] font-black rounded-full border border-indigo-100">
            This device
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-gray-400">
        <span className="text-[10px] font-bold">{location}</span>
        <span className="w-1 h-1 bg-gray-200 rounded-full" />
        <span
          className={`text-[10px] font-bold ${isCurrent ? "text-emerald-500" : ""}`}
        >
          {status}
        </span>
      </div>
      {!isCurrent && (
        <button className="mt-3 px-4 py-2 border border-rose-100 text-rose-500 text-[10px] font-black rounded-xl hover:bg-rose-50 transition-colors">
          Remove Device
        </button>
      )}
    </div>
  </div>
);

// Customized Logout Modal
const LogoutAllModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
          <X size={28} className="text-rose-500" strokeWidth={3} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">
          Logout from all devices?
        </h3>
        <p className="text-sm font-medium text-gray-400 mb-8 leading-relaxed">
          You will be logged out from all devices except this one. You'll need
          to login again on those devices.
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 bg-[#EF4444] rounded-2xl text-sm font-black text-white shadow-lg shadow-rose-100"
          >
            Logout All
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrustedDevices;
