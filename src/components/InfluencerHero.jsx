"use client";

import Image from "next/image";
import { useState } from "react";
import { FaBars, FaTimes, FaCog, FaSignOutAlt } from "react-icons/fa";

export default function Hero() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const navItems = [
    "Trending",
    "My Coollabs",
    "Link In Bio",
    "Analytics",
    "Chats",
    "Invites",
  ];

  return (
    <section className="relative w-full h-full max-h-[60vh] lg:max-h-[80vh] bg-[#0D7753] pt-5 lg:pt-20 overflow-visible">
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
          ))}{" "}
        </div>{" "}
      </nav>
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/30 backdrop-blur-lg lg:hidden flex justify-between items-center px-4 py-3">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="text-white text-2xl"
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

          {/* Profile Dropdown */}
          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg text-gray-800">
              <button className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100">
                <FaCog /> Settings
              </button>
              <button className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100">
                <FaSignOutAlt /> Logout
              </button>
            </div>
          )}
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

      {/* LAYOUT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 mt-20 grid grid-cols-1 lg:grid-cols-3 gap-12 pb-10 lg:pb-32">
        {/* LEFT SIDE */}
        <div className="flex flex-col justify-start">
          <h2 className="text-white text-[48px] sm:text-[64px] md:text-[80px] lg:text-[90px] font-black leading-tight">
            Rayan Bever
          </h2>

          <svg
            width="200"
            height="32"
            viewBox="0 0 220 40"
            fill="none"
            className="mt-1 sm:mt-2 w-[150px] sm:w-[180px] md:w-[200px]"
          >
            <path
              d="M5 25 C 40 5, 90 35, 150 20 C 180 12, 200 25, 215 18"
              stroke="#F3D53A"
              strokeWidth="10"
              strokeLinecap="round"
            />
          </svg>

          <p className="text-white text-base sm:text-xl mt-3 opacity-90">
            Travel Influencer
          </p>
        </div>

        {/* EMPTY MIDDLE ON LARGE SCREENS */}
        <div className="hidden lg:block"></div>

        {/* RIGHT SIDE – STATS */}
        <div className="grid grid-cols-3 lg:grid-cols-2 justify-center text-white lg:gap-0">
          <div className="p-6 rounded-2xl flex flex-col items-center">
            <p className="text-lg text-center">Total Collaborations</p>
            <p className="text-5xl sm:text-6xl lg:text-7xl font-bold mt-2">
              121
            </p>
          </div>

          <div className="p-6 rounded-2xl flex flex-col items-center">
            <p className="text-lg text-center">Active Collaborations</p>
            <p className="text-5xl sm:text-6xl lg:text-7xl font-bold mt-2">
              12
            </p>
          </div>

          <div className="p-6 rounded-2xl flex flex-col items-center">
            <p className="text-lg text-center">Total Clients</p>
            <p className="text-5xl sm:text-6xl lg:text-7xl font-bold mt-2">
              53
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
