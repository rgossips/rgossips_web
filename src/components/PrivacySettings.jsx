"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Eye, Shield, Smartphone, UserMinus, ChevronRight, ShieldCheck, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_PREFS = {
  publicProfile: true,
  showEmail: false,
  searchIndexing: true,
};

const PrivacySecurityPage = ({ onBack, onTrustedDevices, onDeactiveAccount }) => {
  const supabase = createClient();
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("user_preferences").select("privacy_prefs").eq("user_id", user.id).maybeSingle();
      if (cancelled) return;
      if (data?.privacy_prefs) {
        setSettings({ ...DEFAULT_PREFS, ...data.privacy_prefs });
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
      await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          privacy_prefs: settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  const justSaved = savedAt && Date.now() - savedAt < 3000;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans text-gray-900 lg:pt-24 lg:px-40">
      {/* Header */}
      <div className="sticky top-0 bg-white lg:bg-gray-50 z-30 px-6 py-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={onBack} className="p-2 cursor-pointer bg-pink-50 text-pink-500 rounded-full active:scale-90 transition-transform">
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div>
          <h1 className="text-lg font-black tracking-tight">Privacy & Security</h1>
          <p className="hidden lg:block text-[10px] text-gray-400 font-black uppercase tracking-widest">Control your account privacy and security settings</p>
        </div>
      </div>

      {!loaded ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-pink-500" />
        </div>
      ) : (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
          {/* Privacy Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <div className="p-2 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-100">
                <Eye size={18} />
              </div>
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Privacy Settings</h3>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] p-8 space-y-6 shadow-sm">
              <ToggleRow title="Public Profile" description="Allow brands to find your profile" isEnabled={settings.publicProfile} onToggle={() => toggleSetting("publicProfile")} />
              <ToggleRow title="Show Email" description="Display email on public profile" isEnabled={settings.showEmail} onToggle={() => toggleSetting("showEmail")} />
              <ToggleRow title="Search Indexing" description="Allow search engines to index profile" isEnabled={settings.searchIndexing} onToggle={() => toggleSetting("searchIndexing")} />
            </div>
          </section>

          {/* Security Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-100">
                <Shield size={18} />
              </div>
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Security Control</h3>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] p-8 space-y-6 shadow-sm">
              <SecurityLink onClick={onTrustedDevices} icon={<Smartphone size={18} />} title="Trusted Devices" description="Manage your active login sessions" />
              <SecurityLink onClick={onDeactiveAccount} icon={<UserMinus size={18} />} title="Deactivate Account" description="Temporarily disable your account" isDestructive />
            </div>

            {/* Security Tips Component */}
            <div className="mt-6">
              <SecurityTipsCard />
            </div>
          </section>
        </div>
      )}

      {/* Global Save Button - Desktop Floating / Mobile Fixed */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 z-40 lg:bg-transparent lg:border-none lg:relative lg:flex lg:justify-end lg:px-6 lg:pb-10 lg:items-center lg:gap-4">
        {justSaved ? <p className="hidden lg:block text-xs font-bold text-emerald-600">Saved ✓</p> : null}
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

// Security Tips Card (Matches your image)
const SecurityTipsCard = () => (
  <div className="bg-[#FFF9E6] border border-[#FFE7A1] rounded-[2rem] p-6 relative overflow-hidden">
    <div className="flex gap-4 relative z-10">
      <div className="p-3 bg-amber-400 text-white rounded-xl h-fit shadow-md">
        <ShieldCheck size={20} />
      </div>
      <div>
        <h4 className="text-sm font-black text-amber-900 mb-2">Security Tips</h4>
        <ul className="space-y-1.5">
          {["Use a strong, unique password", "Review trusted devices regularly", "Never share your password"].map((tip, i) => (
            <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-amber-700/80">
              <div className="w-1 h-1 rounded-full bg-amber-400" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

const ToggleRow = ({ title, description, isEnabled, onToggle }) => (
  <div className="flex items-center justify-between gap-4 cursor-pointer group" onClick={onToggle}>
    <div className="space-y-0.5">
      <h4 className="text-[13px] font-black text-gray-900 group-hover:text-pink-600 transition-colors">{title}</h4>
      <p className="text-[10px] font-bold text-gray-400">{description}</p>
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`relative cursor-pointer inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 outline-none border-2 ${
        isEnabled ? "bg-pink-500 border-pink-500 shadow-md shadow-pink-100" : "bg-gray-100 border-gray-100"
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${isEnabled ? "translate-x-5" : "translate-x-1"}`} />
    </button>
  </div>
);

const SecurityLink = ({ icon, title, description, isDestructive, onClick }) => (
  <div className="flex items-center gap-4 cursor-pointer group active:opacity-60 transition-all" onClick={onClick}>
    <div
      className={`p-2.5 rounded-xl transition-colors ${isDestructive ? "bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white" : "bg-gray-50 text-gray-500 group-hover:bg-pink-50 group-hover:text-pink-500"}`}
    >
      {icon}
    </div>
    <div className="flex-1">
      <h4 className={`text-[13px] font-black ${isDestructive ? "text-red-500" : "text-gray-900"}`}>{title}</h4>
      <p className="text-[10px] font-bold text-gray-400">{description}</p>
    </div>
    <ChevronRight size={16} className="text-gray-300 group-hover:text-pink-500 transition-colors" />
  </div>
);

export default PrivacySecurityPage;
