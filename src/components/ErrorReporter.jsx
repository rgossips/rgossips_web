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
// Failures that are real but not ours, and carry nothing actionable. Dropped
// here (global handlers only — an explicit reportError() in a catch block is
// always a deliberate report and is never filtered).
// Code injected by a browser extension — its frames live under the extension's
// own scheme. It runs on our pages but isn't ours, and one user's broken
// extension can flood error_logs (33 "reading 'M_ID'" rows from a single
// Chrome extension in half an hour).
const EXTENSION_SCHEME = /(chrome|moz|safari|safari-web|ms-browser)-extension:\/\//i;

function fromBrowserExtension(file, stack) {
  if (EXTENSION_SCHEME.test(String(file || ""))) return true;
  const s = String(stack || "");
  if (!EXTENSION_SCHEME.test(s)) return false;
  // Only drop it when the error ORIGINATES in the extension (top frame), so a
  // real bug of ours that merely passes through an extension hook still reports.
  const firstFrame = s.split("\n").find((line) => /^\s*at\s|@/.test(line)) || "";
  return EXTENSION_SCHEME.test(firstFrame);
}

// A WebView's injected JS bridge, complaining that the WebView it talks to no
// longer exists. Thrown while an in-app browser tears down mid-navigation, on
// both platforms: Android (Instagram/Facebook, "Java object is gone") and iOS
// (Chrome/Safari and the Meta apps, "WKWebView was deallocated"). The teardown
// is the user leaving the page, so there is nothing to act on, and it can
// arrive either synchronously or as a rejected bridge promise.
const WEBVIEW_TEARDOWN =
  /(Error invoking postMessage: Java (object is gone|exception was raised))|(WKWebView was deallocated before the message was delivered)/i;

// A deploy replaced the hashed chunks under a page that was already open, so
// the next navigation asks for a file that now 404s and the screen stops
// working. The user's only way out is a manual refresh they have no reason to
// think of — four of these in the last three weeks, three of them on /login
// during a deploy.
//
// One reload picks up the new build. Guarded by a session-scoped timestamp so
// a chunk that is genuinely missing (a broken build, an ad blocker) reloads
// once and then reports normally instead of looping forever.
const CHUNK_ERROR =
  /Loading chunk [\w-]+ failed|ChunkLoadError|Failed to load chunk|Importing a module script failed|error loading dynamically imported module/i;
const RELOAD_KEY = "rg:chunk-reload-at";
const RELOAD_COOLDOWN_MS = 60_000;

function recoverFromStaleChunk() {
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Private mode or blocked storage: without somewhere to record the
    // attempt there is no loop guard, so do nothing rather than risk one.
    return false;
  }
  window.location.reload();
  return true;
}

function isIgnorableWindowError(e) {
  const file = String(e?.filename || "");
  const message = String(e?.message || e?.error?.message || "");
  if (fromBrowserExtension(file, e?.error?.stack)) return true;
  // Instagram / Facebook's Android in-app browser injects its own scripts
  // (iabjs://navigation_performance_logger_android, …) whose bridge throws
  // "Java object is gone" when the WebView tears down mid-navigation.
  if (file.startsWith("iabjs://")) return true;
  if (WEBVIEW_TEARDOWN.test(message)) return true;
  // A cross-origin script (extension, third-party embed) failed. The browser
  // strips everything — no file, line 0 — so there is nothing to act on.
  if (message === "Script error." && !file && !e?.lineno) return true;
  return false;
}

function isIgnorableRejection(reason) {
  // An AbortController fired — navigation or unmount cancelled an in-flight
  // request. That is the intended outcome, not a failure.
  if (reason?.name === "AbortError") return true;
  if (fromBrowserExtension(null, reason?.stack)) return true;
  const message = String(reason?.message || reason || "");
  if (WEBVIEW_TEARDOWN.test(message)) return true;
  return /signal is aborted|the (user|operation) aborted/i.test(message);
}

export default function ErrorReporter() {
  const { user, role } = useAuth();

  // Keep the reporter's idea of "who" in step with auth. Cheap, and it means
  // an error thrown from a non-React module still lands with a user id.
  useEffect(() => {
    setErrorReporterUserId(user?.id || null);
  }, [user?.id]);

  useEffect(() => {
    const onError = (e) => {
      if (isIgnorableWindowError(e)) return;
      const message = String(e?.message || e?.error?.message || "");
      reportError("client", "window.onerror", e?.error || new Error(e?.message || "Unknown error"), {
        userRole: role || null,
        context: {
          // Where in the bundle, which is all the browser gives us here.
          file: e?.filename || null,
          line: e?.lineno ?? null,
          col: e?.colno ?? null,
        },
      });
      // Reported first, reloaded second: reportError posts with keepalive so
      // the row still lands.
      if (CHUNK_ERROR.test(message)) recoverFromStaleChunk();
    };

    const onRejection = (e) => {
      const reason = e?.reason;
      if (isIgnorableRejection(reason)) return;
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
