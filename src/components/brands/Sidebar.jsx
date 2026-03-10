"use client";

import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Bell,
  BookOpen,
} from "lucide-react";

export default function Sidebar() {
  const menu = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Creators", icon: Users },
    { name: "RFPs", icon: FileText },
    { name: "CRM", icon: BookOpen },
    { name: "Brand Database", icon: Users },
    { name: "Marketplace", icon: LayoutDashboard },
    { name: "Message Center", icon: Bell },
  ];

  return (
    <aside className="fixed pt-20 left-0 top-0 h-screen w-[220px] bg-[#f5f6f8] border-r border-gray-200 flex flex-col justify-between">
      {/* Top */}
      <div>
        <div className="p-4 font-semibold text-gray-700">
          <span className="text-sm">Menu</span>
        </div>

        <nav className="px-2 space-y-1">
          {menu.map((item, i) => {
            const Icon = item.icon;

            return (
              <button
                key={i}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-white transition"
              >
                <Icon size={16} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom */}
      <div className="p-4">
        <button className="w-full bg-purple-600 text-white text-sm py-2 rounded-lg hover:bg-purple-700">
          Purchase Plan
        </button>
      </div>
    </aside>
  );
}
