import React, { useState } from "react";
import {
  Settings,
  Edit2,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  BarChart3,
  FileText,
  User,
  Bell,
  Lock,
  LogOut,
  ChevronRight,
  HelpCircle,
  Clock,
  Award,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { HubCard } from "./HubCard";

const DashboardView = ({
  onOpenInfo,
  onOpenAnalytics,
  onOpenEdit,
  onNotificationClick,
  onPrivacyClick,
  onhelpSupportClick,
}) => {
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = () => {
    // TODO: Add actual logout logic here
    setShowLogout(false);
    // e.g., redirect or clear auth
  };

  return (
    <main className="px-5 pt-6 space-y-6">
      {/* Page Header */}
      <header className="flex justify-between items-center mb-2 px-1">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A1A]">Profile</h1>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
            Manage your creator account
          </p>
        </div>
        <button className="p-2.5 bg-white rounded-2xl shadow-sm border border-gray-50 text-gray-400">
          <Settings size={20} />
        </button>
      </header>

      {/* Identity Card */}
      <section className="bg-white p-6 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-[#FF2D78] via-[#FF3B8D] to-[#FF6BA1] rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-pink-200">
              AK
              <div className="absolute -bottom-1 -right-1 bg-[#1A1A1A] p-2 rounded-xl border-2 border-white cursor-pointer shadow-md">
                <Edit2 size={12} className="text-white" />
              </div>
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#22C55E] border-[3.5px] border-white rounded-full shadow-sm" />
          </div>

          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-xl font-extrabold text-[#1A1A1A]">
                Alex Kumar
              </h2>
              <div className="bg-[#3B82F6] rounded-full p-0.5">
                <CheckCircle2
                  size={12}
                  className="text-white fill-white stroke-[#3B82F6]"
                />
              </div>
            </div>
            <p className="text-gray-400 text-sm font-medium italic">
              @alexkumar
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <span className="px-4 py-1.5 bg-[#F3F4F9] text-[#374151] text-[10px] font-bold rounded-full">
                Fashion & Lifestyle
              </span>
              <span className="px-4 py-1.5 bg-[#FF2D78] text-white text-[10px] font-bold rounded-full shadow-md shadow-pink-100">
                Pro Creator
              </span>
            </div>
          </div>

          <div className="w-full mt-6 pt-5 border-t border-gray-100 flex justify-between items-center px-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">
              Total Reach
            </span>
            <span className="font-black text-[#1A1A1A]">125K followers</span>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        <StatCard
          title="Total Earnings"
          value="₹78,450"
          change="23%"
          icon={CreditCard}
          color="text-emerald-500"
          bgColor="bg-[#ECFDF5]"
        />
        <StatCard
          title="Active Campaigns"
          value="5"
          change="2"
          icon={Clock}
          color="text-blue-500"
          bgColor="bg-[#EFF6FF]"
        />
        <StatCard
          title="Completed"
          value="47"
          change="12"
          icon={Award}
          color="text-emerald-500"
          bgColor="bg-[#F0FDF4]"
        />
        <StatCard
          title="Success Rate"
          value="94%"
          change="5%"
          icon={TrendingUp}
          color="text-purple-500"
          bgColor="bg-[#F5F3FF]"
        />
      </section>

      {/* Creator Hub Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[#8B5CF6] text-xl">✦</span>
          <h3 className="font-black text-[#2D2D2D] text-lg">Creator Hub</h3>
        </div>
        <div className="p-4 rounded-[3rem] border border-[#FFF0F3] bg-white/50 space-y-4 shadow-sm">
          <HubCard
            title="My Information"
            sub="View and update your profile details"
            bgColor="bg-[#EFECFF]"
            icon={FileText}
            iconGradient="from-[#8B5CF6] to-[#6366F1]"
            onClick={onOpenInfo}
          >
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5 px-1">
                <span className="text-[9px] font-black text-gray-400 uppercase">
                  Profile Complete
                </span>
                <span className="text-[10px] font-black text-[#10B981]">
                  80%
                </span>
              </div>
              <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden border border-white/40">
                <div className="h-full bg-[#10B981] rounded-full w-[80%] shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
              </div>
            </div>
          </HubCard>

          <HubCard
            onClick={onOpenEdit}
            title="Edit Profile"
            sub="Update bio, niche, socials and portfolio"
            bgColor="bg-[#FFE5BE]"
            icon={User}
            iconGradient="from-[#F97316] to-[#FB923C]"
          />

          <HubCard
            onClick={onOpenAnalytics}
            title="Analytics"
            sub="Track performance and campaign insights"
            bgColor="bg-[#F0F9FF]"
            icon={BarChart3}
            iconGradient="from-[#3B82F6] to-[#60A5FA]"
          >
            <div className="mt-4 bg-white/60 p-3 rounded-2xl border border-white/80 flex items-end justify-between shadow-sm">
              <div>
                <p className="text-[8px] text-gray-400 font-black uppercase">
                  Last 7 Days
                </p>
                <p className="text-sm font-black text-gray-800">+2.4K</p>
              </div>
              <div className="flex items-end gap-1 h-8">
                {[30, 50, 40, 70, 55, 90, 80].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-[#3B82F6] rounded-full"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </HubCard>
        </div>
      </section>

      {/* Settings Section */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-2">
          Settings
        </h3>
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-50">
          <SettingsItem
            icon={Bell}
            onClick={onNotificationClick}
            title="Notifications"
            sub="Manage alerts and updates"
            color="bg-[#8B5CF6]"
          />
          <SettingsItem
            onClick={onPrivacyClick}
            icon={Lock}
            title="Privacy & Security"
            sub="Control your data and access"
            color="bg-[#10B981]"
          />
          <SettingsItem
            icon={CreditCard}
            title="Payment Methods"
            sub="Manage payout accounts"
            color="bg-[#F97316]"
          />
        </div>
      </section>

      {/* Support & Logout */}
      <section className="space-y-4 pt-2 pb-6">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-2">
          Support
        </h3>
        <div
          onClick={onhelpSupportClick}
          className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-[#6366F1] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <HelpCircle size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-[#1A1A1A]">Help & Support</h4>
            <p className="text-[11px] text-gray-400 font-medium">
              FAQs and contact us
            </p>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </div>

        <button
          className="w-full py-4 bg-white border-2 border-rose-50 rounded-2xl text-[#FF2D78] font-black text-sm flex items-center justify-center gap-2 hover:bg-rose-50 active:scale-[0.98] transition-all"
          onClick={() => setShowLogout(true)}
        >
          <LogOut size={18} /> Log Out
        </button>

        <p className="text-center text-[10px] font-bold text-gray-300">
          Recentgossips • Made for creators
        </p>
      </section>

      {/* Logout Modal */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-[90vw] max-w-xs flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-pink-100 text-pink-500 rounded-2xl flex items-center justify-center mb-4">
              <LogOut size={28} />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Log out?</h3>
            <p className="text-xs text-gray-500 mb-6 text-center">
              Are you sure you want to log out?
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowLogout(false)}
                className="flex-1 py-3 rounded-xl border border-gray-100 font-bold text-gray-600 text-xs bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 font-bold text-white text-xs shadow-lg shadow-pink-200"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

// Internal Helper for Settings Rows
const SettingsItem = ({ icon: Icon, title, sub, color, onClick }) => (
  <div
    className="flex items-center gap-4 p-5 border-b border-gray-50 last:border-none active:bg-gray-50 transition-colors cursor-pointer"
    onClick={onClick}
  >
    <div
      className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white shadow-sm`}
    >
      <Icon size={20} />
    </div>
    <div className="flex-1">
      <h4 className="font-bold text-sm text-[#1A1A1A]">{title}</h4>
      <p className="text-[11px] text-gray-400 font-medium">{sub}</p>
    </div>
    <ChevronRight size={18} className="text-gray-300" />
  </div>
);

export default DashboardView;
