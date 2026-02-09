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
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

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

  // Signup form data accumulator
  const [signupData, setSignupData] = useState({
    role: null, // "influencer" or "brand"
    name: "",
    username: "",
    niche: "",
    location: "",
    instagram: "",
    youtube: "",
    categories: [],
    services: [],
    rateRange: "",
    notificationsEnabled: false,
  });

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
    setUserExists(false);

    try {
      // 1. Clean the input: keep only digits
      const rawDigits = phoneNumber.replace(/\D/g, "");
      if (rawDigits.length < 10) {
        setError("Please enter a valid phone number");
        setLoading(false);
        return;
      }

      // 2. Get the last 10 digits (Standardizes: 0904..., +91904..., 904...)
      const last10 = rawDigits.slice(-10);
      const formattedWithPrefix = "+91" + last10;

      setPhone(formattedWithPrefix); // Store for Firebase Auth

      //   if (flow === "signup") {
      //     // 3. SEARCH VARIANTS: This must match exactly how data is stored
      //     // Based on your DB screenshot, 'last10' (9041891005) is the winner.
      //     const searchVariants = [last10, formattedWithPrefix];

      //     const [infSnap, brandSnap] = await Promise.all([
      //       getDocs(
      //         query(
      //           collection(db, "influencers"),
      //           where("phone", "in", searchVariants),
      //         ),
      //       ),
      //       getDocs(
      //         query(
      //           collection(db, "brands"),
      //           where("phone", "in", searchVariants),
      //         ),
      //       ),
      //     ]);

      //     if (!infSnap.empty || !brandSnap.empty) {
      //       setError("Account exists. Please sign in.");
      //       setUserExists(true);
      //       setLoading(false);
      //       return; // BLOCK OTP
      //     }
      //   }

      // --- FIREBASE AUTH ---
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" },
      );

      const result = await signInWithPhoneNumber(
        auth,
        formattedWithPrefix,
        window.recaptchaVerifier,
      );
      setConfirmationResult(result);
      setOtpSent(true);
      nextStep();
    } catch (err) {
      console.error(err);
      setError("Verification failed. Try again.");
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

  // ===== SIGNUP STEP HANDLERS =====

  const handleRoleSelection = async (selectedRole) => {
    try {
      setSignupData((prev) => ({ ...prev, role: selectedRole }));
      nextStep();
    } catch (err) {
      setError("Failed to save role selection.");
    }
  };

  const handleProfileDetails = async (profileData) => {
    setLoading(true);
    setError("");
    try {
      setSignupData((prev) => ({ ...prev, ...profileData }));
      nextStep();
    } catch (err) {
      setError("Failed to save profile details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelection = async (selectedCategories) => {
    setLoading(true);
    setError("");
    try {
      setSignupData((prev) => ({ ...prev, categories: selectedCategories }));
      nextStep();
    } catch (err) {
      setError("Failed to save categories.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferences = async (preferencesData) => {
    setLoading(true);
    setError("");
    try {
      setSignupData((prev) => ({ ...prev, ...preferencesData }));
      nextStep();
    } catch (err) {
      setError("Failed to save preferences.");
    } finally {
      setLoading(false);
    }
  };

  const handleNotifications = async (notificationsEnabled) => {
    setLoading(true);
    setError("");
    try {
      setSignupData((prev) => ({ ...prev, notificationsEnabled }));
      nextStep();
    } catch (err) {
      setError("Failed to save notification preference.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessAndSaveToDb = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No User Found");

      // Use the 10-digit version for consistency with your existing DB
      const storagePhone = phone.replace(/\D/g, "").slice(-10);

      const dataToSave = {
        uid: user.uid,
        phone: storagePhone, // Use standardized format
        name: signupData.name,
        username: signupData.username,
        verificationState: 1, // Start as 1 (Basic)
        updatedAt: serverTimestamp(),
        // ... rest of data
      };

      await setDoc(
        doc(
          db,
          signupData.role === "brand" ? "brands" : "influencers",
          user.uid,
        ),
        dataToSave,
        { merge: true },
      );
      router.push("/influencer");
    } catch (err) {
      setError("Final save failed.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="relative h-screen w-full bg-[#0F0F1A] overflow-hidden flex items-center justify-center">
      {/* 1. BACKGROUND LAYER: Always full screen */}
      <div className="absolute inset-0 z-0">
        {/* Onboarding Carousel acts as the base background */}
        <OnboardingCarousel
          onLoginClick={goToSignIn}
          onSignUpClick={goToSignUp}
        />

        {/* Pink Haze Overlay: Appears when not on onboarding flow */}
        {flow !== "onboarding" && (
          <div
            className="absolute inset-0 bg-[#ff92ca] opacity-70 z-10 cursor-pointer animate-in fade-in duration-500"
            onClick={() => setFlow("onboarding")}
          />
        )}
      </div>

      {/* 2. AUTH CONTAINER: Centered "Drawer" Card */}
      {flow !== "onboarding" && (
        <div className="relative z-20 w-full max-w-[500px] h-full md:h-auto md:max-h-[90vh] flex flex-col justify-end md:justify-center px-0 md:px-6">
          {/* The Card Component */}
          <div className="auth-drawer-card bg-white w-full px-8 pt-6 pb-12 rounded-t-[40px] md:rounded-[40px] shadow-2xl overflow-y-auto animate-in slide-in-from-bottom duration-500">
            {/* Drawer Handle (Mobile Visual) */}
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-8" />

            <div className="w-full max-w-md mx-auto">
              {/* --- SIGN IN FLOW --- */}
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

              {/* --- SIGN UP FLOW --- */}
              {flow === "signup" && (
                <div className="space-y-6">
                  {step === 1 && <RoleSelection onNext={handleRoleSelection} />}
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
                  {step === 4 && (
                    <ProfileDetails onNext={handleProfileDetails} />
                  )}
                  {step === 5 && (
                    <CategorySelection onNext={handleCategorySelection} />
                  )}
                  {step === 6 && <Preferences onNext={handlePreferences} />}
                  {step === 7 && <Notifications onNext={handleNotifications} />}
                  {step === 8 && (
                    <SuccessScreen
                      onNext={handleSuccessAndSaveToDb}
                      loading={loading}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Login;
