"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SignInPhone = ({
  onNext,
  loading = false,
  error = "",
  phone = "",
  setPhone = () => {},
  mode = "signin", // 'signin' or 'signup'
  minLen = 10,
  maxLen = 10,
  userExists = false,
  role = "influencer",
  onSwitchToSignIn = () => {},
}) => {
  const t = useTranslations("Auth.phone");
  const [localPhone, setLocalPhone] = useState(phone);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, maxLen);
    setLocalPhone(value);
    setPhone(value);
  };

  const handleSubmit = () => {
    if (localPhone.length < minLen || localPhone.length > maxLen) return;
    onNext(localPhone);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">
          {mode === "signup" ? t("titleSignup") : t("titleSignin")}
        </h2>
        <p className="text-sm text-slate-500">
          {mode === "signup" ? t("subtitleSignup") : t("subtitleSignin")}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {userExists && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center justify-between">
          <span>{t("userExists")}</span>
          <button
            onClick={onSwitchToSignIn}
            className="text-sm font-semibold text-[#6347F9] hover:underline ml-4"
          >
            {t("signIn")}
          </button>
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
            placeholder={t("placeholder")}
            maxLength={maxLen}
            disabled={loading}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={
            loading || localPhone.length < minLen || localPhone.length > maxLen
          }
          className={`w-full cursor-pointer ${role == "influencer" ? "btn-purple" : "bg-linear-to-b from-[#5B3DF5] to-[#7A5CFF]"} h-[54px] rounded-2xl text-base font-semibold shadow-lg shadow-purple-100`}
        >
          {loading
            ? t("sending")
            : mode === "signup"
              ? t("createAccount")
              : t("sendOtp")}
        </Button>
      </div>
    </div>
  );
};

export default SignInPhone;
