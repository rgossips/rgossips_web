"use client";

import { Search, Zap, ChevronDown, LogOut } from "lucide-react";
import Image from "next/image";
import logo from "@/assets/logo2.png";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export function BrandNavbar() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const brandName = profile?.gstin_trade_name || profile?.brand_name || profile?.contact_name || "Brand";
  const logoUrl = profile?.logo_url;
  const initials = brandName.charAt(0).toUpperCase();

  return (
    <header className="w-full h-[72px] border-b bg-white hidden lg:flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Image src={logo} alt="logo" height={100} width={200} />
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            placeholder="Search for creators, campaigns, or agencies..."
            className="w-full pl-9 pr-4 h-10 rounded-lg border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Trust Score */}
        <div className="flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
          <Zap size={14} />
          Trust Score: 10%
        </div>

        {/* Invite Button */}
        <button className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition">
          Invite & Earn ₹2500
          <span className="text-lg leading-none">+</span>
        </button>

        {/* Avatar & Name */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center">
            {logoUrl ? (
              <Image
                src={logoUrl}
                width={40}
                height={40}
                className="rounded-full object-cover"
                alt={brandName}
              />
            ) : (
              <span className="text-purple-600 font-bold text-sm">{initials}</span>
            )}
          </div>
          <span className="text-sm font-semibold text-gray-700 max-w-[120px] truncate">
            {brandName}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={async () => { await signOut(); router.push("/login"); }}
          className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
          title="Log Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
