"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobal } from "@/context/GlobalContext";
import OnboardingCarousel from "@/components/login/OnboardingCarousel";
import RoleSelection from "@/components/login/RoleSelection";
import SignInPhone from "@/components/login/SignInPhone";
import VerifyOTP from "@/components/login/VerifyOTP";
import SignUpForm from "@/components/login/SignUpForm";
import CategorySelection from "@/components/login/CategorySelection";
import Preferences from "@/components/login/Preferences";
import Notifications from "@/components/login/Notifications";
import SuccessScreen from "@/components/login/SuccessScreen";
import { createClient } from "@/utils/supabase/client";
import { IoMdClose } from "react-icons/io";

const Login = () => {
  const router = useRouter();
  const supabase = createClient();
  const { setType } = useGlobal();

  // --- UI & FLOW STATE ---
  // flow: "onboarding" | "signin" | "signup"
  // signin steps: 1=role, 2=phone, 3=otp
  // signup steps: 1=role, 2=signupForm, 3=categories, 4=preferences, 5=notifications, 6=success
  const [flow, setFlow] = useState("onboarding");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- AUTH STATE ---
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingSession, setPendingSession] = useState(null);
  const [authUserId, setAuthUserId] = useState(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  // --- SIGNUP DATA ---
  const [signupData, setSignupData] = useState({
    role: null,
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

  // --- NAVIGATION ---
  const switchToSignIn = () => {
    setFlow("signin");
    setStep(1);
    setError("");
  };

  const switchToSignUp = () => {
    setFlow("signup");
    setStep(1);
    setError("");
  };

  const nextStep = () => setStep((s) => s + 1);

  // --- SHARED: Send OTP ---
  const sendOtp = async (phoneNumber) => {
    const rawDigits = phoneNumber.replace(/\D/g, "");
    const formattedPhone = rawDigits.startsWith("91") ? rawDigits : `91${rawDigits}`;

    const { data, error: funcError } = await supabase.functions.invoke(
      "whatsapp-otp-sender",
      { body: { phone: formattedPhone, role: signupData.role || "influencer" } },
    );

    if (funcError) throw new Error(funcError.message);
    if (data?.error) throw new Error(data.error);

    setPhone(`+${formattedPhone}`);
  };

  // --- SHARED: Verify OTP & create session ---
  const verifyOtp = async (phoneNumber, otpCode) => {
    const rawDigits = phoneNumber.replace(/\D/g, "");
    const fullPhone = `+${rawDigits.startsWith("91") ? rawDigits : `91${rawDigits}`}`;

    const { data, error: authError } = await supabase.functions.invoke(
      "whatsapp-otp-verifier",
      { body: { phone: fullPhone, otp: otpCode } },
    );

    if (authError) throw new Error(authError.message);
    if (data?.error) throw new Error(data.error);

    setPendingSession(data.session);
    setAuthUserId(data.user.id);
    return data;
  };

  // ========================
  // SIGN IN FLOW HANDLERS
  // ========================

  const handleSignInRoleSelected = (selectedRole) => {
    setSignupData((prev) => ({ ...prev, role: selectedRole }));
    nextStep();
  };

  const handleSignInSendOtp = async (phoneNumber) => {
    setLoading(true);
    setError("");
    try {
      await sendOtp(phoneNumber);
      nextStep();
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignInResendOtp = async () => {
    if (!phone) return;
    setLoading(true);
    setError("");
    setResendSuccess(false);
    try {
      await sendOtp(phone.replace(/\D/g, ""));
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignInVerifyOtp = async (otpCode) => {
    setLoading(true);
    setError("");
    try {
      const data = await verifyOtp(phone.replace(/\D/g, ""), otpCode);

      // Check if profile exists via edge function (bypasses RLS)
      const table = signupData.role === "brand" ? "brand_profiles" : "influencer_profiles";
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      const checkRes = await fetch(`${supabaseUrl}/functions/v1/check-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ userId: data.user.id, table }),
      });
      const checkResult = await checkRes.json();

      if (checkResult?.exists) {
        // Existing user — apply session and go to dashboard
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        router.push(signupData.role === "brand" ? "/brand" : "/influencer");
        return;
      }

      // No profile — switch to signup flow for profile creation
      setFlow("signup");
      setStep(2); // Go to SignUpForm to collect name & instagram
    } catch (err) {
      setError(err.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // SIGN UP FLOW HANDLERS
  // ========================

  const handleSignUpRoleSelected = (selectedRole) => {
    setSignupData((prev) => ({ ...prev, role: selectedRole }));
    nextStep(); // → step 2 (SignUpForm)
  };

  const handleSignUpFormSubmit = async (formData) => {
    setLoading(true);
    setError("");
    try {
      // Save form data
      setSignupData((prev) => ({ ...prev, ...formData }));

      const userId = authUserId;
      if (!userId) throw new Error("No user found. Please verify OTP first.");

      console.log("Signup step 1: Creating profile via edge function...");

      // Create profile via edge function (bypasses RLS, no session needed)
      const storagePhone = phone.replace(/\D/g, "").slice(-10);
      const table = signupData.role === "brand" ? "brand_profiles" : "influencer_profiles";

      const { data: createResult, error: createError } = await supabase.functions.invoke(
        "create-profile",
        {
          body: {
            userId,
            table,
            phone: storagePhone,
            name: formData.name,
            username: formData.instagram || "",
            instagram: formData.instagram || "",
            profilePictureUrl: formData.instaProfile?.profilePictureUrl || "",
            followersCount: formData.instaProfile?.followersCount || 0,
            followsCount: formData.instaProfile?.followsCount || 0,
            mediaCount: formData.instaProfile?.mediaCount || 0,
          },
        },
      );

      console.log("Signup step 2: Profile create result:", { createResult, createError });

      if (createError) throw new Error(createError.message);
      if (createResult?.error) throw new Error(createResult.error);

      // Apply session now that profile exists (fire-and-forget to avoid hanging)
      if (pendingSession) {
        console.log("Signup step 3: Applying session...");
        supabase.auth.setSession({
          access_token: pendingSession.access_token,
          refresh_token: pendingSession.refresh_token,
        });
      }

      console.log("Signup step 4: Moving to next step");
      nextStep(); // → step 3 (categories)
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
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

  const handleFinish = async () => {
    // Save onboarding data (categories, services, rate range, notifications) to profile
    if (authUserId) {
      const table = signupData.role === "brand" ? "brand_profiles" : "influencer_profiles";
      await supabase.functions.invoke("update-profile", {
        body: {
          userId: authUserId,
          table,
          categories: signupData.categories || [],
          services: signupData.services || [],
          rateRange: signupData.rateRange || "",
          notificationsEnabled: signupData.notificationsEnabled || false,
        },
      });
    }

    // Apply session now that onboarding is complete
    if (pendingSession) {
      await supabase.auth.setSession({
        access_token: pendingSession.access_token,
        refresh_token: pendingSession.refresh_token,
      });
    }
    router.push(signupData.role === "brand" ? "/brand" : "/influencer");
  };

  const closeAuth = () => {
    setFlow("onboarding");
    setStep(1);
    setError("");
    setPhone("");
    setOtp("");
  };

  // ========================
  // RENDER
  // ========================

  return (
    <div className="relative h-screen w-full bg-[#0F0F1A] overflow-hidden flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <OnboardingCarousel onLoginClick={switchToSignIn} onSignUpClick={switchToSignUp} />
        {flow !== "onboarding" && (
          <div
            className="absolute inset-0 bg-[#ff92ca] opacity-70 z-10 animate-in fade-in duration-500"
          />
        )}
      </div>

      {/* Auth Container */}
      {flow !== "onboarding" && (
        <div className="relative z-20 w-full max-w-[500px] h-full md:h-auto md:max-h-[90vh] flex flex-col justify-end md:justify-center px-0 md:px-6">
          <div className="auth-drawer-card bg-white w-full px-8 pt-6 pb-12 rounded-t-[40px] md:rounded-[40px] shadow-2xl overflow-y-auto animate-in slide-in-from-bottom duration-500">
            <div className="flex flex-col items-center">
              <div className="w-12 h-1 bg-slate-200 rounded-full mb-4 md:hidden" />
              <button
                onClick={closeAuth}
                className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 z-30 cursor-pointer"
                aria-label="Close"
              >
                <IoMdClose size={24} />
              </button>
            </div>

            <div className="w-full max-md mx-auto">
              {/* ===== SIGN IN FLOW ===== */}
              {flow === "signin" && (
                <>
                  {step === 1 && (
                    <RoleSelection
                      onNext={handleSignInRoleSelected}
                      mode="signin"
                      onSwitchMode={switchToSignUp}
                    />
                  )}
                  {step === 2 && (
                    <SignInPhone
                      onNext={handleSignInSendOtp}
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
                      onNext={handleSignInVerifyOtp}
                      onResend={handleSignInResendOtp}
                      loading={loading}
                      error={error}
                      otp={otp}
                      setOtp={setOtp}
                      phoneNumber={phone}
                      role={signupData.role}
                      resendSuccess={resendSuccess}
                    />
                  )}
                </>
              )}

              {/* ===== SIGN UP FLOW ===== */}
              {flow === "signup" && (
                <div className="space-y-6">
                  {step === 1 && (
                    <RoleSelection
                      onNext={handleSignUpRoleSelected}
                      mode="signup"
                      onSwitchMode={switchToSignIn}
                    />
                  )}
                  {step === 2 && (
                    <SignUpForm
                      onSubmit={handleSignUpFormSubmit}
                      onSendOtp={sendOtp}
                      onResendOtp={sendOtp}
                      onVerifyOtp={verifyOtp}
                      loading={loading}
                      error={error}
                      role={signupData.role}
                      initialPhone={phone ? phone.replace(/\D/g, "").slice(-10) : ""}
                      otpPreVerified={!!authUserId}
                    />
                  )}
                  {step === 3 && (
                    <CategorySelection onNext={handleCategorySelection} />
                  )}
                  {step === 4 && <Preferences onNext={handlePreferences} />}
                  {step === 5 && <Notifications onNext={handleNotifications} />}
                  {step === 6 && (
                    <SuccessScreen onNext={handleFinish} loading={loading} />
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
