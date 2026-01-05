"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // Stores the Firestore doc
  const [role, setRole] = useState(null); // 'influencer' or 'brand'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Fetch profile once and determine role
        try {
          const infRef = doc(db, "influencers", currentUser.uid);
          const brandRef = doc(db, "brands", currentUser.uid);

          const [infSnap, brandSnap] = await Promise.all([
            getDoc(infRef),
            getDoc(brandRef),
          ]);

          if (infSnap.exists()) {
            setProfile({ id: infSnap.id, ...infSnap.data() });
            setRole("influencer");
          } else if (brandSnap.exists()) {
            setProfile({ id: brandSnap.id, ...brandSnap.data() });
            setRole("brand");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
