"use client";

/**
 * Put the page back at the top after a view swap.
 *
 * `window.scrollTo({ behavior: "smooth" })` is unreliable on iOS Safari: a
 * smooth scroll requested while the page still carries momentum, or while
 * AnimatePresence is running an exit animation, is simply dropped. The new
 * view then renders above a viewport that never moved, so the creator sees
 * blank space and the tap reads as "nothing opened" — worst on the lowest row
 * of a settings list, where they had to scroll furthest to reach it.
 *
 * Instant is also the right behaviour here. Smoothly scrolling a page whose
 * content has just been replaced animates past content that no longer exists.
 */
export function scrollToTop() {
  if (typeof window === "undefined") return;
  // The two-argument form works in every Safari, including when the options
  // object is ignored.
  window.scrollTo(0, 0);
  // Belt and braces for iOS, where the scrolling element can be the body.
  const el = document.scrollingElement || document.documentElement;
  if (el) el.scrollTop = 0;
}

/**
 * Same, repeated on the next frame so it still lands after the incoming view
 * has painted — AnimatePresence mounts it after the outgoing one leaves.
 * Returns a cleanup for useEffect.
 */
export function scrollToTopAfterPaint() {
  scrollToTop();
  if (typeof window === "undefined") return () => {};
  const id = window.requestAnimationFrame(scrollToTop);
  return () => window.cancelAnimationFrame(id);
}

export default scrollToTop;
