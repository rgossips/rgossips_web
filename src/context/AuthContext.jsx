"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client"; // Ensure this path matches your setup

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // 1. Fetch profile and role based on UID
    const fetchProfile = async (userId) => {
      try {
        // Parallel fetch for influencer and brand tables
        const [infRes, brandRes] = await Promise.all([
          supabase.from("influencer_profiles").select("*").eq("influencer_id", userId).maybeSingle(),
          supabase.from("brand_profiles").select("*").eq("brand_id", userId).maybeSingle(),
        ]);

        if (infRes.data) {
          setProfile(infRes.data);
          setRole("influencer");
        } else if (brandRes.data) {
          setProfile(brandRes.data);
          setRole("brand");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    // 2. Initial Session Check
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;

      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      }
      setLoading(false);
    };

    initializeAuth();

    // 3. Listen for Auth Changes (Login, Logout, Token Refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper function for logout
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
