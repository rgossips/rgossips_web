"use client";
import React, { useEffect, useState } from "react";
import { Instagram, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export const RecentlyConnected = () => {
  const supabase = createClient();
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 10 most-recently-onboarded active influencers. RLS already restricts to
  // public-readable fields, no edge function needed.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("influencer_profiles")
        .select(
          "influencer_id, full_name, username, instagram_handle, profile_photo_url, custom_profile_photo_url"
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10);
      if (cancelled) return;
      setInfluencers(data || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <section className="w-full px-4 lg:px-6 overflow-hidden">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#1C115A]">
          Influencers Recently Connected
        </h2>
        <p className="text-slate-500 text-sm">
          Direct connects happening right now
        </p>
      </div>

      <div className="relative w-full">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-[#5B3DF5]" />
          </div>
        ) : influencers.length === 0 ? (
          <div className="text-center py-10 text-sm font-bold text-slate-400">
            No creators have joined yet.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory touch-pan-x">
            {influencers.map((i) => {
              const handle = i.instagram_handle || i.username;
              const photo = i.custom_profile_photo_url || i.profile_photo_url;
              const displayName = i.full_name || handle || "Influencer";
              const igUrl = handle ? `https://instagram.com/${handle}` : null;
              return (
                <div
                  key={i.influencer_id}
                  className="flex-none basis-[160px] md:basis-[180px] snap-start bg-white border border-slate-100 rounded-3xl p-5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative w-20 h-20 mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#5B3DF5] to-[#FF4E8E] p-[2px]">
                      <div className="bg-white rounded-full p-[2px] h-full w-full">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo}
                            alt={displayName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#5B3DF5] to-[#FF4E8E] text-white flex items-center justify-center text-xl font-bold">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <h3 className="font-bold text-[#1C115A] text-sm mb-1 truncate w-full px-1">
                    {displayName}
                  </h3>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-4 truncate w-full">
                    {handle ? `@${handle}` : "Creator"}
                  </p>

                  {igUrl ? (
                    <a
                      href={igUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-br from-[#FCAF45] via-[#E1306C] to-[#833AB4] text-white text-xs font-bold hover:opacity-90 active:scale-95 cursor-pointer"
                    >
                      <Instagram size={14} />
                      Instagram
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed"
                    >
                      <Instagram size={14} />
                      No handle
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
