"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaBars, FaTimes, FaCog, FaSignOutAlt } from "react-icons/fa";

const Navbar = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showButton, setShowButton] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setShowButton(false);
      } else {
        setShowButton(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const router = useRouter();
  const navItems = [
    "Trending",
    "My Coollabs",
    "Link In Bio",
    "Analytics",
    "Chats",
    "Invites",
  ];
  return (
    <div>
      <nav className="hidden fixed top-4 left-0 w-full lg:flex justify-center z-40 px-4">
        {" "}
        <div className=" flex gap-2 px-3 py-2 bg-white/60 backdrop-blur-lg dark:bg-white/20 rounded-full border border-white/70 dark:border-white/20 shadow-sm overflow-x-auto no-scrollbar ">
          {" "}
          {[
            "Trending",
            "My Collabs",
            "Link In Bio",
            "Analytics",
            "Chats",
            "Invites",
          ].map((btn) => (
            <button
              key={btn}
              className=" px-4 py-2 rounded-full cursor-pointer bg-white/50 dark:bg-white/10 text-black dark:text-white hover:bg-white/70 dark:hover:bg-white/20 transition whitespace-nowrap hover:underline underline-offset-2 "
            >
              {" "}
              {btn}{" "}
            </button>
          ))}
          {showButton && (
            <button
              key={"btn"}
              onClick={() => {
                router.push("/profile");
              }}
              className="px-4 py-2 rounded-full cursor-pointer bg-white/50 dark:bg-white/10 
          text-black dark:text-white hover:bg-white/70 dark:hover:bg-white/20 
          transition whitespace-nowrap hover:underline underline-offset-2"
            >
              My Profile
            </button>
          )}
        </div>{" "}
      </nav>
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/30 backdrop-blur-lg lg:hidden flex justify-between items-center px-4 py-3">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="text-black text-2xl"
        >
          {mobileNavOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Profile Pic */}
        <div className="relative">
          <Image
            src="https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d"
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full aspect-square cursor-pointer"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          />
        </div>
      </nav>

      {/* Mobile Nav Items */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed top-16 left-0 w-full bg-white/80 backdrop-blur-lg z-40 shadow-md flex flex-col items-center py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item}
              className="px-6 py-2 rounded-full text-gray-800 bg-white/60 hover:bg-white/80 transition w-3/4 text-center"
              onClick={() => setMobileNavOpen(false)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Navbar;
