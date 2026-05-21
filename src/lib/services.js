// Helpers for the influencer services pages. Service rows now come from the
// `services` table via the list-services edge function — see iconForName()
// for mapping the DB's `icon_name` string back to a lucide component.

import {
  Instagram,
  Target,
  Palette,
  LineChart,
  Camera,
  PenSquare,
  Megaphone,
  Mic,
  Film,
  Sparkles,
} from "lucide-react";

const ICON_MAP = {
  Instagram,
  Target,
  Palette,
  LineChart,
  Camera,
  PenSquare,
  Megaphone,
  Mic,
  Film,
  Sparkles,
};

export const iconForName = (name) => ICON_MAP[name] || Sparkles;

export const formatINR = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// Fetch all active services from the list-services edge function. Returns
// the array of service rows (or an empty array on failure).
export async function fetchServices() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    const res = await fetch(`${supabaseUrl}/functions/v1/list-services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: "{}",
    });
    const data = await res.json();
    return Array.isArray(data?.services) ? data.services : [];
  } catch (e) {
    console.error("fetchServices failed:", e);
    return [];
  }
}

export async function fetchServiceBySlug(slug) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    const res = await fetch(`${supabaseUrl}/functions/v1/list-services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ slug }),
    });
    const data = await res.json();
    return data?.service || null;
  } catch (e) {
    console.error("fetchServiceBySlug failed:", e);
    return null;
  }
}
