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
import { createClient } from "@/utils/supabase/client";
import { IoMdClose } from "react-icons/io";

const Login = () => {
  const router = useRouter();
  const supabase = createClient();
  const { setType } = useGlobal(); // If you use this to set global user type

  // --- UI & FLOW STATE ---
  const [flow, setFlow] = useState("onboarding");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- AUTH STATE ---
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [userExists, setUserExists] = useState(false);

  // --- SIGNUP DATA ACCUMULATOR ---
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

  // --- NAVIGATION HELPERS ---
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

  // --- AUTH LOGIC (SUPABASE) ---

  // const handlePhoneSignIn = async (phoneNumber) => {
  //   setLoading(true);
  //   setError("");

  //   try {
  //     const rawDigits = phoneNumber.replace(/\D/g, "");
  //     const formattedPhone = rawDigits.startsWith("91")
  //       ? rawDigits
  //       : `91${rawDigits}`;

  //     // 1. Generate a 6-digit OTP
  //     const generatedOtp = Math.floor(
  //       100000 + Math.random() * 900000,
  //     ).toString();

  //     setPhone(`+${formattedPhone}`);
  //     console.log("for", formattedPhone);

  //     // 2. Match the body to what the function expects
  //     const { data, error: funcError } = await supabase.functions.invoke(
  //       "whatsapp-otp-sender",
  //       {
  //         body: {
  //           phone: formattedPhone,
  //           otp: generatedOtp,
  //           role: "Influencer", // Or your dynamic role
  //         },
  //       },
  //     );

  //     if (funcError) throw new Error(funcError.message);

  //     // Store OTP in state/session to verify later
  //     setSentOtp(generatedOtp);
  //     setOtpSent(true);
  //     nextStep();
  //   } catch (err) {
  //     setError(err.message || "Failed to send WhatsApp OTP.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleVerifyOTP = async (otpCode) => {
  //   setLoading(true);
  //   setError("");

  //   try {
  //     const { data, error: verifyError } = await supabase.auth.verifyOtp({
  //       phone: phone,
  //       token: otpCode,
  //       type: "sms", // Supabase treats phone-based OTPs under the 'sms' type
  //     });

  //     if (verifyError) throw verifyError;

  //     // Logic for checking existing profile
  //     if (flow === "signin") {
  //       const table = signupData.role === "brand" ? "brands" : "influencers";
  //       const { data: profile } = await supabase
  //         .from(table)
  //         .select("id")
  //         .eq("id", data.user.id)
  //         .single();

  //       if (profile) {
  //         router.push(signupData.role === "brand" ? "/brand" : "/influencer");
  //       } else {
  //         setFlow("signup");
  //         setStep(4);
  //       }
  //     } else {
  //       nextStep(); // Continue to ProfileDetails
  //     }
  //   } catch (err) {
  //     setError("Invalid or expired OTP. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // --- HARDCODED TEST CREDENTIALS ---
  const TEST_USERS = {
    "+911111111111": {
      otp: "111111",
      role: "influencer",
      id: "11111111-1111-1111-1111-111111111111",
    },
    "+922222222222": {
      otp: "222222",
      role: "brand",
      id: "22222222-2222-2222-2222-222222222222",
    },
  };

  const handlePhoneSignIn = async (phoneNumber) => {
    setLoading(true);
    setError("");

    try {
      const rawDigits = phoneNumber.replace(/\D/g, "");
      const formattedPhone =
        rawDigits.startsWith("91") || rawDigits.startsWith("92")
          ? `+${rawDigits}`
          : `+91${rawDigits}`;

      setPhone(formattedPhone);

      // Check if test user
      if (TEST_USERS[formattedPhone]) {
        console.log("🧪 Test user detected:", formattedPhone);
        console.log("🔑 Use OTP:", TEST_USERS[formattedPhone].otp);
        setOtpSent(true);
        nextStep();
        return;
      }

      // Real flow (disabled for now)
      throw new Error("Only test numbers allowed right now.");
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    setLoading(true);
    setError("");

    try {
      const testUser = TEST_USERS[phone];

      if (testUser) {
        // Validate hardcoded OTP
        if (otpCode !== testUser.otp) {
          throw new Error("Wrong OTP. Use " + testUser.otp);
        }

        // Set role from test user
        setSignupData((prev) => ({ ...prev, role: testUser.role }));

        // Sign in via Supabase using dummy session trick
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            phone: phone,
            password: "testpassword123", // we'll set this below
          });

        // If signInWithPassword fails (first time), just navigate directly
        if (signInError) {
          console.warn(
            "Direct session not available, navigating anyway for test",
          );
        }

        // Navigate based on role
        if (testUser.role === "brand") {
          router.push("/brand");
        } else {
          router.push("/influencer");
        }
        return;
      }

      // Real OTP verification
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otpCode,
        type: "sms",
      });

      if (verifyError) throw verifyError;

      if (flow === "signin") {
        const table = signupData.role === "brand" ? "brands" : "influencers";
        const { data: profile } = await supabase
          .from(table)
          .select("id")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          router.push(signupData.role === "brand" ? "/brand" : "/influencer");
        } else {
          setFlow("signup");
          setStep(4);
        }
      } else {
        nextStep();
      }
    } catch (err) {
      setError(err.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP HANDLERS ---

  const handleRoleSelection = (selectedRole) => {
    setSignupData((prev) => ({ ...prev, role: selectedRole }));
    nextStep();
  };

  const handleProfileDetails = (profileData) => {
    setSignupData((prev) => ({ ...prev, ...profileData }));
    nextStep();
  };

  const handleCategorySelection = (selectedCategories) => {
    setSignupData((prev) => ({ ...prev, categories: selectedCategories }));
    nextStep();
  };

  const handlePreferences = (preferencesData) => {
    setSignupData((prev) => ({ ...prev, ...preferencesData }));
    nextStep();
  };

  const handleNotifications = (enabled) => {
    setSignupData((prev) => ({ ...prev, notificationsEnabled: enabled }));
    nextStep();
  };

  const handleSuccessAndSaveToDb = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No User Found");

      const storagePhone = phone.replace(/\D/g, "").slice(-10);
      const table = signupData.role === "brand" ? "brands" : "influencers";

      const { error: dbError } = await supabase.from(table).upsert({
        id: user.id,
        phone: storagePhone,
        name: signupData.name,
        username: signupData.username,
        niche: signupData.niche,
        categories: signupData.categories,
        verification_state: 1,
        updated_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      router.push("/influencer");
    } catch (err) {
      setError("Final save failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeAuth = () => {
    setFlow("onboarding");
    setStep(1);
    setError("");
    setPhone("");
    setOtp("");
  };

  return (
    <div className="relative h-screen w-full bg-[#0F0F1A] overflow-hidden flex items-center justify-center">
      {/* 1. BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
        <OnboardingCarousel
          onLoginClick={goToSignIn}
          onSignUpClick={goToSignUp}
        />
        {flow !== "onboarding" && (
          <div
            className="absolute inset-0 bg-[#ff92ca] opacity-70 z-10 cursor-pointer animate-in fade-in duration-500"
            onClick={() => setFlow("onboarding")}
          />
        )}
      </div>

      {/* 2. AUTH CONTAINER */}
      {flow !== "onboarding" && (
        <div className="relative z-20 w-full max-w-[500px] h-full md:h-auto md:max-h-[90vh] flex flex-col justify-end md:justify-center px-0 md:px-6">
          <div className="auth-drawer-card bg-white w-full px-8 pt-6 pb-12 rounded-t-[40px] md:rounded-[40px] shadow-2xl overflow-y-auto animate-in slide-in-from-bottom duration-500">
            {/* <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-8" /> */}
            <div className="flex flex-col items-center">
              {/* Mobile Handle */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mb-4 md:hidden" />

              {/* Actual Close Button */}
              <button
                onClick={closeAuth}
                className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 z-30 cursor-pointer"
                aria-label="Close"
              >
                <IoMdClose size={24} />
              </button>
            </div>
            <div className="w-full max-md mx-auto">
              {flow === "signin" && (
                <>
                  {step === 1 && <RoleSelection onNext={handleRoleSelection} />}
                  {step === 2 && (
                    <SignInPhone
                      onNext={handlePhoneSignIn}
                      loading={loading}
                      error={error}
                      phone={phone}
                      setPhone={setPhone}
                      mode="signin"
                      role={signupData.role}
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
                      role={signupData.role}
                    />
                  )}
                </>
              )}

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
                      role={signupData.role}
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
                      role={signupData.role}
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
    </div>
  );
};

export default Login;
