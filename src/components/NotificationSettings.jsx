"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, TrendingUp, Bell, Loader2, RotateCcw } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_PREFS = {
  campaignUpdates: true,
  applicationStatus: true,
  deadlineReminders: true,
  paymentAlerts: true,
};

const NotificationSettings = ({ onBack }) => {
  const supabase = createClient();
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  // Load prefs from DB on mount. A missing row means "all defaults".
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("notification_prefs")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.notification_prefs) {
        setSettings({ ...DEFAULT_PREFS, ...data.notification_prefs });
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, supabase]);

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await supabase
        .from("user_preferences")
        .upsert(
          {
            user_id: user.id,
            notification_prefs: settings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefaults = () => {
    setSettings(DEFAULT_PREFS);
  };

  const justSaved = savedAt && Date.now() - savedAt < 3000;

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
        <div className="flex-1">
          <h1 className="text-lg lg:text-2xl font-black tracking-tight">
            Notification Settings
          </h1>
          <p className="hidden lg:block text-[10px] text-gray-400 font-black uppercase tracking-widest">
            Manage your notification preferences and communication settings
          </p>
        </div>
        <button
          onClick={handleRestoreDefaults}
          className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-black text-slate-500 hover:text-pink-500 px-3 py-2 rounded-full cursor-pointer transition-colors"
          title="Restore default settings"
        >
          <RotateCcw size={13} /> Restore defaults
        </button>
      </div>

      {!loaded ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-pink-500" />
        </div>
      ) : (
        <>
          {/* Desktop Layout - 2 Column Grid */}
          <div className="hidden lg:grid grid-cols-2 gap-x-8 gap-y-2 max-w-6xl mx-auto px-8 py-8">
            <NotificationSections settings={settings} toggleSetting={toggleSetting} />
          </div>

          {/* Mobile Layout */}
          <div className="block lg:hidden p-5 space-y-8">
            <NotificationSections settings={settings} toggleSetting={toggleSetting} />
            <button
              onClick={handleRestoreDefaults}
              className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-black text-slate-500 py-3 rounded-xl border border-slate-200 cursor-pointer"
            >
              <RotateCcw size={14} /> Restore defaults
            </button>
          </div>
        </>
      )}

      {/* Global Save Button - Desktop Floating / Mobile Fixed */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 z-40 lg:bg-transparent lg:border-none lg:relative lg:flex lg:justify-end lg:px-6 lg:pb-10 lg:items-center lg:gap-4">
        {justSaved && (
          <p className="hidden lg:block text-xs font-bold text-emerald-600">Saved ✓</p>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !loaded}
          className="w-full cursor-pointer lg:w-auto bg-gradient-to-r from-pink-500 to-rose-500 text-white px-10 py-4 rounded-xl font-black text-sm shadow-xl shadow-pink-200 active:scale-95 transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving…" : justSaved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

const NotificationSections = ({ settings, toggleSetting }) => (
  <>
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
  </>
);

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
