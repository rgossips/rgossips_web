"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RGLanding from "@/components/landing/RGLanding";

// useSearchParams() forces CSR-bailout, so isolating it in a tiny child
// (wrapped in <Suspense>) keeps the rest of the marketing home statically
// prerenderable for SEO.
function InvitationRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const invited = searchParams?.get("invited");
    const ref = searchParams?.get("ref");
    // Priority: invitation flow > referral link. Both funnel into /login,
    // which owns the state machine for what to show next.
    if (invited) {
      router.replace(`/login?invited=${encodeURIComponent(invited)}`);
      return;
    }
    if (ref) {
      router.replace(`/login?ref=${encodeURIComponent(ref)}`);
    }
  }, [searchParams, router]);

  return null;
}

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full">
      <Suspense fallback={null}>
        <InvitationRedirect />
      </Suspense>
      <RGLanding />
    </div>
  );
}
