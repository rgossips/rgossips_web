"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const VerifyOTP = ({
  onNext,
  loading = false,
  error = "",
  otp = "",
  setOtp = () => {},
  phoneNumber = "+91 98765 43210",
}) => {
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = () => {
    if (otp.length === 6) {
      onNext(otp);
    }
  };

  const handleOtpChange = (newValue) => {
    setOtp(newValue);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Verify OTP</h2>
        <p className="text-slate-500 text-sm">
          Enter the 6-digit code sent to <br />
          <span className="font-semibold text-slate-900">{phoneNumber}</span>
        </p>
      </div>

      <div className="flex justify-center">
        <InputOTP maxLength={6} value={otp} onChange={handleOtpChange}>
          <InputOTPGroup className="gap-2">
            {[...Array(6)].map((_, i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="w-12 h-14 text-lg font-bold border-2 rounded-xl border-slate-200 data-[focus]:border-[#6347F9] data-[focus]:ring-0"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="space-y-4">
        <Button
          onClick={handleSubmit}
          disabled={loading || otp.length < 6}
          className="w-full cursor-pointer btn-purple h-[54px] rounded-2xl text-base font-semibold shadow-lg shadow-purple-100"
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </Button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="text-center">
          {timer > 0 ? (
            <p className="text-sm text-slate-400 font-medium">
              Resend code in{" "}
              <span className="text-[#6347F9] font-bold">
                0:{timer < 10 ? `0${timer}` : timer}
              </span>
            </p>
          ) : (
            <button
              className="text-sm cursor-pointer text-[#6347F9] font-bold hover:underline"
              onClick={() => setTimer(30)}
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
