"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const prevPath = useRef(pathname);

  // When pathname changes, the navigation is complete — finish the bar
  useEffect(() => {
    if (prevPath.current !== pathname) {
      clearInterval(timerRef.current);
      setProgress(100);
      const t = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
      prevPath.current = pathname;
      return () => clearTimeout(t);
    }
  }, [pathname]);

  // Intercept link clicks to start the loader
  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return;
      if (href !== prevPath.current) {
        // Defer state update to avoid triggering inside useInsertionEffect
        setTimeout(() => {
          setLoading(true);
          setProgress(20);
          clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            setProgress((p) => {
              if (p >= 90) {
                clearInterval(timerRef.current);
                return 90;
              }
              return p + Math.random() * 15;
            });
          }, 200);
        }, 0);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-[#9810FA] to-[#E60076] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
