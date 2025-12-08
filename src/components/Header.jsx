"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BsThreeDotsVertical } from "react-icons/bs";
import { HiMenu, HiX } from "react-icons/hi";

const Header = () => {
  const [selected, setSelected] = useState("Home");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const navItems = ["Home", "Services", "Influencer", "Portfolio", "Blog"];

  const handleNavigation = (item) => {
    setSelected(item);
    setMenuOpen(false);

    // Navigate using Next.js router
    switch (item) {
      case "Influencer":
        router.push("/influencer");
        break;
      case "Home":
        router.push("/");
        break;
      case "Services":
        router.push("/services");
        break;
      case "Portfolio":
        router.push("/portfolio");
        break;
      case "Blog":
        router.push("/blog");
        break;
      default:
        break;
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div
          className="text-2xl font-bold tracking-tight cursor-pointer"
          onClick={() => router.push("/")}
        >
          <span className="text-blue-600">Recent</span>Gossips
        </div>

        {/* Desktop Menu */}
        <nav className="hidden lg:flex items-center gap-6 text-gray-700 font-medium">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => handleNavigation(item)}
              className={`relative transition-all duration-200 pb-1 border-b-2 ${
                selected === item
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent hover:border-gray-300 hover:text-gray-900"
              } cursor-pointer`}
            >
              {item}
            </button>
          ))}
          <BsThreeDotsVertical className="cursor-pointer text-gray-500 hover:text-gray-800 transition" />

          {/* Sign In Button */}
          <button
            onClick={() => router.push("/login")}
            className="ml-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition cursor-pointer"
          >
            Sign In
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden text-gray-700 focus:outline-none cursor-pointer"
        >
          {menuOpen ? <HiX size={28} /> : <HiMenu size={28} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-sm">
          <nav className="flex flex-col space-y-2 px-6 py-4 text-gray-700 font-medium">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => handleNavigation(item)}
                className={`text-left w-full py-2 transition cursor-pointer ${
                  selected === item
                    ? "text-blue-600 font-semibold"
                    : "hover:text-gray-900"
                }`}
              >
                {item}
              </button>
            ))}

            {/* Sign In Button for Mobile */}
            <button
              onClick={() => router.push("/login")}
              className="mt-2 w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition cursor-pointer"
            >
              Sign In
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
