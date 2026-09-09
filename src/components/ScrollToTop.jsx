"use client";

import React, { useEffect, useState } from "react";
import { FaArrowUp } from "react-icons/fa";

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div>
      {visible && (
        <button
          onClick={scrollToTop}
          // --rg-bottom-bar lets a page declare that it has its own fixed
          // action bar on mobile, so this button lifts above it instead of
          // landing on top of it. It defaults to 0px in globals.css, so
          // pages without one keep the original bottom-20 position. Set it
          // on document.documentElement — this button lives in the layout,
          // a sibling of the page, so a variable scoped to the page's own
          // root would never reach it.
          className="fixed bottom-[calc(5rem+var(--rg-bottom-bar,0px))] lg:bottom-6 right-6 w-12 h-12 flex items-center justify-center bg-black text-white rounded-md shadow-lg hover:bg-gray-800 transition-all duration-300 z-50 cursor-pointer"
        >
          <FaArrowUp size={20} />
        </button>
      )}
    </div>
  );
};

export default ScrollToTop;
