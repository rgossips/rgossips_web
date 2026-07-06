"use client";
import React, { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// B7 — external avatar URLs (Google-hosted etc.) sometimes fail to load
// with a 0 natural width. onError flips to the initial-letter fallback
// so the card never renders a broken image.
function Avatar({ photo, displayName }) {
  const [failed, setFailed] = useState(false);
  const showImage = photo && !failed;
  return (
    <div className="bg-white rounded-full p-[2px] h-full w-full">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={displayName}
          onError={() => setFailed(true)}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#5B3DF5] to-[#FF4E8E] text-white flex items-center justify-center text-xl font-bold">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

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
          "influencer_id, full_name, username, instagram_handle, profile_photo_url, custom_profile_photo_url, media_kit_published"
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
        <h2 className="text-2xl font-black text-[#1C115A] tracking-tight">
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
              // B7 — Media Kit button replaces the removed Instagram
              // button, but only when a kit exists (B4 gating rule).
              const kitUrl = handle && i.media_kit_published ? `/kit/${handle}` : null;
              return (
                <div
                  key={i.influencer_id}
                  className="flex-none basis-[160px] md:basis-[180px] snap-start bg-white border border-slate-100 rounded-3xl p-5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative w-20 h-20 mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#5B3DF5] to-[#FF4E8E] p-[2px]">
                      <Avatar photo={photo} displayName={displayName} />
                    </div>
                  </div>

                  <h3 className="font-bold text-[#1C115A] text-sm mb-1 truncate w-full px-1">
                    {displayName}
                  </h3>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1 truncate w-full">
                    {handle ? `@${handle}` : "Creator"}
                  </p>

                  {kitUrl && (
                    <a
                      href={kitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#5B3DF5]/10 text-[#5B3DF5] text-xs font-bold hover:bg-[#5B3DF5] hover:text-white transition-colors cursor-pointer"
                    >
                      <FileText size={13} />
                      Media Kit
                    </a>
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
