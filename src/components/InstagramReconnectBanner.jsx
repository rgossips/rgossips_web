"use client";

import React, { useState, useEffect } from "react";
import { Instagram, Loader2, X, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

export default function InstagramReconnectBanner() {
  const { user, instagramTokenMissing, setInstagramTokenMissing, refreshProfile } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "instagram-oauth") return;

      if (event.data.error) {
        setError("Instagram connection was denied");
        setConnecting(false);
        return;
      }

      if (event.data.code) {
        await exchangeCode(event.data.code);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const exchangeCode = async (code) => {
    setConnecting(true);
    setError("");
    try {
      const redirectUri = `${window.location.origin}/instagram-callback`;
      const { data, error: funcError } = await supabase.functions.invoke(
        "instagram-connect",
        { body: { code, redirectUri } }
      );

      if (funcError) throw new Error(funcError.message);
      if (data?.error) throw new Error(data.error);

      // Save the token to the profile
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      const updateRes = await fetch(`${supabaseUrl}/functions/v1/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          userId: user.id,
          table: "influencer_profiles",
          instagramAccessToken: data.accessToken,
          instagramTokenExpiresAt: data.tokenExpiresAt,
        }),
      });
      const updateData = await updateRes.json();
      if (updateData.error) throw new Error(updateData.error);

      setInstagramTokenMissing(false);
      await refreshProfile();
    } catch (err) {
      setError(err.message || "Failed to reconnect Instagram");
    } finally {
      setConnecting(false);
    }
  };

  const handleReconnect = () => {
    setError("");
    const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
    const redirectUri = `${window.location.origin}/instagram-callback`;
    const scope = "instagram_business_basic,instagram_business_manage_insights";

    const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;

    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      authUrl,
      "instagram-oauth",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  if (!instagramTokenMissing || dismissed) return null;

  return (
    <div className="mx-4 lg:mx-10 mb-4">
      <div className="relative flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#FCAF45] via-[#E1306C] to-[#833AB4] flex items-center justify-center">
          <Instagram size={20} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <AlertTriangle size={14} className="text-amber-500" />
            <p className="text-sm font-bold text-slate-900">Instagram Reconnection Required</p>
          </div>
          <p className="text-xs text-slate-500">
            Reconnect your Instagram to keep your followers, engagement rate, and analytics up to date.
          </p>
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>

        <button
          onClick={handleReconnect}
          disabled={connecting}
          className="flex-shrink-0 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90 cursor-pointer disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #FCAF45 0%, #E1306C 50%, #833AB4 100%)" }}
        >
          {connecting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            "Reconnect"
          )}
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-amber-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
