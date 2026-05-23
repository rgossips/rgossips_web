"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { registerDeviceSession, isCurrentDeviceActive } from "@/utils/device-session";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [instagramTokenMissing, setInstagramTokenMissing] = useState(false);

  const supabase = createClient();

  const fetchProfile = useCallback(async (userId) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/check-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        console.error("Error fetching profile:", data?.error);
        setProfile(null);
        setRole(null);
        return;
      }

      if (data?.exists) {
        setProfile(data.profile);
        setRole(data.role);
      } else {
        setProfile(null);
        setRole(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfile(null);
      setRole(null);
    }
  }, []);

  const refreshInstagram = useCallback(async (userId) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/refresh-instagram`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data?.success && !data?.skipped) {
        setInstagramTokenMissing(false);
        await fetchProfile(userId);
      } else if (data?.error?.includes("No Instagram token stored")) {
        setInstagramTokenMissing(true);
      } else if (data?.error?.includes("token expired")) {
        setInstagramTokenMissing(true);
      }
    } catch (err) {
      console.error("Instagram refresh failed:", err);
    }
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const checkProfileNotification = useCallback(async (userId) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      await fetch(`${supabaseUrl}/functions/v1/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ action: "checkProfile", userId }),
      });
    } catch {}
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;

        if (!isMounted) return;

        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
          // Background refresh Instagram data (throttled to once per hour server-side)
          refreshInstagram(currentUser.id);
          // Check profile completion and create notification if needed
          checkProfileNotification(currentUser.id);
          // Trusted Devices bookkeeping — best-effort, non-blocking.
          registerDeviceSession(supabase, currentUser.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Safety: ensure loading is set to false even if everything hangs
    const safetyTimer = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("Auth initialization timed out, forcing loading=false");
        setLoading(false);
      }
    }, 5000);

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;

      if (!isMounted) return;

      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
        // Re-register on auth state change (e.g., after sign-in via OTP) so a
        // new device shows up in the list immediately.
        registerDeviceSession(supabase, currentUser.id);
      } else {
        setProfile(null);
        setRole(null);
      }
      if (isMounted) setLoading(false);
    });

    // Periodically check whether this device's session was revoked from the
    // Trusted Devices UI on another device. 60s cadence is light on the DB
    // and snappy enough — the user notices the sign-out within a minute.
    const sessionPollMs = 60000;
    const sessionPollInterval = setInterval(async () => {
      if (!isMounted) return;
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const active = await isCurrentDeviceActive(supabase, uid);
      if (!active) {
        console.warn("Device session revoked — signing out.");
        await supabase.auth.signOut();
      }
    }, sessionPollMs);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      clearInterval(sessionPollInterval);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, role, loading, signOut, refreshProfile, refreshInstagram, instagramTokenMissing, setInstagramTokenMissing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
