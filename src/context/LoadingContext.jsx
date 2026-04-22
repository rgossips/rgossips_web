"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2 } from "lucide-react";

const LoadingContext = createContext(null);

/**
 * Provides a global "busy" state used by long-running operations across the
 * app. A counter supports overlapping operations (e.g. two parallel saves) —
 * the overlay stays visible until the last one finishes.
 *
 * Two ways to use it from a component:
 *   const { withLoading } = useGlobalLoading();
 *   await withLoading(myAsyncFn(), "Saving…");
 *
 * Or manually:
 *   const { startLoading, stopLoading } = useGlobalLoading();
 *   startLoading("Saving…"); try { ... } finally { stopLoading(); }
 */
export function LoadingProvider({ children }) {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const messageStack = useRef([]);

  const startLoading = useCallback((msg = "") => {
    setCount((c) => c + 1);
    messageStack.current.push(msg);
    setMessage(msg);
  }, []);

  const stopLoading = useCallback(() => {
    setCount((c) => Math.max(0, c - 1));
    messageStack.current.pop();
    setMessage(messageStack.current[messageStack.current.length - 1] || "");
  }, []);

  const withLoading = useCallback(
    async (promise, msg = "") => {
      startLoading(msg);
      try {
        return await promise;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  const value = useMemo(
    () => ({
      loading: count > 0,
      message,
      startLoading,
      stopLoading,
      withLoading,
    }),
    [count, message, startLoading, stopLoading, withLoading]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <GlobalLoaderOverlay loading={count > 0} message={message} />
    </LoadingContext.Provider>
  );
}

function GlobalLoaderOverlay({ loading, message }) {
  if (!loading) return null;
  return (
    <div
      // z-index high enough to cover dialogs/drawers (z-50) and modals (z-100).
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl bg-white shadow-2xl">
        <Loader2 size={28} className="text-[#5851DB] animate-spin" />
        {message && (
          <p className="text-sm font-semibold text-gray-700 max-w-xs text-center">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export function useGlobalLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    // Graceful fallback so components outside the provider don't crash —
    // they still work, just without the overlay.
    return {
      loading: false,
      message: "",
      startLoading: () => {},
      stopLoading: () => {},
      withLoading: (p) => p,
    };
  }
  return ctx;
}
