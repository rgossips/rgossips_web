"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Forces every route change (including browser Back/Forward) to land at the
// top of the page. Next's App Router scrolls to top on push navigations, but
// on POP (back button) the browser restores the previous scroll position —
// which, after applying to a campaign and hitting Back, dumped users at the
// bottom of the list. We opt out of automatic restoration and reset the
// window (and any obvious inner scroll container) to the top on each pathname
// change.
export default function ScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Run after paint so it wins against any late layout/scroll the browser
    // or a freshly-mounted page performs.
    const reset = () => {
      window.scrollTo(0, 0);
      // Some surfaces scroll an inner container instead of the window.
      document
        .querySelectorAll("[data-scroll-container]")
        .forEach((el) => {
          el.scrollTop = 0;
        });
    };
    reset();
    const id = requestAnimationFrame(reset);
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
