"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

// Unread notification count, polled — for surfaces that need the number but
// not the list (the mobile bottom navs).
//
// The desktop navbars each fetch the full list to render their popover and
// derive the count from it. On mobile there is no popover, so pulling the
// list only to count it is the cheapest thing that works and keeps one
// definition of "unread" across breakpoints.
//
// 30s matches DeskTopNavbar and BrandNavbar. "Real time" here means the same
// thing it already means everywhere else in the app: a poll, not a socket.
// Worth knowing if that expectation ever tightens — the push pipeline
// (migration 056) is the path to genuine realtime, not this.

// Same mapping as the DB trigger in migration 014 and DeskTopNavbar: hides
// rows whose category the user has switched off. Unmapped types return null,
// which means "always show".
function prefKeyForType(type) {
  if (!type) return null;
  if (type.startsWith("app_") || type === "new_application" || type === "application_status") return "applicationStatus";
  if (["service_advance_paid", "service_final_paid", "payment_released", "payment_received"].includes(type)) return "paymentAlerts";
  if (type.startsWith("deadline")) return "deadlineReminders";
  if (["campaign_match", "new_campaign"].includes(type)) return "campaignUpdates";
  return null;
}

export function useUnreadNotifications() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    // No setUnread(0) here: setting state synchronously in an effect body
    // costs a cascading render, and it is unnecessary — the return below
    // derives 0 whenever there is no user, so a logout zeroes the badge
    // without this effect touching state at all.
    if (!user?.id) return;
    let cancelled = false;
    const supabase = createClient();

    const load = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
        const [listRes, prefsRes] = await Promise.all([
          fetch(`${supabaseUrl}/functions/v1/notifications`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ action: "list", userId: user.id }),
          }).then((r) => r.json()),
          supabase
            .from("user_preferences")
            .select("notification_prefs")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);
        if (cancelled) return;

        const prefs = prefsRes?.data?.notification_prefs || null;
        const list = listRes?.notifications || [];
        const visible = list.filter((n) => {
          if (!prefs) return true;
          const key = prefKeyForType(n.type);
          if (!key) return true;
          return prefs[key] !== false;
        });
        setUnread(visible.filter((n) => !n.is_read).length);
      } catch {
        // A failed poll must not blank an already-correct badge, so leave the
        // previous count alone rather than resetting to zero.
      }
    };

    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.id]);

  // Derived rather than stored, so signing out clears the badge immediately
  // instead of leaving the last count from the previous session on screen.
  return user?.id ? unread : 0;
}
