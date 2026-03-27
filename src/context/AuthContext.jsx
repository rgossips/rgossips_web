"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

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
      } else {
        setProfile(null);
        setRole(null);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, role, loading, signOut, refreshProfile, instagramTokenMissing, setInstagramTokenMissing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
