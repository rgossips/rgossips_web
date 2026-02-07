"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGlobal } from "@/context/GlobalContext";
import { z } from "zod";
import OnboardingCarousel from "@/components/login/OnboardingCarousel";
import RoleSelection from "@/components/login/RoleSelection";
import SignInPhone from "@/components/login/SignInPhone";
import VerifyOTP from "@/components/login/VerifyOTP";
import ProfileDetails from "@/components/login/ProfileDetails";
import CategorySelection from "@/components/login/CategorySelection";
import Preferences from "@/components/login/Preferences";
import Notifications from "@/components/login/Notifications";
import SuccessScreen from "@/components/login/SuccessScreen";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import Image from "next/image";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase";

const BrandSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const InfluencerSchema = z.object({
  phone: z.string().min(10, "Enter a valid phone number"),
});

const Login = () => {
  const router = useRouter();
  const { type, setType } = useGlobal();
  const [flow, setFlow] = useState("onboarding");
  const [step, setStep] = useState(1);

  // Auth states
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const goToSignIn = () => {
    setFlow("signin");
    setStep(1);
  };
  const goToSignUp = () => {
    setFlow("signup");
    setStep(1);
  };
  const nextStep = () => setStep((s) => s + 1);

  // Initialize RecAPTCHA
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        },
      );
    }
  }, []);

  // Handle Phone Sign In - Send OTP
  const handlePhoneSignIn = async (phoneNumber) => {
    setLoading(true);
    setError("");
    try {
      const formattedPhone = "+91" + phoneNumber.replace(/\D/g, "").slice(-10);
      setPhone(formattedPhone);

      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier,
      );
      setConfirmationResult(result);
      setOtpSent(true);
      nextStep();
    } catch (err) {
      setError(err.message || "Failed to send OTP");
      console.error("Phone sign-in error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification
  const handleVerifyOTP = async (otpCode) => {
    setLoading(true);
    setError("");
    try {
      if (!confirmationResult) {
        throw new Error("No confirmation result found");
      }
      await confirmationResult.confirm(otpCode);

      // OTP verified successfully
      console.log("User signed in successfully");

      if (flow === "signin") {
        router.push("/");
      } else {
        nextStep();
      }
    } catch (err) {
      setError(err.message || "Invalid OTP");
      console.error("OTP verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0F0F1A] overflow-hidden">
      {/* LEFT: Onboarding Carousel */}
      <div
        className={`w-full md:w-[60%] h-full transition-all duration-500 ${flow !== "onboarding" ? "hidden md:block" : "block"}`}
      >
        <OnboardingCarousel
          onLoginClick={goToSignIn}
          onSignUpClick={goToSignUp}
        />
      </div>

      {/* RIGHT: Auth Container */}
      <div
        className={`absolute inset-0 z-20 flex flex-col justify-end md:relative md:inset-auto md:w-[40%] md:h-full md:justify-center ${flow === "onboarding" ? "hidden md:flex" : "flex"}`}
      >
        {/* Mobile Background Overlay */}
        {flow !== "onboarding" && (
          <div
            className="absolute inset-0 bg-[#0F0F1A]/90 md:hidden"
            style={{
              background:
                "radial-gradient(circle at top, rgba(99, 71, 249, 0.15) 0%, rgba(15, 15, 26, 0.98) 100%)",
            }}
            onClick={() => setFlow("onboarding")}
          />
        )}

        {/* Desktop/Mobile Auth Container */}
        <div
          className="auth-drawer-card relative z-10 w-full px-8 pt-10 pb-12 
                        md:bg-white md:border-none md:shadow-none md:rounded-none md:h-full md:flex md:items-center 
                        overflow-y-auto animate-in slide-in-from-bottom md:slide-in-from-right duration-500"
        >
          {/* Mobile Drawer Handle */}
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-8 md:hidden" />

          <div className="w-full max-w-md mx-auto py-8">
            {/* 1. ONBOARDING SELECTION (Desktop Only) */}
            {flow === "onboarding" && (
              <div className="hidden md:flex flex-col items-center text-center space-y-8">
                <div className="my-20">
                  <Image src={logo} alt="logo" className="h-16" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-slate-900">
                    Get Started
                  </h2>
                  <p className="text-slate-500">
                    Join the elite community of brands and creators.
                  </p>
                </div>
                <div className="w-full space-y-4">
                  <Button
                    onClick={goToSignUp}
                    className="w-full btn-purple h-14 rounded-2xl text-lg font-semibold cursor-pointer"
                  >
                    Create Account
                  </Button>
                  <Button
                    onClick={goToSignIn}
                    variant="outline"
                    className="w-full h-14 rounded-2xl text-lg font-semibold border-slate-200 cursor-pointer"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            )}

            {/* 2. SIGN IN FLOW */}
            {flow === "signin" && (
              <>
                {step === 1 && (
                  <SignInPhone
                    onNext={handlePhoneSignIn}
                    loading={loading}
                    error={error}
                    phone={phone}
                    setPhone={setPhone}
                  />
                )}
                {step === 2 && (
                  <VerifyOTP
                    onNext={handleVerifyOTP}
                    loading={loading}
                    error={error}
                    otp={otp}
                    setOtp={setOtp}
                    phoneNumber={phone}
                  />
                )}
              </>
            )}

            {/* 3. SIGN UP FLOW */}
            {flow === "signup" && (
              <div className="space-y-6">
                {step === 1 && <RoleSelection onNext={nextStep} />}
                {step === 2 && <ProfileDetails onNext={nextStep} />}
                {step === 3 && <CategorySelection onNext={nextStep} />}
                {step === 4 && <Preferences onNext={nextStep} />}
                {step === 5 && <Notifications onNext={nextStep} />}
                {step === 6 && (
                  <SuccessScreen
                    onNext={() => {
                      setFlow("signin");
                      setStep(1);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RecAPTCHA Container */}
      <div id="recaptcha-container" />
    </div>
  );
};

export default Login;
