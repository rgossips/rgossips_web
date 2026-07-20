"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/utils/supabase/client";

// One hook powering every AI tool UI. Calls the metered `ai-generate` edge fn
// with the caller's session JWT (via supabase.functions.invoke). ai-generate
// returns HTTP 200 with `{ error }` for known cases, so `limitReached` is
// surfaced separately for the upgrade prompt.
export function useAiTool() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(null); // { upgrade } | null

  const generate = useCallback(
    async ({ tool, campaignId, inputs } = {}) => {
      setLoading(true);
      setError("");
      setLimitReached(null);
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("ai-generate", {
          body: { tool, campaignId, inputs },
        });
        if (fnErr) throw new Error(fnErr.message || "AI request failed");
        if (data?.error === "ai_limit_reached") {
          setLimitReached({ upgrade: data.upgrade || "pro" });
          return null;
        }
        if (data?.error) {
          // Friendlier copy for the common config states.
          const friendly =
            data.error === "ai_disabled"
              ? "AI is currently turned off. Please try again later."
              : data.error === "ai_key_missing" || data.error === "ai_config_missing"
                ? "AI isn't configured yet. Please contact support."
                : "Couldn't generate right now. Please try again.";
          throw new Error(friendly);
        }
        setResult(data?.text || "");
        if (typeof data?.remaining !== "undefined") setRemaining(data.remaining);
        return data?.text || "";
      } catch (e) {
        setError(e?.message || "Something went wrong");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  return { loading, result, remaining, error, limitReached, generate, setResult, setError };
}
