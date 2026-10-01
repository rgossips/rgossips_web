"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Scroll a form's error banner into view when the error is set.
 *
 * Popups put the banner at the top of a scrollable body and the submit button
 * in a footer. A creator who has filled the form in and scrolled down taps
 * Submit, the refusal renders above the viewport, and the tap reads as
 * "nothing happened" — the worst possible answer to a validation error.
 *
 *   const { errorRef, fail } = useScrollToError(setError);
 *   ...
 *   if (!pitch.trim()) return fail(t("why.required"));
 *   ...
 *   <div ref={errorRef} tabIndex={-1} role="alert">{error}</div>
 *
 * The nonce is the part that matters: keying the effect on the message alone
 * would scroll the first time and then go quiet, so submitting twice with the
 * same mistake would leave the second tap looking dead. Every failure bumps a
 * counter, so every failure scrolls.
 */
export function useScrollToError(setError) {
  const errorRef = useRef(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!nonce || !errorRef.current) return;
    // `nearest` means an already-visible banner does not jump.
    errorRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    // role="alert" announces it; focus moves a keyboard user to it as well.
    errorRef.current.focus?.();
  }, [nonce]);

  const fail = useCallback(
    (value) => {
      setError?.(value);
      setNonce((n) => n + 1);
    },
    [setError],
  );

  return { errorRef, fail };
}

export default useScrollToError;
