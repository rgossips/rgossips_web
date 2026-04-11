"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Instagram, CheckCircle2, X, Loader2 } from "lucide-react";

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

const InstagramConnect = ({ onNext, mode = "signup", role = "influencer", loading: externalLoading = false, error: externalError = "" }) => {
  const [connecting, setConnecting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  const isSignIn = mode === "signin";
  const displayError = externalError || error;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // On mount: check if we're returning from Instagram redirect
  useEffect(() => {
    const code = localStorage.getItem("instagram_oauth_code");
    const oauthError = localStorage.getItem("instagram_oauth_error");

    if (code) {
      // Clear all saved state
      localStorage.removeItem("instagram_oauth_code");
      localStorage.removeItem("instagram_oauth_mode");
      localStorage.removeItem("instagram_oauth_role");
      exchangeCode(code);
    } else if (oauthError) {
      localStorage.removeItem("instagram_oauth_error");
      localStorage.removeItem("instagram_oauth_mode");
      localStorage.removeItem("instagram_oauth_role");
      setError(oauthError);
    }
  }, []);

  const exchangeCode = async (code) => {
    setConnecting(true);
    setError("");
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      const redirectUri = `${window.location.origin}/instagram-callback`;

      const res = await fetch(`${supabaseUrl}/functions/v1/instagram-connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ code, redirectUri }),
      });

      const data = await res.json();
      if (data?.error) throw new Error(data.error);

      if (mountedRef.current) {
        setProfile({ ...data.profile, accessToken: data.accessToken, tokenExpiresAt: data.tokenExpiresAt });
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || "Failed to connect Instagram");
      }
    } finally {
      if (mountedRef.current) {
        setConnecting(false);
      }
    }
  };

  const handleConnect = () => {
    const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
    const redirectUri = `${window.location.origin}/instagram-callback`;
    const scope = "instagram_business_basic,instagram_business_manage_insights";

    const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;

    // Save state so we can restore after redirect
    localStorage.setItem("instagram_oauth_mode", mode);
    localStorage.setItem("instagram_oauth_role", role);

    // Always redirect in same window — popups are unreliable
    window.location.href = authUrl;
  };

  const handleDisconnect = () => {
    setProfile(null);
    setError("");
  };

  const handleContinue = async () => {
    if (!profile) return;
    setChecking(true);
    setError("");

    try {
      // Check uniqueness across all tables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      const uniqueRes = await fetch(`${supabaseUrl}/functions/v1/check-uniqueness`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ instagram: profile.username, role }),
      });
      const uniqueCheck = await uniqueRes.json();

      if (uniqueCheck?.conflicts?.includes("instagram")) {
        const source = uniqueCheck.instagramConflictSource;

        if (isSignIn) {
          if (source && source !== role) {
            setError(`This Instagram is registered as ${source === "brand" ? "a Brand" : "an Influencer"}. Please sign in as ${source === "brand" ? "a Brand" : "an Influencer"} instead.`);
            setChecking(false);
            return;
          }
        } else {
          const sourceLabel = source === "brand" ? "a Brand" : source === "influencer" ? "an Influencer" : "another account";
          setError(`This Instagram is already registered as ${sourceLabel}. Please sign in instead.`);
          setChecking(false);
          return;
        }
      }

      // Don't setChecking(false) — parent takes over
      onNext(profile);
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || "Failed to verify Instagram");
        setChecking(false);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">
          {isSignIn ? "Sign In with Instagram" : "Connect Instagram"}
        </h2>
        <p className="text-slate-500 text-sm">
          {isSignIn
            ? "Connect your Instagram to sign in to your account"
            : "Link your Instagram to unlock brand collaborations & build your media kit"
          }
        </p>
      </div>

      {displayError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {displayError}
        </div>
      )}

      {connecting ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FCAF45] via-[#E1306C] to-[#833AB4] flex items-center justify-center shadow-lg shadow-pink-200">
            <Loader2 size={28} className="text-white animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-500">Connecting to Instagram...</p>
        </div>
      ) : !profile ? (
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#FCAF45] via-[#E1306C] to-[#833AB4] flex items-center justify-center shadow-lg shadow-pink-200">
            <Instagram size={48} className="text-white" />
          </div>

          <button
            onClick={handleConnect}
            className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#E1306C] flex items-center justify-center gap-3 text-sm font-semibold transition-all cursor-pointer group bg-white hover:bg-gradient-to-r hover:from-[#FCAF45]/5 hover:via-[#E1306C]/5 hover:to-[#833AB4]/5"
          >
            <Instagram
              size={20}
              className="text-[#E1306C] group-hover:scale-110 transition-transform"
            />
            <span className="bg-gradient-to-r from-[#F77737] via-[#E1306C] to-[#833AB4] bg-clip-text text-transparent">
              Connect with Instagram
            </span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-green-200 bg-green-50/50 flex items-center gap-4">
            {profile.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt={profile.username}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F77737] via-[#E1306C] to-[#833AB4] flex items-center justify-center text-white font-bold text-lg">
                {profile.username?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-slate-900 truncate">
                @{profile.username}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatCount(profile.followersCount)} followers
                {" · "}
                {formatCount(profile.followsCount)} following
                {" · "}
                {formatCount(profile.mediaCount)} posts
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={22} className="text-green-500" />
              <button
                onClick={handleDisconnect}
                className="p-1.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                title="Disconnect"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 pt-2">
        <Button
          disabled={!profile || checking || externalLoading}
          onClick={handleContinue}
          className={`w-full h-[54px] rounded-2xl text-base font-semibold transition-all duration-300 ${
            !profile || checking || externalLoading
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "btn-purple text-white shadow-lg shadow-purple-200"
          }`}
        >
          {checking || externalLoading ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              {isSignIn ? "Signing in..." : "Verifying..."}
            </>
          ) : (
            isSignIn ? "Sign In" : "Continue"
          )}
        </Button>
        {!profile && !connecting && (
          <p className="text-center text-[11px] text-slate-400">
            Instagram connection is required to proceed
          </p>
        )}
      </div>
    </div>
  );
};

export default InstagramConnect;
