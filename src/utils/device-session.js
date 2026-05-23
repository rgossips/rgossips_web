"use client";

// device-session — small helpers powering Trusted Devices.
//
// Each browser/installation gets a stable UUID stored in localStorage; that
// UUID is the device_id in public.device_sessions. On sign-in (and on every
// app open while signed-in) we upsert (user_id, device_id) with a fresh
// last_active_at and a human-readable device_name derived from the UA.
//
// AuthContext polls the row periodically; if the user revokes the device
// from the Trusted Devices page (is_active=false), the next poll signs them
// out on that device.

const STORAGE_KEY = "rg.device_id";

export const getDeviceId = () => {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
};

// Build a short, recognisable name like "iPhone · Safari" or "Windows · Chrome".
// Keeps the parser dumb on purpose — there's no need to identify every
// permutation perfectly, only enough so the user can tell devices apart.
export const parseDeviceName = (ua = "") => {
  const lower = (ua || "").toLowerCase();
  let os = "Device";
  if (lower.includes("iphone")) os = "iPhone";
  else if (lower.includes("ipad")) os = "iPad";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("mac os")) os = "Mac";
  else if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("linux")) os = "Linux";

  let browser = "";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("chrome") && !lower.includes("edg/")) browser = "Chrome";
  else if (lower.includes("firefox")) browser = "Firefox";
  else if (lower.includes("safari") && !lower.includes("chrome")) browser = "Safari";

  return browser ? `${os} · ${browser}` : os;
};

export const registerDeviceSession = async (supabase, userId) => {
  if (typeof window === "undefined" || !userId) return null;
  const deviceId = getDeviceId();
  if (!deviceId) return null;
  const ua = window.navigator?.userAgent || "";
  const deviceName = parseDeviceName(ua);
  const { error } = await supabase
    .from("device_sessions")
    .upsert(
      {
        user_id: userId,
        device_id: deviceId,
        user_agent: ua.slice(0, 500),
        device_name: deviceName,
        last_active_at: new Date().toISOString(),
        is_active: true,
      },
      { onConflict: "user_id,device_id" }
    );
  if (error) console.error("registerDeviceSession failed:", error.message);
  return deviceId;
};

// Returns true when the current device's row still has is_active=true.
// A null row (e.g. never registered, or RLS denied) is treated as active so
// we don't sign-out on transient errors.
export const isCurrentDeviceActive = async (supabase, userId) => {
  if (typeof window === "undefined" || !userId) return true;
  const deviceId = getDeviceId();
  if (!deviceId) return true;
  const { data, error } = await supabase
    .from("device_sessions")
    .select("is_active")
    .eq("user_id", userId)
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error) {
    console.error("isCurrentDeviceActive failed:", error.message);
    return true;
  }
  if (!data) return true;
  return data.is_active !== false;
};
