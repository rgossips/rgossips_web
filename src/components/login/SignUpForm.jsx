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
import { User, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const SignUpForm = ({
  onSubmit,
  onSendOtp,
  onResendOtp,
  onVerifyOtp,
  loading = false,
  error = "",
  role = "influencer",
  initialPhone = "",
  otpPreVerified = false,
  instagramProfile = null,
}) => {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    name: "",
    phone: initialPhone,
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(otpPreVerified);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [localError, setLocalError] = useState("");

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
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

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
    if (!otpVerified) {
      setLocalError("Please verify your phone number");
      return;
    }
    onSubmit({ ...formData });
  };

  const displayError = error || localError;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[75vh] overflow-y-auto px-1">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
        <p className="text-sm text-slate-500">
          Fill in your details to get started
        </p>
      </div>

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

        {/* Full Name */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 ml-1">
            Full Name
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
          disabled={loading || !formData.name || !otpVerified}
          className="w-full cursor-pointer btn-purple h-[54px] rounded-2xl text-base font-semibold shadow-lg shadow-purple-100 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </div>
    </div>
  );
};

export default SignUpForm;
