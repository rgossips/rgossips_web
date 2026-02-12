import React, { useState } from "react";
import { ArrowLeft, TrendingUp, MessageSquare, Bell, Mail } from "lucide-react";

const NotificationSettings = ({ onBack }) => {
  // State for toggles
  const [settings, setSettings] = useState({
    campaignUpdates: true,
    applicationStatus: true,
    deadlineReminders: true,
    newMessages: true,
    newMatches: true,
    paymentAlerts: true,
    marketingEmails: false,
    weeklyReport: true,
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white z-20 px-6 py-4 flex items-center gap-4 border-b border-gray-100">
        <button
          onClick={onBack}
          className="p-2 bg-pink-50 text-pink-500 rounded-full active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <h1 className="text-lg font-black tracking-tight">
          Notification Settings
        </h1>
      </div>

      <div className="p-5 space-y-8">
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

          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 space-y-6 shadow-md">
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

        {/* Communication Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="p-2 bg-blue-500 text-white rounded-xl">
              <MessageSquare size={18} />
            </div>
            <h3 className="font-black text-xs uppercase tracking-wider text-gray-900">
              Communication
            </h3>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 space-y-6 shadow-md">
            <ToggleRow
              title="New Messages"
              description="Messages from brands"
              isEnabled={settings.newMessages}
              onToggle={() => toggleSetting("newMessages")}
            />
            <ToggleRow
              title="New Matches"
              description="AI-powered campaign matches"
              isEnabled={settings.newMatches}
              onToggle={() => toggleSetting("newMatches")}
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

          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-md">
            <ToggleRow
              title="Payment Alerts"
              description="Payment received notifications"
              isEnabled={settings.paymentAlerts}
              onToggle={() => toggleSetting("paymentAlerts")}
            />
          </div>
        </section>

        {/* Marketing Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="p-2 bg-violet-500 text-white rounded-xl">
              <Mail size={18} />
            </div>
            <h3 className="font-black text-xs uppercase tracking-wider text-gray-900">
              Marketing
            </h3>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 space-y-6 shadow-md">
            <ToggleRow
              title="Marketing Emails"
              description="Product updates and tips"
              isEnabled={settings.marketingEmails}
              onToggle={() => toggleSetting("marketingEmails")}
            />
            <ToggleRow
              title="Weekly Report"
              description="Performance summary"
              isEnabled={settings.weeklyReport}
              onToggle={() => toggleSetting("weeklyReport")}
            />
          </div>
        </section>
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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 outline-none border-2 ${
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
