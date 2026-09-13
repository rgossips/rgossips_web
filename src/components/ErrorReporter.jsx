"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { reportError, setErrorReporterUserId } from "@/lib/reportError";

// Catches what nobody wrapped.
//
// Explicit reportError() calls in catch blocks cover the flows we care about
// by name — sign-in, sign-up, Instagram, applications, payments. This is the
// backstop for everything else: a render that throws, a promise nobody
// caught, a null dereference in a component written next year.
//
// Mounted inside AuthProvider so it can attach the current user id to every
// report, including the ones raised from plain modules that have no access to
// React context.
export default function ErrorReporter() {
  const { user, role } = useAuth();

  // Keep the reporter's idea of "who" in step with auth. Cheap, and it means
  // an error thrown from a non-React module still lands with a user id.
  useEffect(() => {
    setErrorReporterUserId(user?.id || null);
  }, [user?.id]);

  useEffect(() => {
    const onError = (e) => {
      reportError("client", "window.onerror", e?.error || new Error(e?.message || "Unknown error"), {
        userRole: role || null,
        context: {
          // Where in the bundle, which is all the browser gives us here.
          file: e?.filename || null,
          line: e?.lineno ?? null,
          col: e?.colno ?? null,
        },
      });
    };

    const onRejection = (e) => {
      const reason = e?.reason;
      reportError(
        "client",
        "unhandledrejection",
        reason instanceof Error ? reason : new Error(String(reason ?? "Unhandled rejection")),
        { userRole: role || null },
      );
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [role]);

  return null;
}
