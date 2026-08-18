"use client";

import { useEffect } from "react";
import { latchAppHandoff } from "@/lib/app-handoff";

// Records the `?from=app` hand-off flag before anything can navigate away.
// Mounted high in the root layout and ahead of <ProtectedRoute />, so its
// effect runs first and the flag is stored even when the visitor is
// immediately bounced to /login (which drops the query string).
export default function AppHandoffMarker() {
  useEffect(() => {
    latchAppHandoff();
  }, []);

  return null;
}
