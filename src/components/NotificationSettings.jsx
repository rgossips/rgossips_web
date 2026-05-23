import React, { useState } from "react";
import { ArrowLeft, TrendingUp, Bell } from "lucide-react";

const NotificationSettings = ({ onBack }) => {
  // State for toggles
  const [settings, setSettings] = useState({
    campaignUpdates: true,
    applicationStatus: true,
    deadlineReminders: true,
    paymentAlerts: true,
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans text-gray-900 lg:pt-24 lg:px-40">
      {/* Header */}
      <div className="sticky top-0 bg-white lg:bg-gray-50 z-30 px-6 py-4 flex items-center gap-4 border-b border-gray-100">
        <button
          onClick={onBack}
          className="p-2 cursor-pointer bg-pink-50 text-pink-500 rounded-full active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div>
          <h1 className="text-lg lg:text-2xl font-black tracking-tight">
            Notification Settings
          </h1>
          <p className="hidden lg:block text-[10px] text-gray-400 font-black uppercase tracking-widest">
            Manage your notification preferences and communication settings
          </p>
        </div>
      </div>

      {/* Desktop Layout - 2 Column Grid */}
      <div className="hidden lg:grid grid-cols-2 gap-x-8 gap-y-2 max-w-6xl mx-auto px-8 py-8">
        {/* Campaign Notifications Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="p-2 bg-pink-500 text-white rounded-xl">
              <TrendingUp size={18} />
            </div>
            <h3 className="font-black text-xs uppercase tracking-wider text-gray-900">
              Campaign Notifications
            </h3>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-6 shadow-md">
            <ToggleRow
              title="Campaign Updates"
              description="New campaigns matching your profile"
              isEnabled={settings.campaignUpdates}
              onToggle={() => toggleSetting("campaignUpdates")}
            />
            <ToggleRow
              title="Application Status"
              description="Updates on your applications"
              isEnabled={settings.applicationStatus}
              onToggle={() => toggleSetting("applicationStatus")}
            />
            <ToggleRow
              title="Deadline Reminders"
              description="Content submission deadlines"
              isEnabled={settings.deadlineReminders}
              onToggle={() => toggleSetting("deadlineReminders")}
            />
          </div>
        </section>

        {/* Financial Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="p-2 bg-emerald-500 text-white rounded-xl">
              <Bell size={18} />
            </div>
            <h3 className="font-black text-xs uppercase tracking-wider text-gray-900">
              Financial
            </h3>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-md">
            <ToggleRow
              title="Payment Alerts"
              description="Payment received notifications"
              isEnabled={settings.paymentAlerts}
              onToggle={() => toggleSetting("paymentAlerts")}
            />
          </div>
        </section>
      </div>

      {/* Mobile Layout */}
      <div className="block lg:hidden p-5 space-y-8">
        {/* Campaign Notifications Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="p-2 bg-pink-500 text-white rounded-xl">
              <TrendingUp size={18} />
            </div>
            <h3 className="font-black text-xs uppercase tracking-wider text-gray-900">
              Campaign Notifications
            </h3>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-6 shadow-md">
            <ToggleRow
              title="Campaign Updates"
              description="New campaigns matching your profile"
              isEnabled={settings.campaignUpdates}
              onToggle={() => toggleSetting("campaignUpdates")}
            />
            <ToggleRow
              title="Application Status"
              description="Updates on your applications"
              isEnabled={settings.applicationStatus}
              onToggle={() => toggleSetting("applicationStatus")}
            />
            <ToggleRow
              title="Deadline Reminders"
              description="Content submission deadlines"
              isEnabled={settings.deadlineReminders}
              onToggle={() => toggleSetting("deadlineReminders")}
            />
          </div>
        </section>

        {/* Financial Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="p-2 bg-emerald-500 text-white rounded-xl">
              <Bell size={18} />
            </div>
            <h3 className="font-black text-xs uppercase tracking-wider text-gray-900">
              Financial
            </h3>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-md">
            <ToggleRow
              title="Payment Alerts"
              description="Payment received notifications"
              isEnabled={settings.paymentAlerts}
              onToggle={() => toggleSetting("paymentAlerts")}
            />
          </div>
        </section>
      </div>

      {/* Global Save Button - Desktop Floating / Mobile Fixed */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 z-40 lg:bg-transparent lg:border-none lg:relative lg:flex lg:justify-end lg:px-6 lg:pb-10">
        <button className="w-full cursor-pointer lg:w-auto bg-gradient-to-r from-pink-500 to-rose-500 text-white px-10 py-4 rounded-xl font-black text-sm shadow-xl shadow-pink-200 active:scale-95 transition-all">
          Save Changes
        </button>
      </div>
    </div>
  );
};

// Reusable Toggle Row Component
const ToggleRow = ({ title, description, isEnabled, onToggle }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="space-y-1">
      <h4 className="text-[13px] font-black text-gray-900">{title}</h4>
      <p className="text-[10px] font-bold text-gray-400">{description}</p>
    </div>
    <button
      onClick={onToggle}
      className={`relative cursor-pointer inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 outline-none border-2 ${
        isEnabled
          ? "bg-pink-500 border-pink-500"
          : "bg-gray-100 border-gray-200"
      }`}
      aria-pressed={isEnabled}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
          isEnabled ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

export default NotificationSettings;
