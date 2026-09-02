"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Check, Megaphone, Send } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// A campaign is invitable if it's LIVE — active status and not past its end
// date. A direct brand invite is a private channel, so it's NOT bound by the
// public application deadline (an invited creator can still apply). Ended /
// completed / paused / draft campaigns are excluded.
function isInvitable(c) {
  if (c?.status !== "active") return false;
  if (c.endDate && new Date(c.endDate).getTime() < Date.now()) return false;
  return true;
}

// Shared "invite selected creators to a campaign" modal. Used by Find Creators,
// the campaign detail page, and the AI matchers. Pass `campaignId` to skip the
// picker (Flow B — the campaign is already known). Calls brand-campaigns
// `inviteInfluencers` and reports back via onDone(result).
export default function CampaignPickerModal({
  open,
  onClose,
  brandId,
  influencerIds = [],
  campaignId = null,
  campaignTitle = "",
  onDone,
}) {
  const supabase = useMemo(() => createClient(), []);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(campaignId || null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const count = influencerIds.length;
  const skipPicker = !!campaignId;

  // Always fetch the brand's campaigns — even in skip-picker mode (Flow B),
  // so we can show the pre-bound campaign's real name + banner.
  useEffect(() => {
    if (!open) return;
    setError("");
    setPicked(campaignId || null);
    if (!brandId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.functions.invoke("brand-campaigns", {
          body: { action: "list", brandId },
        });
        if (cancelled) return;
        setCampaigns(data?.campaigns || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, brandId, campaignId, supabase]);

  if (!open) return null;

  // Selection list is invitable-only; the pre-bound (Flow B) campaign is looked
  // up from the full list so its name/banner still show even if edge-filtered.
  const invitableCampaigns = campaigns.filter(isInvitable);
  const boundCampaign = campaignId ? campaigns.find((c) => c.id === campaignId) : null;

  const send = async () => {
    const targetCampaign = campaignId || picked;
    if (!targetCampaign) {
      setError("Pick a campaign first.");
      return;
    }
    if (count === 0) {
      setError("No creators selected.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const { data } = await supabase.functions.invoke("brand-campaigns", {
        body: { action: "inviteInfluencers", brandId, campaignId: targetCampaign, influencerIds },
      });
      if (data?.error) {
        setError(
          data.error === "brand_not_verified"
            ? "Your brand is still under review. You can invite creators once verified."
            : data.error === "campaign_not_active"
              ? "You can only invite creators to a live (active) campaign."
              : data.message || "Couldn't send invites. Please try again.",
        );
        setSending(false);
        return;
      }
      onDone?.(data || {});
      onClose?.();
    } catch {
      setError("Couldn't send invites. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[440px] max-h-[85vh] flex flex-col bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E9F4]">
          <div>
            <h3 className="text-sm font-extrabold text-[#16224E]">Invite to campaign</h3>
            <p className="text-[11px] text-[#6B6785] mt-0.5">
              {count} creator{count === 1 ? "" : "s"} selected
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 cursor-pointer">
            <X size={18} className="text-[#6B6785]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {skipPicker ? (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-indigo-100 bg-indigo-50/50">
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 grid place-items-center shrink-0 overflow-hidden">
                {boundCampaign?.bannerImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={boundCampaign.bannerImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Megaphone size={16} className="text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-[#16224E] truncate">
                  {boundCampaign?.title || campaignTitle || (loading ? "Loading…" : "This campaign")}
                </p>
                <p className="text-[11px] text-[#6B6785]">Selected creators will be invited here.</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-[#6A66C9]" />
            </div>
          ) : invitableCampaigns.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-sm font-semibold text-gray-700">No live campaigns</p>
              <p className="text-xs text-[#9C97B8] mt-1">
                Publish and get a campaign approved (live) before inviting creators to it.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {invitableCampaigns.map((c) => {
                const active = picked === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setPicked(c.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      active ? "border-[#6A66C9] bg-indigo-50/60" : "border-[#E4E9F4] hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 grid place-items-center shrink-0 overflow-hidden">
                      {c.bannerImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.bannerImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Megaphone size={16} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#16224E] truncate">{c.title || "Untitled campaign"}</p>
                      <p className="text-[11px] text-[#6B6785] truncate">
                        {c.applicationsTotal || 0} application{(c.applicationsTotal || 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full grid place-items-center shrink-0 border ${
                        active ? "bg-[#6A66C9] border-[#6A66C9]" : "border-gray-300"
                      }`}
                    >
                      {active && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="px-5 text-[12px] text-red-600 pb-2">{error}</p>}

        <div className="px-5 py-4 border-t border-[#E4E9F4]">
          <button
            onClick={send}
            disabled={sending || count === 0 || (!campaignId && !picked)}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#6A66C9] text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? "Sending…" : `Send ${count} invite${count === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
