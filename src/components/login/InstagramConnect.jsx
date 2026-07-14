"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Instagram, CheckCircle2, X, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

const InstagramConnect = ({ onNext, mode = "signup", role = "influencer", loading: externalLoading = false, error: externalError = "" }) => {
  const t = useTranslations("Auth.instagram");
  const tr = useTranslations("Auth.roles");
  // Localized indefinite role label: "a Brand" / "an Influencer" / "another account".
  const sourceLabel = (src) => (src === "brand" ? tr("brandIndefinite") : src === "influencer" ? tr("influencerIndefinite") : t("otherAccount"));
  const [connecting, setConnecting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  const isSignIn = mode === "signin";
  const displayError = externalError || error;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // On mount: check if we're returning from Instagram redirect
  const processedRef = useRef(false);
  useEffect(() => {
    if (processedRef.current) return; // Prevent double execution in strict mode

    const code = localStorage.getItem("instagram_oauth_code");
    const oauthError = localStorage.getItem("instagram_oauth_error");

    if (code) {
      processedRef.current = true;
      // Clear immediately to prevent any re-use
      localStorage.removeItem("instagram_oauth_code");
      localStorage.removeItem("instagram_oauth_mode");
      localStorage.removeItem("instagram_oauth_role");
      exchangeCode(code);
    } else if (oauthError) {
      processedRef.current = true;
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
      const redirectUri = `${window.location.origin}/instagram-callback`;

      // Full flow via Next.js API route (Vercel server):
      // code exchange + long-lived token + profile fetch
      const res = await fetch("/api/instagram-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri }),
      });
      const data = await res.json();

      if (data.error) {
        const debugStr = data.tokenDebug ? "\n\nToken Debug:\n" + JSON.stringify(data.tokenDebug, null, 2) : "";
        throw new Error(data.error + debugStr);
      }

      if (mountedRef.current) {
        setProfile({
          ...data.profile,
          accessToken: data.accessToken,
          tokenExpiresAt: data.tokenExpiresAt,
        });
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || t("errors.connectFailed"));
      }
    } finally {
      if (mountedRef.current) {
        setConnecting(false);
      }
    }
  };

  const handleConnect = () => {
    // Save state so we can restore after redirect
    localStorage.setItem("instagram_oauth_mode", mode);
    localStorage.setItem("instagram_oauth_role", role);

    // Navigate to our intermediate route which uses a JS redirect to Instagram.
    // This prevents mobile deep linking from opening the Instagram app
    // instead of the browser-based OAuth flow.
    window.location.href = `/api/auth/instagram?mode=${encodeURIComponent(mode)}&role=${encodeURIComponent(role)}`;
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
      const supabase = createClient();
      const { data: uniqueCheck, error: uniqueError } = await supabase.functions.invoke("check-uniqueness", { body: { instagram: profile.username, role } });
      if (uniqueError) throw new Error(uniqueError.message);

      if (uniqueCheck?.conflicts?.includes("instagram")) {
        const source = uniqueCheck.instagramConflictSource;

        if (isSignIn) {
          if (source && source !== role) {
            setError(t("errors.registeredAsRoleSignin", { source: sourceLabel(source) }));
            setChecking(false);
            return;
          }
        } else {
          setError(t("errors.registeredAsRoleSignup", { source: sourceLabel(source) }));
          setChecking(false);
          return;
        }
      }

      // Don't setChecking(false) — parent takes over
      onNext(profile);
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || t("errors.verifyFailed"));
        setChecking(false);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">{isSignIn ? t("titleSignin") : t("titleConnect")}</h2>
        <p className="text-slate-500 text-sm">{isSignIn ? t("subtitleSignin") : t("subtitleConnect")}</p>
      </div>

      {displayError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 max-h-60 overflow-y-auto whitespace-pre-wrap break-all">{displayError}</div>}

      {connecting ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FCAF45] via-[#E1306C] to-[#833AB4] flex items-center justify-center shadow-lg shadow-pink-200">
            <Loader2 size={28} className="text-white animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-500">{t("connecting")}</p>
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
            <Instagram size={20} className="text-[#E1306C] group-hover:scale-110 transition-transform" />
            <span className="bg-gradient-to-r from-[#F77737] via-[#E1306C] to-[#833AB4] bg-clip-text text-transparent">{t("connectButton")}</span>
          </button>

          {/* Permissions disclaimer */}
          <div className="w-full text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-left">
            <p className="font-bold text-slate-600">{t("requirements")}</p>
            <p>{t("perm1")}</p>
            <p>{t("perm2")}</p>
            <p>{t("perm3")}</p>
            <p className="pt-1.5 text-slate-400">{t("permNote")}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-green-200 bg-green-50/50 flex items-center gap-4">
            {profile.profilePictureUrl ? (
              <img src={profile.profilePictureUrl} alt={profile.username} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F77737] via-[#E1306C] to-[#833AB4] flex items-center justify-center text-white font-bold text-lg">
                {profile.username?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-slate-900 truncate">@{profile.username}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("followers", { count: formatCount(profile.followersCount) })}
                {" · "}
                {t("following", { count: formatCount(profile.followsCount) })}
                {" · "}
                {t("posts", { count: formatCount(profile.mediaCount) })}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={22} className="text-green-500" />
              <button onClick={handleDisconnect} className="p-1.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors cursor-pointer" title={t("disconnect")}>
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
            !profile || checking || externalLoading ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "btn-purple text-white shadow-lg shadow-purple-200"
          }`}
        >
          {checking || externalLoading ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              {isSignIn ? t("signingIn") : t("verifying")}
            </>
          ) : isSignIn ? (
            t("signIn")
          ) : (
            t("continue")
          )}
        </Button>
        {!profile && !connecting && (
          <div className="text-center space-y-2">
            <p className="text-[11px] text-slate-400">{t("required")}</p>
            <div className="text-[10px] text-slate-400 bg-slate-50 rounded-xl p-3 text-left space-y-1">
              <p className="font-bold text-slate-500">{t("requirements")}</p>
              <p>{t.rich("req1", { b: (c) => <span className="font-semibold text-slate-600">{c}</span> })}</p>
              <p>{t.rich("req2", { b: (c) => <span className="font-semibold text-slate-600">{c}</span> })}</p>
              <p>{t("req3")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramConnect;
