"use client";

import { Search, Zap, ChevronDown, LogOut, RefreshCw, Bell } from "lucide-react";
import Image from "next/image";
import logo from "@/assets/logo2.png";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function BrandNavbar() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [unread, setUnread] = useState(0);

  // Poll for unread notification count
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await supabase.functions.invoke("notifications", {
          body: { action: "list", userId: user.id },
        });
        if (!cancelled && typeof data?.unreadCount === "number") {
          setUnread(data.unreadCount);
        }
      } catch {}
    };
    load();
    const interval = setInterval(load, 60_000); // refresh every minute
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.id, supabase]);

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

        {/* Avatar & Name — opens profile */}
        <button
          onClick={() => router.push("/brands/profile")}
          className="flex items-center gap-2 cursor-pointer rounded-lg hover:bg-gray-50 px-2 py-1 transition-colors"
          title="View profile"
        >
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
        </button>

        {/* Notifications */}
        <button
          onClick={() => router.push("/brands/notifications")}
          className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-[#E60076] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* Refresh */}
        <button
          onClick={() => window.location.reload()}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>

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
