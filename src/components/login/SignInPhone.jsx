"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SignInPhone = ({
  onNext,
  loading = false,
  error = "",
  phone = "",
  setPhone = () => {},
}) => {
  const [localPhone, setLocalPhone] = useState(phone);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setLocalPhone(value);
    setPhone(value);
  };

  const handleSubmit = () => {
    if (localPhone.length < 10) {
      return;
    }
    onNext(localPhone);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
        <p className="text-sm text-slate-500">
          Enter your mobile number to continue
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="relative">
          {/* Country Code Prefix */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 border-r pr-2 border-slate-200">
            <span className="text-sm font-semibold text-slate-700">+91</span>
          </div>

          <Input
            type="tel"
            value={localPhone}
            onChange={handlePhoneChange}
            className="h-14 pl-16 rounded-2xl border-slate-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#6347F9] focus-visible:ring-offset-0 transition-all"
            placeholder="Enter phone number"
            maxLength="10"
            disabled={loading}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || localPhone.length < 10}
          className="w-full btn-purple h-[54px] rounded-2xl text-base font-semibold shadow-lg shadow-purple-100"
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </Button>
      </div>
    </div>
  );
};

export default SignInPhone;
