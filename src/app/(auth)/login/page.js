"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobal } from "@/context/GlobalContext";
import OnboardingCarousel from "@/components/login/OnboardingCarousel";
import RoleSelection from "@/components/login/RoleSelection";
import SignUpForm from "@/components/login/SignUpForm";
import BrandSignUpForm from "@/components/login/BrandSignUpForm";
import CategorySelection from "@/components/login/CategorySelection";
import Preferences from "@/components/login/Preferences";
import Notifications from "@/components/login/Notifications";
import InstagramConnect from "@/components/login/InstagramConnect";
import SuccessScreen from "@/components/login/SuccessScreen";
import { createClient } from "@/utils/supabase/client";
import { IoMdClose } from "react-icons/io";

const Login = () => {
  const router = useRouter();
  const supabase = createClient();
  const { setType } = useGlobal();

  // --- UI & FLOW STATE ---
  // flow: "onboarding" | "signin" | "signup"
  // signin steps: 1=role, 2=instagram connect (auto-login)
  // signup steps: 1=role, 2=instagram connect, 3=profile form, 4=categories, 5=preferences, 6=notifications, 7=success
  const [flow, setFlow] = useState("onboarding");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- AUTH STATE ---
  const [phone, setPhone] = useState("");
  const [pendingSession, setPendingSession] = useState(null);
  const [authUserId, setAuthUserId] = useState(null);

  // --- INSTAGRAM STATE (shared between signin/signup) ---
  const [instaProfile, setInstaProfile] = useState(null);

  // --- SIGNUP DATA ---
  const [signupData, setSignupData] = useState({
    role: null,
    name: "",
    username: "",
    categories: [],
    services: [],
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
    nextStep(); // → step 2 (Instagram connect)
  };

  const handleSignInInstagramConnect = async (profile) => {
    setLoading(true);
    setError("");
    try {
      setInstaProfile(profile);

      // Look up existing user by Instagram username
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/instagram-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          instagramUsername: profile.username,
          role: signupData.role,
        }),
      });

      const data = await res.json();

      if (data?.success && data?.session) {
        // Existing user found — apply session and navigate
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        router.push(signupData.role === "brand" ? "/brands" : "/influencer");
        return; // Keep loading state until navigation
      }

      if (data?.error === "not_found") {
        // No account — switch to signup flow, skip to profile form (step 3)
        setFlow("signup");
        setStep(3);
        setError("");
        setLoading(false);
        return;
      }

      throw new Error(data?.message || "Login failed");
    } catch (err) {
      setError(err.message || "Failed to sign in with Instagram");
      setLoading(false);
    }
  };

  // ========================
  // SIGN UP FLOW HANDLERS
  // ========================

  const handleSignUpRoleSelected = (selectedRole) => {
    setSignupData((prev) => ({ ...prev, role: selectedRole }));
    nextStep(); // → step 2 (Instagram connect)
  };

  const handleSignUpInstagramConnect = (profile) => {
    setInstaProfile(profile);
    nextStep(); // → step 3 (profile form)
  };

  const handleSignUpFormSubmit = async (formData) => {
    setSignupData((prev) => ({ ...prev, ...formData }));
    setLoading(true);
    setError("");

    try {
      const userId = authUserId;
      if (!userId) throw new Error("No user found. Please verify your phone number.");

      const storagePhone = phone.replace(/\D/g, "").slice(-10);
      const table = signupData.role === "brand" ? "brand_profiles" : "influencer_profiles";

      const createBody = {
        userId,
        table,
        phone: storagePhone,
        name: formData.name || signupData.name,
        gstinData: formData.gstinData || null,
      };

      // Add Instagram data if available
      if (instaProfile) {
        createBody.username = instaProfile.username || "";
        createBody.instagram = instaProfile.username || "";
        createBody.profilePictureUrl = instaProfile.profilePictureUrl || "";
        createBody.followersCount = instaProfile.followersCount || 0;
        createBody.followsCount = instaProfile.followsCount || 0;
        createBody.mediaCount = instaProfile.mediaCount || 0;
        createBody.instagramAccessToken = instaProfile.accessToken || "";
        createBody.instagramTokenExpiresAt = instaProfile.tokenExpiresAt || "";
      }

      const { data: createResult, error: createError } = await supabase.functions.invoke(
        "create-profile",
        { body: createBody },
      );

      if (createError) throw new Error(createError.message);
      if (createResult?.error) throw new Error(createResult.error);

      if (pendingSession) {
        await supabase.auth.setSession({
          access_token: pendingSession.access_token,
          refresh_token: pendingSession.refresh_token,
        });
      }

      if (signupData.role === "brand") {
        // Brands go straight to dashboard
        router.push("/brands");
        return;
      }

      nextStep(); // → step 4 (categories)
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
    setLoading(true);
    if (authUserId) {
      const table = signupData.role === "brand" ? "brand_profiles" : "influencer_profiles";
      await supabase.functions.invoke("update-profile", {
        body: {
          userId: authUserId,
          table,
          categories: signupData.categories || [],
          services: signupData.services || [],
          notificationsEnabled: signupData.notificationsEnabled || false,
        },
      });
    }

    if (pendingSession) {
      await supabase.auth.setSession({
        access_token: pendingSession.access_token,
        refresh_token: pendingSession.refresh_token,
      });
    }
    router.push(signupData.role === "brand" ? "/brands" : "/influencer");
  };

  const closeAuth = () => {
    setFlow("onboarding");
    setStep(1);
    setError("");
    setPhone("");
    setInstaProfile(null);
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
          <div className="auth-drawer-card bg-white w-full rounded-t-[40px] md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500">
            {/* Sticky header with close button */}
            <div className="relative flex flex-col items-center px-8 pt-6 pb-2 shrink-0">
              <div className="w-12 h-1 bg-slate-200 rounded-full mb-4 md:hidden" />
              <button
                onClick={closeAuth}
                className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 z-30 cursor-pointer"
                aria-label="Close"
              >
                <IoMdClose size={24} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="w-full max-md mx-auto overflow-y-auto px-8 pb-12">
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
                    <InstagramConnect
                      onNext={handleSignInInstagramConnect}
                      mode="signin"
                      loading={loading}
                      error={error}
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
                    <InstagramConnect
                      onNext={handleSignUpInstagramConnect}
                      mode="signup"
                    />
                  )}
                  {step === 3 && signupData.role === "brand" && (
                    <BrandSignUpForm
                      onSubmit={handleSignUpFormSubmit}
                      onSendOtp={sendOtp}
                      onResendOtp={sendOtp}
                      onVerifyOtp={verifyOtp}
                      loading={loading}
                      error={error}
                      initialPhone={phone ? phone.replace(/\D/g, "").slice(-10) : ""}
                      otpPreVerified={!!authUserId}
                      instagramProfile={instaProfile}
                    />
                  )}
                  {step === 3 && signupData.role !== "brand" && (
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
                      instagramProfile={instaProfile}
                    />
                  )}
                  {step === 4 && (
                    <CategorySelection onNext={handleCategorySelection} />
                  )}
                  {step === 5 && <Preferences onNext={handlePreferences} />}
                  {step === 6 && <Notifications onNext={handleNotifications} />}
                  {step === 7 && (
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
