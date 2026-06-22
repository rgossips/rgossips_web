"use client";

import React, { useEffect, useState } from "react";
import { Instagram, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

// Full-screen interstitial shown when a logged-in user has no Instagram
// access token on their profile. Blocks the dashboard until they connect
// — there is intentionally no skip / dismiss button. Same OAuth popup
// flow as InstagramReconnectBanner, just hard-gated.
//
// Mounted by ProtectedRoute on /brands and /influencer routes when
// profile.instagram_access_token is missing.

export default function InstagramRequiredGate() {
  const { user, profile, role, refreshProfile, refreshInstagram } = useAuth();
  const supabase = createClient();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "instagram-oauth") return;

      if (event.data.error) {
        setError(event.data.error || "Instagram connection was denied");
        setConnecting(false);
        return;
      }

      if (event.data.code) {
        await exchangeCode(event.data.code);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [user, role]);

  const exchangeCode = async (code) => {
    setConnecting(true);
    setError("");
    try {
      const redirectUri = `${window.location.origin}/instagram-callback`;
      const { data, error: funcError } = await supabase.functions.invoke("instagram-connect", {
        body: { code, redirectUri },
      });
      if (funcError) throw new Error(funcError.message);
      if (data?.error) throw new Error(data.error);

      const table = role === "brand" ? "brand_profiles" : "influencer_profiles";
      const updateBody = {
        userId: user.id,
        table,
        instagramAccessToken: data.accessToken,
        instagramTokenExpiresAt: data.tokenExpiresAt,
      };
      // For brands, also persist the username/logo from the OAuth result
      // so the row matches what the user just authenticated as.
      if (role === "brand" && data?.profile?.username) {
        updateBody.instagramUsername = data.profile.username;
        if (data.profile.profilePictureUrl) {
          updateBody.logoUrl = data.profile.profilePictureUrl;
        }
      }

      const { error: updErr, data: updData } = await supabase.functions.invoke("update-profile", { body: updateBody });
      if (updErr) throw new Error(updErr.message);
      if (updData?.error) throw new Error(updData.error);

      // CRITICAL: refresh the cached profile so the gate's mount
      // condition (`!profile.instagram_access_token`) re-evaluates and
      // the overlay unmounts. We do this BEFORE the optional IG-data
      // backfill so the gate disappears even if refresh-instagram has
      // a transient failure.
      await refreshProfile();

      // Background IG-data backfill (followers, media, demographics).
      // Best-effort — refresh-instagram is influencer-scoped today and
      // can fail for non-token reasons (Meta rate limit, partial outage)
      // without invalidating the token we just stored. Swallow errors
      // so they don't leave the gate stuck.
      if (role === "influencer") {
        try {
          await refreshInstagram(user.id);
        } catch (_) {
          // non-fatal
        }
      }
    } catch (err) {
      setError(err.message || "Failed to connect Instagram");
    } finally {
      // Always clear the spinner — on success the gate unmounts when
      // profile.instagram_access_token populates; on failure the user
      // needs to be able to retry, which means the button must be live.
      setConnecting(false);
    }
  };

  const handleConnect = () => {
    setError("");
    setConnecting(true);
    const url = `/api/auth/instagram?mode=reconnect&popup=1`;
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(url, "instagram-oauth", `width=${width},height=${height},left=${left},top=${top}`);
  };

  const headline = role === "brand"
    ? "Connect your Instagram to access your brand dashboard"
    : "Connect your Instagram to access your creator dashboard";
  const subtitle = role === "brand"
    ? "We use your verified Instagram to display your logo and content to creators discovering your brand."
    : "Brands match campaigns based on your real follower count and engagement. Connect to unlock deals.";

  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0F0F1A]/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FCAF45] via-[#E1306C] to-[#833AB4] flex items-center justify-center shadow-lg">
            <Instagram size={32} className="text-white" />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h2 className="text-xl font-black text-slate-900 leading-tight">{headline}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{subtitle}</p>
        </div>

        <button
          onClick={handleConnect}
          disabled={connecting}
          className="w-full py-3.5 rounded-2xl text-white text-sm font-black shadow-lg cursor-pointer hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #FCAF45 0%, #E1306C 50%, #833AB4 100%)" }}
        >
          {connecting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Connecting…
            </>
          ) : (
            <>
              <Instagram size={18} />
              Connect Instagram
            </>
          )}
        </button>

        {error && (
          <p className="text-xs text-red-600 text-center leading-snug">{error}</p>
        )}

        <p className="text-[11px] text-slate-400 text-center leading-snug">
          We never post on your behalf. We read your handle, follower count,
          and recent media to power matching.
        </p>
      </div>
    </div>
  );
}
