"use client";

import { useRef, useEffect, useState } from "react";

export default function TourTabs({ onInfo, onGallery, onMap }) {
  const tabsRef = useRef(null);
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current) {
        const offsetTop = tabsRef.current.offsetTop;
        setSticky(window.scrollY > offsetTop);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Placeholder to prevent layout shift */}
      {sticky && <div className="h-16" />}

      <div
        ref={tabsRef}
        className={`${
          sticky
            ? "sticky top-0 z-40 backdrop-blur-md bg-white/80 shadow-md"
            : ""
        } transition-all duration-200`}
      >
        <div className="flex justify-center gap-8 py-4 border-b">
          <button
            onClick={onInfo}
            className="hover:text-orange-600 cursor-pointer font-medium"
          >
            Info
          </button>
          <button
            onClick={onGallery}
            className="hover:text-orange-600 cursor-pointer font-medium"
          >
            Gallery
          </button>
          <button
            onClick={onMap}
            className="hover:text-orange-600 cursor-pointer font-medium"
          >
            Map
          </button>
        </div>
      </div>
    </>
  );
}
