"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGlobal } from "@/context/GlobalContext";
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
import bgImg from "@/assets/login/DiscoverCampaignsCard.png";
import Image from "next/image";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const Login = () => {
  const router = useRouter();
  const { type, setType } = useGlobal();
  const [flow, setFlow] = useState("onboarding");
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [userExists, setUserExists] = useState(false);

  const goToSignIn = () => {
    setFlow("signin");
    setStep(1);
    setError("");
    setUserExists(false);
  };
  const goToSignUp = () => {
    setFlow("signup");
    setStep(1);
    setError("");
    setUserExists(false);
  };
  const nextStep = () => setStep((s) => s + 1);

  // Initialize RecAPTCHA on mount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handlePhoneSignIn = async (phoneNumber) => {
    setLoading(true);
    setError("");
    try {
      if (!phoneNumber || phoneNumber.length < 10) {
        setError("Please enter a valid 10-digit phone number");
        setLoading(false);
        return;
      }

      const last10 = phoneNumber.replace(/\D/g, "").slice(-10);
      const formattedPhone = "+91" + last10;
      setPhone(formattedPhone);

      // --- USER EXISTENCE CHECK ---
      if (flow === "signup") {
        try {
          // Check various formats to ensure user doesn't duplicate
          const variants = [formattedPhone, last10];

          const infQ = query(
            collection(db, "influencers"),
            where("phone", "in", variants),
          );
          const brandQ = query(
            collection(db, "brands"),
            where("phone", "in", variants),
          );

          const [infSnap, brandSnap] = await Promise.all([
            getDocs(infQ),
            getDocs(brandQ),
          ]);

          if (!infSnap.empty || !brandSnap.empty) {
            setError("User already exists. Please sign in instead.");
            setUserExists(true);
            setLoading(false);
            return;
          }
        } catch (qErr) {
          console.error("Firestore Check Error:", qErr);
        }
      }

      // --- FIREBASE AUTH LOGIC ---
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }

      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        },
      );

      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier,
      );
      setConfirmationResult(result);
      setOtpSent(true);
      nextStep();
    } catch (err) {
      console.error("Phone sign-in error:", err);
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    setLoading(true);
    setError("");
    try {
      if (!confirmationResult) throw new Error("Session expired.");
      await confirmationResult.confirm(otpCode);

      if (flow === "signin") {
        router.push("/");
      } else {
        nextStep();
      }
    } catch (err) {
      setError("Invalid OTP code.");
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
        {flow !== "onboarding" && (
          <div className="absolute inset-0 md:hidden bg-[#0F0F1A]">
            {/* 2. The Background Image (DiscoverCampaignsCard) */}
            {/* Adjusted to sit in the center/top area without covering the whole bg */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[280px] h-[300px] opacity-80">
              <Image
                src={bgImg}
                alt="Campaign Cards"
                width={280}
                height={300}
                className="object-contain"
              />
            </div>

            {/* 3. The Pink Haze Gradient Overlay (#FF92CA) */}
            <div
              className="absolute inset-0 bg-[#ff92ca] opacity-70"
              onClick={() => setFlow("onboarding")}
            />
          </div>
        )}

        <div className="auth-drawer-card relative z-10 w-full px-8 pt-10 pb-12 md:bg-white md:border-none md:shadow-none md:rounded-none md:h-full md:flex md:items-center overflow-y-auto animate-in slide-in-from-bottom md:slide-in-from-right duration-500">
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-8 md:hidden" />

          <div className="w-full max-w-md mx-auto py-8">
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
                    className="w-full btn-purple h-14 rounded-2xl text-lg font-semibold"
                  >
                    Create Account
                  </Button>
                  <Button
                    onClick={goToSignIn}
                    variant="outline"
                    className="w-full h-14 rounded-2xl text-lg font-semibold"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            )}

            {flow === "signin" && (
              <>
                {step === 1 && (
                  <SignInPhone
                    onNext={handlePhoneSignIn}
                    loading={loading}
                    error={error}
                    phone={phone}
                    setPhone={setPhone}
                    mode="signin"
                    userExists={userExists}
                    onSwitchToSignIn={goToSignIn}
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

            {flow === "signup" && (
              <div className="space-y-6">
                {step === 1 && <RoleSelection onNext={nextStep} />}
                {step === 2 && (
                  <SignInPhone
                    onNext={handlePhoneSignIn}
                    loading={loading}
                    error={error}
                    phone={phone}
                    setPhone={setPhone}
                    mode="signup"
                    userExists={userExists}
                    onSwitchToSignIn={goToSignIn}
                  />
                )}
                {step === 3 && (
                  <VerifyOTP
                    onNext={handleVerifyOTP}
                    loading={loading}
                    error={error}
                    otp={otp}
                    setOtp={setOtp}
                    phoneNumber={phone}
                  />
                )}
                {step === 4 && <ProfileDetails onNext={nextStep} />}
                {step === 5 && <CategorySelection onNext={nextStep} />}
                {step === 6 && <Preferences onNext={nextStep} />}
                {step === 7 && <Notifications onNext={nextStep} />}
                {step === 8 && (
                  <SuccessScreen onNext={() => router.push("/")} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Login;
