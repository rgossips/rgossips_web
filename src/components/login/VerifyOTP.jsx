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
  onResend,
  loading = false,
  error = "",
  otp = "",
  setOtp = () => {},
  phoneNumber = "+91 98765 43210",
  resendSuccess = false,
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

      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
        <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
            <path d="M20.52 3.48A11.93 11.93 0 0012.04 0C5.46 0 .1 5.36.08 11.94c0 2.1.55 4.16 1.6 5.97L0 24l6.27-1.64a11.97 11.97 0 005.77 1.47h.01c6.58 0 11.93-5.36 11.94-11.94a11.86 11.86 0 00-3.47-8.41zM12.05 21.8h-.01a9.93 9.93 0 01-5.06-1.39l-.36-.21-3.72.97.99-3.62-.24-.37a9.93 9.93 0 01-1.53-5.27c0-5.48 4.46-9.94 9.95-9.94 2.66 0 5.16 1.04 7.04 2.92a9.89 9.89 0 012.91 7.03c-.01 5.48-4.47 9.94-9.97 9.94zm5.46-7.45c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01a1.1 1.1 0 00-.8.37c-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.21 5.09 4.5.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-emerald-900">Your OTP just slid into WhatsApp 💌</p>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Look for the friendly ping from <span className="font-bold">Rgossips Media</span>.
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <InputOTP maxLength={6} value={otp} onChange={handleOtpChange} autoFocus>
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

        {resendSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600 text-center">
            OTP sent successfully!
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
              onClick={() => {
                setTimer(30);
                if (onResend) onResend();
              }}
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
