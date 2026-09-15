"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

// Codes already exchanged in this tab. The reconnect banner and the reconnect
// popup can both be mounted, and each listens for the OAuth popup's message —
// without this the second exchange replays a spent code and shows an error
// even though the reconnect worked.
const exchangedCodes = new Set();

/**
 * The Instagram re-authorisation flow shared by InstagramReconnectBanner and
 * InstagramReconnectModal: open the OAuth popup, exchange the code, save the
 * new token, then refresh analytics.
 *
 * `messages` supplies the two user-facing error strings so each caller keeps
 * its own i18n namespace.
 */
export function useInstagramReconnect({ messages, onReconnected } = {}) {
  const { user, setInstagramTokenMissing, refreshInstagram, refreshProfile } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const supabaseRef = useRef(null);
  if (supabaseRef.current == null) supabaseRef.current = createClient();

  // Latest values for the window listener without re-subscribing each render.
  const latest = useRef({});
  useEffect(() => {
    latest.current = { user, messages, onReconnected, setInstagramTokenMissing, refreshInstagram, refreshProfile };
  });

  const exchangeCode = useCallback(async (code) => {
    if (exchangedCodes.has(code)) return;
    exchangedCodes.add(code);
    const { user: u, messages: m, onReconnected: done } = latest.current;
    if (!u?.id) return;
    setConnecting(true);
    setError("");
    try {
      const supabase = supabaseRef.current;
      const redirectUri = `${window.location.origin}/instagram-callback`;
      const { data, error: funcError } = await supabase.functions.invoke("instagram-connect", {
        body: { code, redirectUri },
      });
      if (funcError) throw new Error(funcError.message);
      if (data?.error) throw new Error(data.error);

      const { data: updateData, error: updateError } = await supabase.functions.invoke("update-profile", {
        body: {
          userId: u.id,
          table: "influencer_profiles",
          instagramAccessToken: data.accessToken,
          instagramTokenExpiresAt: data.tokenExpiresAt,
        },
      });
      if (updateError) throw new Error(updateError.message);
      if (updateData?.error) throw new Error(updateData.error);

      latest.current.setInstagramTokenMissing(false);
      // Pull fresh analytics — a successful refresh also clears
      // instagram_token_invalid_at — then reload the profile so every
      // "expired" check sees the new expiry.
      await latest.current.refreshInstagram(u.id);
      await latest.current.refreshProfile?.();
      done?.();
    } catch (err) {
      setError(err?.message || m?.failed || "Failed to reconnect Instagram");
    } finally {
      setConnecting(false);
    }
  }, []);

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "instagram-oauth") return;
      if (event.data.error) {
        setError(latest.current.messages?.denied || "Instagram connection was denied");
        setConnecting(false);
        return;
      }
      if (event.data.code) await exchangeCode(event.data.code);
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [exchangeCode]);

  const reconnect = useCallback(() => {
    setError("");
    // Intermediate route stops mobile browsers deep-linking into the
    // Instagram app, which would lose the popup → opener message.
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      "/api/auth/instagram?mode=reconnect&popup=1",
      "instagram-oauth",
      `width=${width},height=${height},left=${left},top=${top}`,
    );
  }, []);

  return { connecting, error, reconnect };
}
