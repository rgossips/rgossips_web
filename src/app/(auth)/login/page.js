"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useGlobal } from "@/context/GlobalContext";
import { useAuth } from "@/context/AuthContext";
import OnboardingCarousel from "@/components/login/OnboardingCarousel";
import RoleSelection from "@/components/login/RoleSelection";
import { createClient } from "@/utils/supabase/client";
import { IoMdClose } from "react-icons/io";
import { ArrowLeft, Loader2 } from "lucide-react";

// Lazy-load heavy components — only loaded when user reaches that step
const loadingFallback = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 size={24} className="animate-spin text-purple-500" />
  </div>
);

const InstagramConnect = dynamic(() => import("@/components/login/InstagramConnect"), { loading: loadingFallback });
const SignUpForm = dynamic(() => import("@/components/login/SignUpForm"), { loading: loadingFallback });
const BrandSignUpForm = dynamic(() => import("@/components/login/BrandSignUpForm"), { loading: loadingFallback });
const CategorySelection = dynamic(() => import("@/components/login/CategorySelection"), { loading: loadingFallback });
const Preferences = dynamic(() => import("@/components/login/Preferences"), { loading: loadingFallback });
const SignInPhone = dynamic(() => import("@/components/login/SignInPhone"), { loading: loadingFallback });
const VerifyOTP = dynamic(() => import("@/components/login/VerifyOTP"), { loading: loadingFallback });

// "+918743898976" / "8743898976" → "+91 87438 98976"
const formatDisplayPhone = (raw) => {
  const digits = String(raw || "")
    .replace(/\D/g, "")
    .replace(/^91/, "");
  if (digits.length < 5) return `+91 ${digits}`;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
};

const Login = () => {
  const router = useRouter();
  const supabase = createClient();
  const { setType } = useGlobal();
  const { user, role, loading: authLoading } = useAuth();

  // If already signed in, send to the right dashboard — don't show login UI
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    // Wait until the role has actually been fetched — otherwise we'd default
    // to /influencer and cause a brief flash for brand users (which then
    // gets corrected to /brands by ProtectedRoute).
    if (!role) return;
    // Check for an in-flight Instagram OAuth redirect — don't interrupt that flow
    if (typeof window !== "undefined") {
      const oauthInProgress = localStorage.getItem("instagram_oauth_code") || localStorage.getItem("instagram_oauth_error");
      if (oauthInProgress) return;
    }
    router.replace(role === "brand" ? "/brands" : "/influencer");
  }, [authLoading, user, role, router]);

  // --- UI & FLOW STATE ---
  // flow: "onboarding" | "signin" | "signup"
  // signin steps: 1=role, 2=phone entry, 3=otp verify
  // signup steps: 1=role, 2=instagram connect, 3=profile form, 4=categories, 5=preferences, 6=notifications, 7=success
  const [flow, setFlow] = useState("onboarding");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");

  // --- AUTH STATE ---
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingSession, setPendingSession] = useState(null);
  const [authUserId, setAuthUserId] = useState(null);
  // Set when the server tells us the account is deactivated. We hold onto
  // the OTP the user already typed so the reactivation click can replay it
  // with reactivate:true instead of forcing a fresh OTP round-trip.
  const [reactivationPending, setReactivationPending] = useState(null); // { otpCode, role } | null

  // --- INSTAGRAM STATE (shared between signin/signup) ---
  const [instaProfile, setInstaProfile] = useState(null);

  // --- INVITATION STATE (admin-invited brands/influencers) ---
  const [invitation, setInvitation] = useState(null);

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
  // Restore auth state after Instagram redirect (mobile or popup fallback)
  useEffect(() => {
    const hasCode = localStorage.getItem("instagram_oauth_code");
    const hasError = localStorage.getItem("instagram_oauth_error");
    const savedMode = localStorage.getItem("instagram_oauth_mode");
    const savedRole = localStorage.getItem("instagram_oauth_role");

    if ((hasCode || hasError) && savedMode && savedRole) {
      // Sign-in is now mobile-OTP only — Instagram OAuth is exclusively for
      // sign-up. Discard any stranded "signin" OAuth state so we don't drop
      // the user into a confused flow.
      if (savedMode !== "signup") {
        localStorage.removeItem("instagram_oauth_code");
        localStorage.removeItem("instagram_oauth_error");
        localStorage.removeItem("instagram_oauth_mode");
        localStorage.removeItem("instagram_oauth_role");
        return;
      }
      // Don't remove mode/role yet — InstagramConnect needs them to know it should process the code
      setSignupData((prev) => ({ ...prev, role: savedRole }));
      setFlow("signup");
      setStep(2); // Instagram connect step
    }
  }, []);

  const switchToSignIn = () => {
    setFlow("signin");
    setStep(1);
    setError("");
    setOtp("");
  };

  const switchToSignUp = () => {
    setFlow("signup");
    setStep(1);
    setError("");
    setOtp("");
  };

  const nextStep = () => setStep((s) => s + 1);

  // --- SHARED: Send OTP ---
  const sendOtp = async (phoneNumber) => {
    const rawDigits = phoneNumber.replace(/\D/g, "");
    const formattedPhone = rawDigits.startsWith("91") ? rawDigits : `91${rawDigits}`;

    const { data, error: funcError } = await supabase.functions.invoke("whatsapp-otp-sender", { body: { phone: formattedPhone, role: signupData.role || "influencer" } });

    if (funcError) throw new Error(funcError.message);
    if (data?.error) throw new Error(data.error);

    setPhone(`+${formattedPhone}`);
  };

  // --- SHARED: Verify OTP & create session ---
  // mode="signin" makes the backend refuse to auto-create a user — sign-in
  // shouldn't silently spin up accounts.
  // reactivate=true is sent on the second pass when the user explicitly
  // confirms they want to bring a deactivated account back online.
  const verifyOtp = async (phoneNumber, otpCode, mode = "signup", reactivate = false) => {
    const rawDigits = phoneNumber.replace(/\D/g, "");
    const fullPhone = `+${rawDigits.startsWith("91") ? rawDigits : `91${rawDigits}`}`;

    const { data, error: authError } = await supabase.functions.invoke("whatsapp-otp-verifier", { body: { phone: fullPhone, otp: otpCode, mode, reactivate } });

    if (authError) throw new Error(authError.message);
    if (data?.error) {
      // Surface a structured error object so callers can branch on `no_user`
      // / `deactivated` without parsing a string.
      const err = new Error(data.message || data.error);
      err.code = data.error;
      err.role = data.role;
      throw err;
    }

    setPendingSession(data.session);
    setAuthUserId(data.user.id);
    return data;
  };

  // ========================
  // SIGN IN FLOW HANDLERS
  // ========================
  // Sign-in is mobile-OTP based for both brands and influencers — Instagram
  // is only used for sign-UP. (Sign-up still starts with role → Instagram.)

  const handleSignInRoleSelected = (selectedRole) => {
    setSignupData((prev) => ({ ...prev, role: selectedRole }));
    setError("");
    nextStep(); // → step 2 (phone entry)
  };

  const handleSignInSendOtp = async (phoneNumber) => {
    setLoading(true);
    setLoadingMsg("Checking your number…");
    setError("");
    try {
      // Pre-check: is this phone already registered? Unknown numbers get
      // recorded in `leads` and the user is nudged to sign up instead.
      const { data: check, error: checkError } = await supabase.functions.invoke("check-phone-exists", {
        body: { phone: phoneNumber, role: signupData.role },
      });
      if (checkError) throw new Error(checkError.message);
      if (check?.error) throw new Error(check.error);

      if (!check?.exists) {
        setError("You don't exist with us. Kindly sign up first.");
        setLoading(false);
        return;
      }

      if (check.match === false) {
        const otherRole = check.role === "brand" ? "a Brand" : "an Influencer";
        setError(`This number is registered as ${otherRole}. Please switch role and try again.`);
        setLoading(false);
        return;
      }

      setLoadingMsg("Sending OTP…");
      await sendOtp(phoneNumber);
      nextStep(); // → step 3 (verify)
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSignInVerifyOtp = async (otpCode, reactivate = false) => {
    setLoading(true);
    setLoadingMsg(reactivate ? "Reactivating your account…" : "Verifying…");
    setError("");
    try {
      const data = await verifyOtp(phone, otpCode, "signin", reactivate);

      // Role-mismatch guard: if the user picked "Brand" but the phone is
      // registered as an influencer (or vice-versa), reject the sign-in
      // outright. We do NOT set the session — that would log them into the
      // wrong dashboard and silently misroute. The check-phone-exists
      // pre-flight catches this earlier, but defending here too means a
      // stale or tampered client can't bypass it.
      const detectedRole = data?.user?.role;
      const requestedRole = signupData.role;
      if (detectedRole && requestedRole && detectedRole !== requestedRole) {
        const otherRole = detectedRole === "brand" ? "a Brand" : "an Influencer";
        setError(`This number is registered as ${otherRole}, not ${requestedRole === "brand" ? "a Brand" : "an Influencer"}. Please go back and pick the correct role.`);
        setLoading(false);
        return;
      }

      setReactivationPending(null);
      setLoadingMsg("Setting up your session…");
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      const target = (detectedRole || requestedRole) === "brand" ? "/brands" : "/influencer";
      router.push(target);
    } catch (err) {
      if (err.code === "no_user") {
        // Not registered — switch to sign-up flow with phone pre-filled.
        setError("");
        setFlow("signup");
        setStep(1);
        return;
      }
      if (err.code === "deactivated") {
        // Hold the typed OTP so the user only has to confirm reactivation,
        // not re-enter the code.
        setReactivationPending({ otpCode, role: err.role });
        setError("");
        return;
      }
      setError(err.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateConfirm = () => {
    if (!reactivationPending) return;
    handleSignInVerifyOtp(reactivationPending.otpCode, true);
  };
  const handleReactivateCancel = () => {
    setReactivationPending(null);
    setError("");
  };

  // ========================
  // SIGN UP FLOW HANDLERS
  // ========================

  const handleSignUpRoleSelected = (selectedRole) => {
    setSignupData((prev) => ({ ...prev, role: selectedRole }));
    nextStep(); // → step 2 (Instagram connect)
  };

  const handleSignUpInstagramConnect = (profile) => {
    // Refuse to advance past the Instagram step without a usable profile.
    // The route is supposed to surface an error before we ever get here,
    // but defending in the UI too means the row never lands with an empty
    // username + token-only state that breaks the next sign-in.
    if (!profile?.username) {
      setError("Instagram didn't return your username. Please reconnect Instagram before continuing.");
      return;
    }
    setInstaProfile(profile);
    nextStep(); // → step 3 (profile form)
  };

  const handleSignUpFormSubmit = async (formData) => {
    setSignupData((prev) => ({ ...prev, ...formData }));
    setLoading(true);
    setLoadingMsg("Creating your account...");
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
        gstin: formData.gstin || "",
        invitationId: invitation?.id || null,
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

      const { data: createResult, error: createError } = await supabase.functions.invoke("create-profile", { body: createBody });

      if (createError) throw new Error(createError.message);
      if (createResult?.error) throw new Error(createResult.error);

      if (pendingSession) {
        setLoadingMsg("Setting up your session...");
        await supabase.auth.setSession({
          access_token: pendingSession.access_token,
          refresh_token: pendingSession.refresh_token,
        });
      }

      if (signupData.role === "brand") {
        // Brands go straight to dashboard
        setLoadingMsg("Redirecting to dashboard...");
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
    nextStep(); // → step 5 (preferences/services)
  };

  const handlePreferences = async (preferencesData) => {
    setSignupData((prev) => ({ ...prev, ...preferencesData }));
    // Save and finish
    await finishSignup({ ...signupData, ...preferencesData });
  };

  const handleSkip = async () => {
    await finishSignup(signupData);
  };

  const finishSignup = async (data) => {
    setLoading(true);
    setLoadingMsg("Saving your preferences...");
    try {
      if (authUserId) {
        const table = data.role === "brand" ? "brand_profiles" : "influencer_profiles";
        await supabase.functions.invoke("update-profile", {
          body: {
            userId: authUserId,
            table,
            categories: data.categories || [],
            services: data.services || [],
          },
        });
      }

      if (pendingSession) {
        setLoadingMsg("Setting up your session...");
        await supabase.auth.setSession({
          access_token: pendingSession.access_token,
          refresh_token: pendingSession.refresh_token,
        });
      }
      setLoadingMsg("Redirecting...");
      router.push(data.role === "brand" ? "/brands" : "/influencer");
    } catch (err) {
      setError(err.message || "Failed to complete signup");
      setLoading(false);
    }
  };

  const closeAuth = () => {
    setFlow("onboarding");
    setStep(1);
    setError("");
    setPhone("");
    setOtp("");
    setInstaProfile(null);
  };

  // ========================
  // RENDER
  // ========================

  // While we resolve auth or redirect an authenticated user, show a minimal
  // splash so the login UI doesn't flash.
  const redirectingAuthed = !authLoading && user && !(typeof window !== "undefined" && (localStorage.getItem("instagram_oauth_code") || localStorage.getItem("instagram_oauth_error")));

  // While a user-initiated action is mid-flight (loading), keep the drawer
  // visible so its in-card spinner stays on screen — otherwise the dark
  // splash takes over and the user perceives a "loader with black background"
  // between signing in and landing on the dashboard.
  if (!loading && (authLoading || redirectingAuthed)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={28} className="animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-[#0F0F1A] overflow-hidden flex items-center justify-center">
      {/* Back to landing — visible across onboarding + auth flows so the user
          can always escape the login surface without hitting the browser back. */}
      <button
        onClick={() => router.push("/")}
        aria-label="Back to home"
        className="absolute top-5 left-5 z-30 flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 hover:bg-white text-slate-700 text-xs font-bold shadow-md backdrop-blur-sm transition-all cursor-pointer"
      >
        <ArrowLeft size={14} />
        Home
      </button>

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <OnboardingCarousel onLoginClick={switchToSignIn} onSignUpClick={switchToSignUp} />
        {flow !== "onboarding" && <div className="absolute inset-0 bg-[#ff92ca] opacity-70 z-10 animate-in fade-in duration-500" />}
      </div>

      {/* Auth Container */}
      {flow !== "onboarding" && (
        <div className="relative z-20 w-full max-w-[500px] h-full md:h-auto md:max-h-[90vh] flex flex-col justify-end md:justify-center px-0 md:px-6">
          <div className="auth-drawer-card bg-white w-full rounded-t-[40px] md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500 relative">
            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-t-[40px] md:rounded-[40px]">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-100" />
                  <Loader2 size={48} className="absolute inset-0 animate-spin text-[#E60076]" strokeWidth={2.5} />
                </div>
                <p className="text-sm text-slate-600 font-semibold">{loadingMsg || "Loading..."}</p>
              </div>
            )}

            {/* Sticky header with close button */}
            <div className="relative flex flex-col items-center px-8 pt-6 pb-2 shrink-0">
              <div className="w-12 h-1 bg-slate-200 rounded-full mb-4 md:hidden" />
              <button onClick={closeAuth} className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 z-30 cursor-pointer" aria-label="Close">
                <IoMdClose size={24} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="w-full max-md mx-auto overflow-y-auto px-8 pb-12">
              {/* ===== SIGN IN FLOW ===== */}
              {flow === "signin" && (
                <>
                  {step === 1 && <RoleSelection onNext={handleSignInRoleSelected} mode="signin" onSwitchMode={switchToSignUp} />}
                  {step === 2 && <SignInPhone onNext={handleSignInSendOtp} loading={loading} error={error} phone={phone} setPhone={setPhone} mode="signin" role={signupData.role} />}
                  {step === 3 && !reactivationPending && (
                    <VerifyOTP onNext={handleSignInVerifyOtp} onResend={() => sendOtp(phone)} loading={loading} error={error} otp={otp} setOtp={setOtp} phoneNumber={formatDisplayPhone(phone)} />
                  )}
                  {step === 3 && reactivationPending && (
                    <ReactivatePrompt
                      role={reactivationPending.role}
                      phone={formatDisplayPhone(phone)}
                      loading={loading}
                      onConfirm={handleReactivateConfirm}
                      onCancel={handleReactivateCancel}
                    />
                  )}
                </>
              )}

              {/* ===== SIGN UP FLOW ===== */}
              {flow === "signup" && (
                <div className="space-y-6">
                  {step === 1 && <RoleSelection onNext={handleSignUpRoleSelected} mode="signup" onSwitchMode={switchToSignIn} />}
                  {step === 2 && <InstagramConnect onNext={handleSignUpInstagramConnect} mode="signup" role={signupData.role} />}
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
                      invitation={invitation}
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
                      initialName={signupData.name}
                    />
                  )}
                  {step === 4 && <CategorySelection onNext={handleCategorySelection} onSkip={handleSkip} />}
                  {step === 5 && <Preferences onNext={handlePreferences} onSkip={handleSkip} />}
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

// Shown when the OTP succeeds but the matching account is in the
// "deactivated" state. Keeps reactivation behind an explicit confirmation
// so signing in doesn't silently undo the user's last action.
function ReactivatePrompt({ role, phone, loading, onConfirm, onCancel }) {
  const label = role === "brand" ? "brand account" : "account";
  return (
    <div className="w-full max-w-sm mx-auto space-y-5">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900">Your {label} is deactivated</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          We verified the OTP sent to <span className="font-bold text-slate-700">{phone}</span>, but this {label} is currently deactivated. Reactivate to sign back in?
        </p>
      </div>

      <button
        onClick={onConfirm}
        disabled={loading}
        className="w-full py-3.5 rounded-2xl text-white text-sm font-black shadow-lg shadow-pink-200 cursor-pointer hover:opacity-90 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
      >
        {loading ? "Reactivating…" : "Reactivate & sign in"}
      </button>
      <button
        onClick={onCancel}
        disabled={loading}
        className="w-full py-3 rounded-2xl text-sm font-bold text-slate-500 border border-slate-200 cursor-pointer disabled:opacity-50"
      >
        Cancel
      </button>

      <p className="text-[11px] text-slate-400 leading-snug text-center">
        Reactivating restores your profile, settings and history exactly as
        they were when you deactivated.
      </p>
    </div>
  );
}
