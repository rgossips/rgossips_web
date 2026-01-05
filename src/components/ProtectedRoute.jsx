"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Define public paths
  const publicPaths = ["/", "/login", "/register"];

  useEffect(() => {
    if (!loading) {
      if (!user && !publicPaths.includes(pathname)) {
        // User not logged in and trying to access private page
        router.push("/login");
      } else if (user && (pathname === "/login" || pathname === "/register")) {
        // User IS logged in and trying to access login/register
        router.push("/influencer"); // or dashboard
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return children;
}
