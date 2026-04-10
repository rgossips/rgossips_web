"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MediaKitLayout from "@/components/MediaKitLayout";
import { Loader2, ExternalLink } from "lucide-react";
import Image from "next/image";
import logo from "@/assets/logo2.png";

export default function PublicMediaKitPage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

        const res = await fetch(`${supabaseUrl}/functions/v1/public-media-kit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ username: id }),
        });

        const data = await res.json();

        if (data?.profile) {
          setProfile(data.profile);
        } else {
          setError("Media kit not found");
        }
      } catch (err) {
        console.error("Error fetching media kit:", err);
        setError("Failed to load media kit");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-purple-500" />
          <p className="text-sm text-slate-500 font-semibold">Loading media kit...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F7FB] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
            <ExternalLink size={24} className="text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">{error}</h1>
          <p className="text-sm text-slate-500">
            This media kit may have been removed or the link is invalid.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Go to RGossips
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7FB]">
      {/* Minimal public header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/">
            <Image src={logo} alt="RGossips" width={140} height={36} className="h-8 w-auto" />
          </a>
          <a
            href="/login"
            className="text-xs font-bold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            Join RGossips
          </a>
        </div>
      </div>

      {/* Media Kit */}
      <div className="max-w-4xl mx-auto px-0 sm:px-4 py-0 sm:py-6 lg:py-10">
        <div className="bg-white sm:rounded-3xl shadow-xl sm:border border-slate-100 overflow-hidden">
          <MediaKitLayout profile={profile} isPublic />
        </div>
      </div>
    </div>
  );
}
