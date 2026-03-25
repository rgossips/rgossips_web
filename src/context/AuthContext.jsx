"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (userId) => {
      try {
        const [infRes, brandRes] = await Promise.all([
          supabase
            .from("influencer_profiles")
            .select("*")
            .eq("influencer_id", userId)
            .maybeSingle(),
          supabase
            .from("brand_profiles")
            .select("*")
            .eq("brand_id", userId)
            .maybeSingle(),
        ]);

        if (!isMounted) return;

        if (infRes.data) {
          setProfile(infRes.data);
          setRole("influencer");
        } else if (brandRes.data) {
          setProfile(brandRes.data);
          setRole("brand");
        } else {
          // User exists in auth but no profile yet (mid-signup)
          setProfile(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

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
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

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
      subscription.unsubscribe();
    };
  }, []);

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
