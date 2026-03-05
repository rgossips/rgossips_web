"use client";

import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Bell, MessageSquare, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CiMenuKebab } from "react-icons/ci";
import { FaBars, FaTimes } from "react-icons/fa";
import { FaUserCircle } from "react-icons/fa"; // breadcrumb icon

const Navbar = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [breadcrumbOpen, setBreadcrumbOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setShowButton(false);
        setBreadcrumbOpen(false);
        setMobileNavOpen(false);
      } else {
        setShowButton(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    "Home",
    "Trending",
    "My Collabs",
    "Link In Bio",
    "Analytics",
    "Chats",
    "Invites",
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div>
      {/* DESKTOP NAV */}
      <nav className="hidden fixed top-4 left-0 w-full lg:flex justify-center z-60 px-4">
        <div className="relative flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-lg dark:bg-white/20 rounded-full border border-white/70 dark:border-white/20 shadow-sm overflow-x-auto no-scrollbar">
          {/* CENTER NAV ITEMS */}
          {navItems.map((btn) => (
            <button
              key={btn}
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-full cursor-pointer bg-white/50 dark:bg-white/10 
              text-black dark:text-white hover:bg-white/70 dark:hover:bg-white/20 
              transition whitespace-nowrap hover:underline underline-offset-2"
            >
              {btn}
            </button>
          ))}
        </div>

        {/* RIGHT-END BREADCRUMB ICON */}
        {showButton && (
          <div className="absolute right-[70px] top-1/2 -translate-y-1/2">
            <button
              onClick={() => setBreadcrumbOpen(!breadcrumbOpen)}
              className="p-2  rounded-full text-black dark:text-white 
                cursor-pointer"
            >
              <CiMenuKebab color="white" size={24} />
            </button>

            {/* ABSOLUTE DROPDOWN */}
            {breadcrumbOpen && (
              <div
                className="absolute right-0 mt-2 w-36 bg-white/90 dark:bg-gray-900 backdrop-blur-lg 
                shadow-xl rounded-xl overflow-hidden border border-white/40 dark:border-gray-700"
              >
                <button
                  onClick={() => router.push("/profile")}
                  className="cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* MOBILE NAV */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/30 backdrop-blur-lg lg:hidden flex justify-between items-center px-4 py-3">
        <button
          onClick={() => {
            setMobileNavOpen(!mobileNavOpen);
            setBreadcrumbOpen(false);
          }}
          className="text-black text-2xl"
        >
          {mobileNavOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* RIGHT ICON (MOBILE) */}
        {showButton && (
          <button
            onClick={() => setBreadcrumbOpen(!breadcrumbOpen)}
            className="text-black dark:text-white"
          >
            <FaUserCircle size={26} />
          </button>
        )}

        {/* DROPDOWN MOBILE */}
        {breadcrumbOpen && (
          <div className="absolute top-14 right-4 w-36 bg-white/90 dark:bg-gray-900 shadow-lg rounded-xl overflow-hidden">
            <button
              onClick={() => router.push("/profile")}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              My Profile
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* MOBILE LIST */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed top-16 left-0 w-full bg-white/80 backdrop-blur-lg z-40 shadow-md flex flex-col items-center py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => {
                router.push("/");
                setMobileNavOpen(false);
              }}
              className="px-6 py-2 rounded-full text-gray-800 bg-white/60 hover:bg-white/80 transition w-3/4 text-center"
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
