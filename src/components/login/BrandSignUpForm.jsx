"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  User,
  CheckCircle2,
  Loader2,
  Building2,
  MapPin,
  BadgeCheck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const BrandSignUpForm = ({
  onSubmit,
  onSendOtp,
  onResendOtp,
  onVerifyOtp,
  loading = false,
  error = "",
  initialPhone = "",
  otpPreVerified = false,
  instagramProfile = null,
  invitation = null,
}) => {
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: invitation?.brand_name || invitation?.full_name || "",
    phone: initialPhone,
    gstin: "",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(otpPreVerified);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [localError, setLocalError] = useState("");

  // GSTIN state
  const [gstinLoading, setGstinLoading] = useState(false);
  const [gstinData, setGstinData] = useState(null);
  const [gstinError, setGstinError] = useState("");

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.replace(/\D/g, "").slice(0, 10),
      }));
      if (otpSent) {
        setOtpSent(false);
        setOtpVerified(false);
        setOtp("");
      }
    } else if (name === "gstin") {
      const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
      setFormData((prev) => ({ ...prev, gstin: cleaned }));
      if (gstinData) {
        setGstinData(null);
        setGstinError("");
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // --- GSTIN Verification ---
  const handleVerifyGstin = async () => {
    if (formData.gstin.length !== 15) return;
    setGstinLoading(true);
    setGstinError("");
    try {
      const { data, error: funcError } = await supabase.functions.invoke(
        "verify-gstin",
        { body: { gstin: formData.gstin } }
      );

      if (funcError) throw new Error(funcError.message);
      if (data?.error) throw new Error(data.error);

      if (!data?.verified) {
        setGstinError("GSTIN not found or inactive");
        return;
      }

      if (data.data.gstStatus !== "Active") {
        setGstinError(`GSTIN status: ${data.data.gstStatus}. Only active GSTINs are allowed.`);
        return;
      }

      // Check GSTIN uniqueness
      const { data: uniqueCheck } = await supabase.functions.invoke(
        "check-uniqueness",
        { body: { gstin: formData.gstin } }
      );
      if (uniqueCheck?.conflicts?.includes("gstin")) {
        setGstinError("This GSTIN is already registered with another account.");
        return;
      }

      setGstinData(data.data);
    } catch (err) {
      setGstinError(err.message || "Failed to verify GSTIN");
    } finally {
      setGstinLoading(false);
    }
  };

  // --- Phone OTP ---
  const handleSendOtp = async () => {
    if (formData.phone.length < 10) return;
    setOtpLoading(true);
    setLocalError("");
    try {
      // Check phone uniqueness first
      const { data: uniqueCheck } = await supabase.functions.invoke(
        "check-uniqueness",
        { body: { phone: formData.phone } }
      );
      if (uniqueCheck?.conflicts?.includes("phone")) {
        setLocalError("This phone number is already registered. Please sign in instead.");
        setOtpLoading(false);
        return;
      }
      await onSendOtp(formData.phone);
      setOtpSent(true);
      setTimer(30);
    } catch (err) {
      setLocalError(err.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setVerifyLoading(true);
    setLocalError("");
    try {
      await onVerifyOtp(formData.phone, otp);
      setOtpVerified(true);
    } catch (err) {
      setLocalError(err.message || "Invalid OTP");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    setOtpLoading(true);
    setLocalError("");
    try {
      await onResendOtp(formData.phone);
      setTimer(30);
      setOtp("");
    } catch (err) {
      setLocalError(err.message || "Failed to resend OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setLocalError("Please enter your full name");
      return;
    }
    if (!gstinData) {
      setLocalError("Please verify your GSTIN");
      return;
    }
    if (!otpVerified) {
      setLocalError("Please verify your phone number");
      return;
    }
    onSubmit({ ...formData, gstinData });
  };

  const displayError = error || localError;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[75vh] overflow-y-auto px-1">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">
          {invitation ? "Complete Your Profile" : "Register Brand"}
        </h2>
        <p className="text-sm text-slate-500">
          {invitation
            ? "Your brand has been pre-registered. Verify your details to get started."
            : "Verify your business to start collaborating"}
        </p>
      </div>

      {/* Admin Invitation Banner */}
      {invitation && (
        <div className="p-4 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 flex items-center gap-3">
          {invitation.logo_url ? (
            <img src={invitation.logo_url} alt={invitation.brand_name} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9810FA] to-[#E60076] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {invitation.brand_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900">{invitation.brand_name}</p>
            <p className="text-[11px] text-purple-600 font-medium">Pre-registered by RecentGossips</p>
          </div>
          <BadgeCheck size={20} className="text-purple-500 shrink-0" />
        </div>
      )}

      {displayError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {displayError}
        </div>
      )}

      <div className="space-y-4">
        {/* Instagram Connected Badge */}
        {instagramProfile && (
          <div className="p-3 rounded-xl border border-green-200 bg-green-50/50 flex items-center gap-3">
            {instagramProfile.profilePictureUrl ? (
              <img src={instagramProfile.profilePictureUrl} alt={instagramProfile.username} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F77737] via-[#E1306C] to-[#833AB4] flex items-center justify-center text-white font-bold text-sm">
                {instagramProfile.username?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">@{instagramProfile.username}</p>
              <p className="text-[10px] text-slate-400">Instagram connected</p>
            </div>
            <CheckCircle2 size={18} className="text-green-500 shrink-0" />
          </div>
        )}

        {/* Contact Name */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 ml-1">
            Contact Person Name
          </Label>
          <div className="relative">
            <User
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6347F9]/60"
              size={18}
            />
            <Input
              placeholder="Your full name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="h-12 pl-12 rounded-xl border-slate-200 focus-visible:ring-[#6347F9]"
            />
          </div>
        </div>

        {/* GSTIN Verification */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 ml-1">
            GSTIN Number <span className="text-red-400">*</span>
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Building2
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6347F9]/60"
                size={18}
              />
              <Input
                placeholder="e.g. 22AAAAA0000A1Z5"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                disabled={!!gstinData}
                maxLength={15}
                className="h-12 pl-12 rounded-xl border-slate-200 focus-visible:ring-[#6347F9] uppercase tracking-wider font-mono"
              />
            </div>
            {!gstinData && (
              <Button
                onClick={handleVerifyGstin}
                disabled={formData.gstin.length !== 15 || gstinLoading}
                className="h-12 px-4 rounded-xl btn-purple text-sm font-semibold cursor-pointer whitespace-nowrap"
              >
                {gstinLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Verify"
                )}
              </Button>
            )}
            {gstinData && (
              <div className="h-12 px-3 flex items-center">
                <CheckCircle2 size={22} className="text-green-500" />
              </div>
            )}
          </div>

          {gstinError && (
            <p className="text-xs text-red-500 ml-1">{gstinError}</p>
          )}

          {/* GSTIN Verified Details Card */}
          {gstinData && (
            <div className="p-3 rounded-xl bg-green-50/70 border border-green-200 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <BadgeCheck size={16} className="text-green-600" />
                <span className="text-xs font-bold text-green-700">
                  GSTIN Verified
                </span>
                <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                  {gstinData.gstStatus}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  {gstinData.tradeName || gstinData.legalName}
                </p>
                {gstinData.tradeName && gstinData.legalName !== gstinData.tradeName && (
                  <p className="text-[11px] text-slate-500">
                    Legal: {gstinData.legalName}
                  </p>
                )}
                <div className="flex items-start gap-1 text-[11px] text-slate-500">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  <span>{gstinData.address}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {gstinData.businessType} · Regd: {gstinData.registrationDate}
                </p>
              </div>
              <button
                onClick={() => {
                  setGstinData(null);
                  setFormData((prev) => ({ ...prev, gstin: "" }));
                }}
                className="text-[11px] text-red-400 hover:text-red-600 font-semibold cursor-pointer"
              >
                Change GSTIN
              </button>
            </div>
          )}
        </div>

        {/* Phone + OTP */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 ml-1">
            Mobile Number
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 border-r pr-2 border-slate-200">
                <span className="text-sm font-semibold text-slate-700">
                  +91
                </span>
              </div>
              <Input
                type="tel"
                placeholder="Enter phone number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={otpVerified}
                className="h-12 pl-16 rounded-xl border-slate-200 focus-visible:ring-[#6347F9]"
              />
            </div>
            {!otpVerified && !otpSent && (
              <Button
                onClick={handleSendOtp}
                disabled={formData.phone.length < 10 || otpLoading}
                className="h-12 px-4 rounded-xl btn-purple text-sm font-semibold cursor-pointer whitespace-nowrap"
              >
                {otpLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Send OTP"
                )}
              </Button>
            )}
            {otpVerified && (
              <div className="h-12 px-3 flex items-center">
                <CheckCircle2 size={22} className="text-green-500" />
              </div>
            )}
          </div>

          {/* OTP Input */}
          {otpSent && !otpVerified && (
            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
                  <InputOTPGroup className="gap-1.5">
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="w-10 h-12 text-lg font-bold border-2 rounded-lg border-slate-200 data-[focus]:border-[#6347F9] data-[focus]:ring-0"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={handleVerifyOtp}
                  disabled={otp.length < 6 || verifyLoading}
                  className="h-9 px-8 rounded-lg btn-purple text-sm font-semibold cursor-pointer"
                >
                  {verifyLoading ? (
                    <Loader2 size={14} className="animate-spin mr-1" />
                  ) : null}
                  Verify
                </Button>
                <div className="text-center">
                  {timer > 0 ? (
                    <p className="text-xs text-slate-400">
                      Resend in{" "}
                      <span className="text-[#6347F9] font-bold">
                        0:{timer < 10 ? `0${timer}` : timer}
                      </span>
                    </p>
                  ) : (
                    <button
                      className="text-xs cursor-pointer text-[#6347F9] font-bold hover:underline"
                      onClick={handleResend}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button
          onClick={handleSubmit}
          disabled={loading || !formData.name || !gstinData || !otpVerified}
          className="w-full cursor-pointer btn-purple h-[54px] rounded-2xl text-base font-semibold shadow-lg shadow-purple-100 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Creating account...
            </>
          ) : (
            "Create Brand Account"
          )}
        </Button>
      </div>
    </div>
  );
};

export default BrandSignUpForm;
