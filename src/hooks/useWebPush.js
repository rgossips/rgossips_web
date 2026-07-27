"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

// Web-push client: registers the service worker, requests permission, subscribes
// via the VAPID public key, and stores the subscription through the register-push
// edge fn. The matching sender is send-push, fired by the notifications trigger.
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function useWebPush() {
  const supabase = createClient();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      !!VAPID_PUBLIC;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);
    navigator.serviceWorker
      .getRegistration()
      .then(async (reg) => {
        if (!reg) return;
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      })
      .catch(() => {});
  }, []);

  const enable = useCallback(async () => {
    if (!supported) return { ok: false, error: "unsupported" };
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return { ok: false, error: "denied" };

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        });
      }
      const { data, error } = await supabase.functions.invoke("register-push", {
        body: { action: "subscribe", platform: "web", subscription: sub.toJSON(), userAgent: navigator.userAgent },
      });
      if (error || data?.error) return { ok: false, error: error?.message || data?.error };
      setSubscribed(true);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || "failed" };
    } finally {
      setBusy(false);
    }
  }, [supported, supabase]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg && (await reg.pushManager.getSubscription());
      if (sub) {
        await supabase.functions.invoke("register-push", {
          body: { action: "unsubscribe", platform: "web", endpoint: sub.endpoint },
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || "failed" };
    } finally {
      setBusy(false);
    }
  }, [supabase]);

  return { supported, permission, subscribed, busy, enable, disable };
}
