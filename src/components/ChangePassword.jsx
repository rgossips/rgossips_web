import React, { useState } from "react";
import { ArrowLeft, Lock, Eye, CheckCircle2, XCircle } from "lucide-react";
import { de } from "zod/v4/locales";

const ChangePassword = ({ onBack }) => {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validation Logic
  const requirements = [
    { label: "At least 8 characters", valid: newPassword.length >= 8 },
    {
      label: "Upper & lowercase letters",
      valid: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    },
    { label: "At least one number", valid: /\d/.test(newPassword) },
    {
      label: "At least one special character",
      valid: /[!@#$%^&*]/.test(newPassword),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      {/* Header */}
      <div className="sticky top-0 bg-white z-20 px-6 py-4 flex items-center gap-4 border-b border-gray-100">
        <button
          onClick={onBack}
          className="p-2 bg-pink-100 text-pink-500 rounded-full"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <h1 className="text-lg font-black tracking-tight">Change Password</h1>
      </div>

      <div className="p-5 space-y-6">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex gap-4 items-center">
          <div className="mt-1 text-blue-500">
            <Lock size={20} />
          </div>
          <p className="text-[11px] font-bold text-gray-600 leading-relaxed">
            Choose a strong password to keep your account secure. We recommend
            using a mix of letters, numbers, and symbols.
          </p>
        </div>

        {/* Inputs Section */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 shadow-md">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-900 ml-1">
              Current Password
            </label>
            <PasswordField placeholder="Enter current password" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-900 ml-1">
              New Password
            </label>
            <PasswordField
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-900 ml-1">
              Confirm New Password
            </label>
            <PasswordField placeholder="Re-enter new password" />
          </div>
        </div>

        {/* Dynamic Password Requirements */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-md">
          <h3 className="text-xs font-black text-gray-900 mb-4">
            Password Requirements
          </h3>
          <ul className="space-y-3">
            {requirements.map((req, idx) => (
              <li
                key={idx}
                className="flex items-center gap-3 transition-colors duration-300"
              >
                {req.valid ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <XCircle size={16} className="text-gray-300" />
                )}
                <span
                  className={`text-[11px] font-bold ${req.valid ? "text-gray-900" : "text-gray-400"}`}
                >
                  {req.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onBack}
            className="flex-1 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-500"
          >
            Cancel
          </button>
          <button className="flex-1 py-4 bg-emerald-500 rounded-2xl text-sm font-black text-white shadow-lg shadow-emerald-100">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Reusable Password Input
const PasswordField = ({ placeholder, value, onChange }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        <Lock size={18} />
      </div>
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-12 pr-12 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pink-100 transition-all placeholder:text-gray-300"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <Eye size={18} />
      </button>
    </div>
  );
};

export default ChangePassword;
