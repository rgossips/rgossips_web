"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HiMenu, HiX } from "react-icons/hi";
import logo from "@/assets/logo2.png";
import { useGlobal } from "@/context/GlobalContext";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { setScrollTo, setType } = useGlobal();

  // Navigation items based on your reference images
  const navItems = [
    { name: "Features", id: "features" },
    { name: "For Brands", id: "brands-influencers-section", type: "brands" },
    {
      name: "For Influencers",
      id: "brands-influencers-section",
      type: "influencers",
    },
    { name: "Pricing", id: "pricing" },
    { name: "FAQ", id: "faq" },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo Section */}
        <div
          className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
          onClick={() => router.push("/")}
        >
          <Image
            src={logo}
            alt="Recent Gossip"
            width={160}
            height={40}
            className="h-9 w-auto object-contain"
          />
        </div>

        {/* Desktop Menu */}
        <nav className="hidden lg:flex items-center gap-10">
          <div className="flex items-center gap-8 text-slate-600 font-semibold text-[15px]">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setScrollTo(item.id);
                  if (item?.link) {
                    router.push(item.link);
                    return;
                  }
                  if (item.name == "For Brands") {
                    setType("brands");
                  } else if (item.name == "For Influencers") {
                    setType("influencers");
                  }
                }}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-8 ml-6 border-l border-slate-200 pl-8">
            <button
              onClick={() => router.push("/login")}
              className="text-slate-700 font-bold text-[15px] hover:text-blue-600 transition-colors cursor-pointer"
            >
              Login
            </button>

            <button
              onClick={() => router.push("/register")}
              className="px-7 py-2.5 bg-gradient-to-r from-[#155DFC] to-[#9810FA] text-white font-bold text-[15px] rounded-2xl shadow-lg shadow-blue-200 hover:opacity-90 transition-all cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 text-slate-600 focus:outline-none cursor-pointer"
        >
          {menuOpen ? <HiX size={28} /> : <HiMenu size={28} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-50 absolute w-full shadow-xl">
          <nav className="flex flex-col space-y-4 px-8 py-8 text-slate-700 font-semibold">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setScrollTo(item.id);

                  if (item.name == "For Brands") {
                    setType("brands");
                  } else if (item.name == "For Influencers") {
                    setType("influencers");
                  }
                }}
                className="text-left w-full py-2 hover:text-blue-600 cursor-pointer"
              >
                {item.name}
              </button>
            ))}

            <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  router.push("/login");
                  setMenuOpen(false);
                }}
                className="w-full py-3 text-slate-800 font-bold text-center"
              >
                Login
              </button>
              <button
                onClick={() => {
                  router.push("/register");
                  setMenuOpen(false);
                }}
                className="w-full py-3 bg-gradient-to-r from-[#155DFC] to-[#9810FA] text-white font-bold rounded-2xl text-center shadow-lg"
              >
                Sign Up
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
