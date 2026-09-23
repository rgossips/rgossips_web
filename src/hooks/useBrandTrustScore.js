"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { invokeAuthed } from "@/lib/invokeAuthed";

// The brand's own trust score, fetched — not computed.
//
// This used to run ~200 lines of client-side queries (ratings, the
// application funnel, application_status_history SLA walks) and feed them
// into a copy of the scoring maths in src/lib/brandProfile.js. That was one
// of FOUR implementations, and a brand's dashboard number disagreed with the
// number creators saw on its card. The score now lives in exactly one place,
// supabase/functions/_shared/brand-trust.ts, and both brand-campaigns
// (this hook) and list-brands (the creator-facing cards) read it from there.
//
// Returns { loading, trust, completion, reviews, execution, communication }.
// `trust` is null until the fetch lands — guard with `trust?.` rather than
// assuming an object, because unlike the old synchronous computation there
// is no value to show on the first render.
//
// `reviews` / `execution` / `communication` are the matching pillar
// summaries out of `trust.breakdown`, kept for display detail.

// Several brand-side components (BrandHero, TrustSection, CategorySection,
// Sidebar) mount together and each call this hook. Share one request between
// them instead of firing four identical round-trips.
const CACHE_TTL_MS = 60_000;
let cache = { brandId: null, at: 0, promise: null };

function fetchTrust(brandId) {
  const fresh = cache.brandId === brandId && Date.now() - cache.at < CACHE_TTL_MS;
  if (fresh && cache.promise) return cache.promise;

  const promise = (async () => {
    const supabase = createClient();
    const res = await invokeAuthed(supabase, "brand-campaigns", {
      action: "trustScore",
      brandId,
    });
    if (res?.needsLogin) throw new Error("not_signed_in");
    if (res?.error) throw res.error;
    // brand-campaigns answers 200 with { error } on a refusal.
    if (res?.data?.error) throw new Error(res.data.error);
    return res?.data || {};
  })().catch((e) => {
    // Don't cache a failure — the next mount should get a real attempt.
    if (cache.promise === promise) cache = { brandId: null, at: 0, promise: null };
    throw e;
  });

  cache = { brandId, at: Date.now(), promise };
  return promise;
}

const EMPTY = { brandId: null, trust: null, completion: null };

export function useBrandTrustScore() {
  const { user, role } = useAuth();
  const brandId = role === "brand" ? user?.id || null : null;
  // One state object rather than three, so `loading` can be DERIVED from
  // whether the result we hold is for the brand we are being asked about
  // (react-hooks/set-state-in-effect: no setState in the effect body).
  const [result, setResult] = useState(EMPTY);

  useEffect(() => {
    if (!brandId) return undefined;

    let cancelled = false;
    fetchTrust(brandId)
      .then((data) => {
        if (!cancelled) {
          setResult({
            brandId,
            trust: data.trust || null,
            completion: data.completion || null,
          });
        }
      })
      .catch((e) => {
        console.error("useBrandTrustScore failed:", e);
        // Still stamp the brandId so the UI stops waiting on a score that
        // is not coming; the consumers all render a neutral fallback.
        if (!cancelled) setResult({ brandId, trust: null, completion: null });
      });

    return () => {
      cancelled = true;
    };
  }, [brandId]);

  const settled = !brandId || result.brandId === brandId;
  const trust = settled ? result.trust : null;
  const breakdown = trust?.breakdown || null;

  return {
    loading: !settled,
    trust,
    completion: settled ? result.completion : null,
    reviews: breakdown?.influencerReviews || null,
    execution: breakdown?.campaignExecution || null,
    communication: breakdown?.communication || null,
  };
}
