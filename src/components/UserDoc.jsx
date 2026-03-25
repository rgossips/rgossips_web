"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Bell,
  Search,
  Menu,
  X,
  Home,
  Briefcase,
  User,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const UserDoc = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();

  const navLinks = [
    { label: "Home", icon: Home, path: "/influencer" },
    { label: "Discover", icon: Search, path: "/influencer/discover" },
    { label: "Campaigns", icon: Briefcase, path: "/influencer/campaigns" },
    { label: "Chats", icon: MessageSquare, path: "/influencer/chats" },
    {
      label: "Notifications",
      icon: Bell,
      path: "/influencer/notifications",
    },
    { label: "Profile", icon: User, path: "/influencer/profile" },
  ];

  const navigateTo = (path) => {
    setSidebarOpen(false);
    router.push(path);
  };

  return (
    <>
      {/* ─── MOBILE TOP BAR ─── */}
      <header className="lg:hidden w-full bg-white px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Menu size={22} className="text-slate-700" />
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/influencer/discover")}
              className="p-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Search size={20} className="text-slate-600" />
            </button>
            <button
              onClick={() => router.push("/influencer/notifications")}
              className="p-2 rounded-xl hover:bg-slate-50 transition-colors relative"
            >
              <Bell size={20} className="text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
            </button>
            <button
              onClick={() => router.push("/influencer/profile")}
              className="ml-1"
            >
              <Image
                width={32}
                height={32}
                src={profile?.profile_photo_url || "/default-avatar.svg"}
                alt="User"
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover"
              />
            </button>
          </div>
        </div>
      </header>

      {/* ─── MOBILE SIDEBAR OVERLAY ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm"
            />

            {/* Sidebar panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[201] flex flex-col shadow-2xl"
            >
              {/* Sidebar header */}
              <div className="p-5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Image
                    width={44}
                    height={44}
                    src={profile?.profile_photo_url || "/default-avatar.svg"}
                    alt="User"
                    className="w-11 h-11 rounded-full border-2 border-white shadow-sm object-cover"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{profile?.full_name || "User"}</p>
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      Pro Member
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 py-3 px-3 overflow-y-auto">
                {navLinks.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigateTo(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-0.5 transition-colors ${
                        isActive
                          ? "bg-pink-50 text-pink-600"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <item.icon
                        size={20}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span
                        className={`text-sm ${
                          isActive ? "font-bold" : "font-medium"
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.label === "Chats" && (
                        <span className="ml-auto bg-pink-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          3
                        </span>
                      )}
                      {item.label === "Notifications" && (
                        <span className="ml-auto w-2 h-2 bg-pink-500 rounded-full" />
                      )}
                    </button>
                  );
                })}

                <div className="h-px bg-slate-100 my-3" />

                {/* Extra links */}
                <button
                  onClick={() => navigateTo("/influencer/profile")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Settings size={20} />
                  <span className="text-sm font-medium">Settings</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
                  <HelpCircle size={20} />
                  <span className="text-sm font-medium">Help & Support</span>
                </button>
              </nav>

              {/* Sidebar footer */}
              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={async () => { await signOut(); router.push("/login"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={20} />
                  <span className="text-sm font-semibold">Log Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── DESKTOP HEADER (unchanged) ─── */}
      <header className="hidden lg:block w-full bg-[#F8F9FA] px-6 rounded-b-[40px] lg:pt-24 pt-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Image
                  width={60}
                  height={60}
                  src={profile?.profile_photo_url || "/default-avatar.svg"}
                  alt="User"
                  className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border-2 border-white shadow-sm object-cover"
                />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-800 leading-tight">
                  Hi, {profile?.full_name?.split(" ")[0] || "there"}
                </h1>
                <p className="text-sm font-bold text-emerald-600">
                  Total Earnings:{" "}
                  <span className="text-slate-900">₹2,00,000</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-1 lg:max-w-2xl">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search campaigns, brands..."
                  className="w-full bg-white py-4 lg:py-3.5 pl-12 pr-4 rounded-2xl text-sm font-medium border-none shadow-sm focus:ring-2 focus:ring-pink-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/influencer/notifications")}
                  className="cursor-pointer p-3.5 bg-white rounded-2xl shadow-sm text-slate-600 hover:bg-slate-50 border border-slate-100 transition-colors"
                >
                  <Bell size={22} />
                </button>
                <button
                  onClick={() => router.push("/influencer/chats")}
                  className="p-3.5 cursor-pointer bg-white rounded-2xl shadow-sm text-slate-600 border border-slate-100"
                >
                  <MessageSquare size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default UserDoc;
