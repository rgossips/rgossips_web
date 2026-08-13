"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import logoIcon from "@/assets/logoIcon.png";
import InstagramRequiredGate from "@/components/InstagramRequiredGate";
import { useTranslations } from "next-intl";

const publicPaths = [
  "/",
  "/login",
  "/register",
  "/instagram-callback",
  // Consent policies — must load without auth so brands / influencers
  // can read them before they decide to sign up. The role-scoped
  // /influencer/consent-policy and /brands/consent-policy paths still
  // exist for historic bookmarks but should *also* not require auth;
  // they get added as prefixes below.
  "/consent/influencer",
  "/consent/brand",
];
const publicPrefixes = [
  "/kit/",
  "/consent/",
  "/influencer/consent-policy",
  "/brands/consent-policy",
  // Meta probes /api/instagram/deauthorize and /api/instagram/data-deletion
  // server-side; those are Route Handlers so they bypass this component
  // anyway. The /instagram/deletion-status status page that users land
  // on after Meta's "track my deletion" link MUST be reachable without
  // auth — they won't be logged in to RGossips at that point.
  "/instagram/",
];

const PROFILE_TIMEOUT = 5000; // 5 seconds before redirecting stale sessions

// When we bounce a logged-out visitor to /login, remember where they were
// headed so login can return them there (e.g. a mobile-app "Manage plan"
// hand-off to /influencer/pricing lands on pricing after sign-in, not the
// dashboard). Only a real in-app destination is preserved.
function loginUrlFor(pathname) {
  if (!pathname || pathname === "/login" || pathname === "/") return "/login";
  return `/login?redirect=${encodeURIComponent(pathname)}`;
}

function BrandedLoader() {
  const t = useTranslations("ProtectedRoute");
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F3F4F9] gap-5">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-white">
          <Image src={logoIcon} alt="RGossips" width={40} height={40} className="rounded-lg" />
        </div>
        <div className="absolute -inset-2 rounded-2xl border-2 border-transparent border-t-[#9810FA] border-r-[#E60076] animate-spin" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-sm font-bold text-slate-600">{t("loading")}</p>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9810FA] animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#c040c0] animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#E60076] animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { user, profile, role, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [waitingForProfile, setWaitingForProfile] = useState(false);

  const isPublic = publicPaths.includes(pathname) || publicPrefixes.some((p) => pathname.startsWith(p));
  const isInfluencerRoute = pathname.startsWith("/influencer");
  const isBrandRoute = pathname.startsWith("/brands");

  // Timeout: if user exists but profile never loads, redirect to login
  useEffect(() => {
    if (loading || isPublic || !user || profile) {
      setWaitingForProfile(false);
      return;
    }

    // User exists but no profile — start timeout
    setWaitingForProfile(true);
    const timer = setTimeout(async () => {
      // Still no profile after timeout — stale session, sign out and redirect
      await signOut();
      router.replace(loginUrlFor(pathname));
    }, PROFILE_TIMEOUT);

    return () => clearTimeout(timer);
  }, [user, profile, loading, isPublic, signOut, router, pathname]);

  useEffect(() => {
    if (loading || isPublic) return;

    // No session at all — go to login, preserving the intended destination.
    if (!user) {
      router.replace(loginUrlFor(pathname));
      return;
    }

    // Session exists but no profile/role — wait (timeout handles redirect)
    if (!profile || !role) return;

    // Role mismatch — redirect to correct dashboard
    if (isInfluencerRoute && role !== "influencer") {
      router.replace(role === "brand" ? "/brands" : "/login");
      return;
    }
    if (isBrandRoute && role !== "brand") {
      router.replace(role === "influencer" ? "/influencer" : "/login");
      return;
    }
  }, [user, profile, role, loading, isPublic, pathname, router, isInfluencerRoute, isBrandRoute]);

  // Public pages render immediately, regardless of auth state. Without
  // this guard, the BrandedLoader below would be the only HTML SSR
  // produced for `/`, `/consent/*`, `/kit/*`, etc. — meaning crawlers
  // (Googlebot, Facebook link preview, LinkedIn, etc.) would see a
  // loading spinner instead of the marketing content. This was the
  // root cause of the homepage looking uncrawlable.
  if (isPublic) return children;

  if (loading) {
    return <BrandedLoader />;
  }

  // Block render of protected pages until user + profile are confirmed
  if (!user || !profile) {
    return <BrandedLoader />;
  }

  // Instagram is a mandatory connection for both brands and influencers.
  // check-profile strips the raw token from the response and exposes a
  // derived `instagram_connected` boolean instead — we gate on that.
  // Render the dashboard *and* the gate overlay — the gate is fixed-
  // position and blocks all interaction until the user completes OAuth.
  // Notifications/chats sub-routes are no exception.
  const needsIgConnect =
    (isInfluencerRoute || isBrandRoute) &&
    !profile.instagram_connected;

  return (
    <>
      {children}
      {needsIgConnect && <InstagramRequiredGate />}
    </>
  );
}
