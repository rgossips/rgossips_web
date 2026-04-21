"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CampaignCard } from "@/components/brands/CampaignCard";
import {
  Search,
  Plus,
  X,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";

// Heavy create form — code-split so list view loads fast
const CreateCampaignDialog = dynamic(
  () => import("@/components/brands/CreateCampaignDialog").then((m) => m.CreateCampaignDialog),
  { ssr: false }
);

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Live" },
  { key: "draft", label: "Drafts" },
  { key: "paused", label: "Paused" },
  { key: "completed", label: "Completed" },
];

const CampaignsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("all");
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const loadRef = useRef(0);

  const loadCampaigns = async () => {
    if (!user?.id) return;
    const myLoad = ++loadRef.current;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("brand-campaigns", {
      body: { action: "list", brandId: user.id },
    });
    if (myLoad !== loadRef.current) return; // stale
    if (error || data?.error) {
      console.error("Failed to load campaigns:", error || data?.error);
      setCampaigns([]);
    } else {
      setCampaigns(data?.campaigns || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user?.id) loadCampaigns();
  }, [authLoading, user?.id]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (activeTab !== "all" && c.status !== activeTab) return false;
      if (q) {
        const hay = `${c.title || ""} ${c.description || ""} ${(c.categories || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [campaigns, activeTab, searchText]);

  const counts = useMemo(() => {
    const map = { all: campaigns.length, active: 0, draft: 0, paused: 0, completed: 0 };
    for (const c of campaigns) {
      if (map[c.status] !== undefined) map[c.status]++;
    }
    return map;
  }, [campaigns]);

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-24">
      {/* Header */}
      <section className="w-full bg-linear-to-b from-[#4C75BE] to-[#4A3996] px-6 pt-12 pb-16 mb-16 lg:mb-24 rounded-b-[40px] text-white relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Campaigns</h1>
            <p className="text-purple-100 text-xs">Manage your campaign requests</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="hidden lg:flex items-center gap-2 bg-white text-[#5851DB] px-4 py-2 rounded-2xl font-bold text-sm shadow-lg shadow-purple-900/20 cursor-pointer"
          >
            <Plus size={16} /> New Campaign
          </button>
        </div>

        <div className="absolute left-6 right-6 -bottom-10 lg:-bottom-18 flex flex-col gap-5 lg:flex-row items-center justify-between">
          <div className="flex items-center bg-white rounded-3xl flex-1 min-w-full lg:min-w-auto lg:max-w-[50%] p-2 shadow-md shadow-gray-200">
            <Search className="text-gray-300 ml-3" size={18} />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full px-3 text-sm text-gray-800 outline-none placeholder:text-gray-300 bg-transparent"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="text-gray-400 p-1 mr-2 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-[#5851DB] text-white shadow-lg shadow-purple-100"
                    : "bg-white text-gray-500"
                }`}
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span className={`ml-1.5 text-[10px] ${activeTab === tab.key ? "text-white/80" : "text-gray-400"}`}>
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* List */}
      <div className="px-6 mt-8">
        {loading || authLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#5851DB]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12 px-10 text-center">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
              <Plus size={36} className="text-[#5851DB]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchText || activeTab !== "all"
                ? "No campaigns match"
                : "No campaigns yet"}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              {searchText || activeTab !== "all"
                ? "Try a different search or filter."
                : "Create your first campaign to start connecting with creators."}
            </p>
            {!(searchText || activeTab !== "all") && (
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-8 bg-[#5851DB] text-white px-8 py-4 rounded-2xl shadow-lg shadow-purple-200 flex items-center gap-2 font-bold text-sm cursor-pointer"
              >
                Create Campaign <ArrowUpRight size={18} />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
            {filtered.map((c) => (
              <CampaignCard key={c.id} {...c} />
            ))}
          </div>
        )}
      </div>

      {/* Floating FAB (mobile) */}
      <button
        onClick={() => setCreateOpen(true)}
        className="lg:hidden fixed cursor-pointer bottom-24 right-6 bg-[#5851DB] text-white px-6 py-3 rounded-2xl shadow-lg shadow-purple-200 flex items-center gap-2 font-bold text-sm z-40 active:scale-95"
      >
        <Plus size={20} /> Create
      </button>

      {createOpen && (
        <CreateCampaignDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          brandId={user?.id}
          onCreated={() => {
            setCreateOpen(false);
            loadCampaigns();
          }}
        />
      )}
    </div>
  );
};

export default CampaignsPage;
