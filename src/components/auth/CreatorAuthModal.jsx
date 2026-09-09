"use client";

// Creator-only sign-in popup, shown when a logged-out visitor tries to APPLY
// to a campaign they reached from a shared link or the public campaign list.
//
// Why a modal instead of bouncing to /login: the visitor is mid-intent on a
// specific campaign. Sending them to a full-page role picker loses the
// context, and coming back lands them at the top of the page with no memory
// of what they were doing. The modal keeps the campaign underneath and, on
// success, hands control straight back to the page — no navigation at all.
//
// SCOPE, and the reason for it: LOG IN runs entirely in here (phone → OTP →
// session). SIGN UP cannot. Creator sign-up begins with Instagram OAuth,
// which is a full-page redirect to instagram.com — a modal cannot survive
// that. So sign-up hands off to /login?redirect=<this page>, and the
// existing redirect machinery there (which already persists the target
// across the OAuth round-trip via `rg_post_login_redirect`, and applies it on
// signup completion) returns the new creator to this exact campaign.
//
// The role is fixed to "influencer" — brands don't apply to campaigns. That
// is also what makes the phone pre-check meaningful: a brand's number gets
// told it's registered as a brand rather than silently signing them in to a
// surface they can't act on.

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X, ArrowLeft, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import SignInPhone from "@/components/login/SignInPhone";
import VerifyOTP from "@/components/login/VerifyOTP";

const ROLE = "influencer";

export default function CreatorAuthModal({ open, onClose, onSuccess, redirectTo, headline, subline }) {
  const t = useTranslations("CreatorAuthModal");
  const tAuth = useTranslations("Auth");
  const router = useRouter();
  const supabase = createClient();

  // "intro" → the two-way choice. "phone" → number entry. "otp" → code.
  const [step, setStep] = useState("intro");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);

  // Reset on every open so a previous half-finished attempt (a typed number,
  // a stale error) never greets the next visitor.
  useEffect(() => {
    if (!open) return;
    setStep("intro");
    setPhone("");
    setOtp("");
    setError("");
    setLoading(false);
  }, [open]);

  // Close on Escape — a modal that traps someone who changed their mind is
  // worse than no modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Hand off to the full-page flow, preserving where to come back to.
  // `redirect` is read by /login's resolvePostAuthTarget for sign-IN and
  // persisted to localStorage for the Instagram OAuth round-trip on sign-UP,
  // so both paths return here.
  const goToFullSignup = () => {
    const target = redirectTo || (typeof window !== "undefined" ? window.location.pathname : "/influencer");
    router.push(`/login?role=${ROLE}&signup=1&redirect=${encodeURIComponent(target)}`);
  };

  // Normalise to a bare country-coded number. Length-based, NOT
  // startsWith("91") — Indian mobiles can legitimately begin with 91
  // (e.g. 91136…), and a prefix test drops the country code for them.
  const normalise = (input) => {
    const digits = String(input).replace(/\D/g, "");
    return digits.length === 10 ? `91${digits}` : digits;
  };

  const sendOtp = async (phoneNumber) => {
    const formatted = normalise(phoneNumber);
    const { data, error: fnErr } = await supabase.functions.invoke("whatsapp-otp-sender", {
      body: { phone: formatted, role: ROLE },
    });
    if (fnErr) throw new Error(fnErr.message);
    if (data?.error) throw new Error(data.error);
    setPhone(`+${formatted}`);
  };

  const handleSendOtp = async (phoneNumber) => {
    setLoading(true);
    setError("");
    try {
      // Pre-check so an unregistered number is told to sign up instead of
      // burning an OTP send it can never complete.
      const { data: check, error: checkErr } = await supabase.functions.invoke("check-phone-exists", {
        body: { phone: phoneNumber, role: ROLE },
      });
      if (checkErr) throw new Error(checkErr.message);
      if (check?.error) throw new Error(check.error);

      if (!check?.exists) {
        setError(t("errors.notRegistered"));
        setLoading(false);
        return;
      }
      // Registered, but as a brand. Applying is creator-only, so there is
      // nothing useful to sign them in to here.
      if (check.match === false) {
        setError(t("errors.registeredAsBrand"));
        setLoading(false);
        return;
      }

      await sendOtp(phoneNumber);
      setStep("otp");
    } catch (err) {
      setError(err.message || tAuth("errors.sendOtpFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (phoneNumber) => {
    setError("");
    setResendSuccess(false);
    try {
      await sendOtp(phoneNumber);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err) {
      setError(err.message || tAuth("errors.resendOtpFailed"));
    }
  };

  const handleVerify = async (otpCode) => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("whatsapp-otp-verifier", {
        body: { phone, otp: otpCode, mode: "signin", reactivate: false },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data?.error) {
        // Not registered — the pre-check normally catches this, but a race
        // (account deleted between the two calls) can still land here.
        if (data.error === "no_user") {
          goToFullSignup();
          return;
        }
        // Reactivating a deactivated account is a deliberate, consequential
        // choice with its own confirmation copy. Send it to the full page
        // rather than reproducing that decision in a popup.
        if (data.error === "deactivated") {
          router.push(
            `/login?redirect=${encodeURIComponent(redirectTo || window.location.pathname)}`,
          );
          return;
        }
        throw new Error(data.message || data.error);
      }

      // Defence in depth: the pre-check already rejected brand numbers, but
      // never set a session for the wrong role — that silently signs someone
      // in to a surface they cannot act on.
      if (data?.user?.role && data.user.role !== ROLE) {
        setError(t("errors.registeredAsBrand"));
        setLoading(false);
        return;
      }

      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      // No navigation. The page keeps its scroll position and its campaign;
      // onSuccess re-reads the campaign so application state appears.
      onSuccess?.();
    } catch (err) {
      setError(err.message || tAuth("errors.verifyOtpFailed"));
      setLoading(false);
    }
  };

  const PERKS = [
    { icon: Zap, text: t("perks.apply") },
    { icon: ShieldCheck, text: t("perks.escrow") },
    { icon: Sparkles, text: t("perks.matched") },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      {/* Click-outside to dismiss. */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
          {step === "intro" ? (
            <span className="w-9" />
          ) : (
            <button
              onClick={() => {
                setError("");
                setStep(step === "otp" ? "phone" : "intro");
              }}
              className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              aria-label={t("back")}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
            aria-label={t("close")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-7 overflow-y-auto min-h-0">
          {step === "intro" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div
                  className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-100"
                  style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
                >
                  <Sparkles size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900">
                  {headline || t("title")}
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  {subline || t("subtitle")}
                </p>
              </div>

              <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4">
                {PERKS.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <Icon size={15} className="text-[#E60076] shrink-0" />
                    <p className="text-xs font-bold text-slate-600">{text}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <button
                  onClick={goToFullSignup}
                  className="w-full h-13 py-3.5 rounded-2xl text-white font-black text-sm cursor-pointer shadow-lg shadow-pink-100 hover:opacity-95 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
                >
                  {t("signUpCta")}
                </button>
                <button
                  onClick={() => {
                    setError("");
                    setStep("phone");
                  }}
                  className="w-full py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-sm cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  {t("logInCta")}
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-400 font-medium leading-relaxed">
                {t("creatorsOnly")}
              </p>
            </div>
          )}

          {step === "phone" && (
            <SignInPhone
              onNext={handleSendOtp}
              loading={loading}
              error={error}
              phone={phone.replace(/^\+91/, "")}
              setPhone={() => {}}
              mode="signin"
              role={ROLE}
            />
          )}

          {step === "otp" && (
            <VerifyOTP
              onNext={handleVerify}
              onResend={handleResend}
              loading={loading}
              error={error}
              otp={otp}
              setOtp={setOtp}
              phoneNumber={phone}
              resendSuccess={resendSuccess}
            />
          )}

          {step === "phone" && (
            <p className="mt-6 text-center text-xs text-slate-400 font-medium">
              {t("noAccount")}{" "}
              <button
                onClick={goToFullSignup}
                className="font-bold text-[#E60076] hover:underline cursor-pointer"
              >
                {t("signUpLink")}
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
