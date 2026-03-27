"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Flame,
  Heart,
  Eye,
  MoreHorizontal,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { IoPersonAddOutline } from "react-icons/io5";
import { LuMessageSquareText } from "react-icons/lu";

const posts = [
  {
    name: "Sarah Jenkins",
    handle: "@sarah",
    badge: "lu2022",
    time: "2h ago",
    title: "How I landed my first ₹10K deal as a 5K creator",
    desc: "It took a lot of cold emailing, but I finally figured out a framework that actually gets responses from brand managers...",
    tags: ["Sponsorships"],
    comments: 24,
    likes: 112,
    views: "2.4k",
    pinned: true,
    trending: true,
  },
  {
    name: "David Chen",
    handle: "@david",
    badge: "lu2022",
    time: "5h ago",
    title: "Rate card thread — what's everyone charging?",
    desc: "Let's be transparent. I'm currently at 20k on IG and 50k on TikTok. Here's my current rate card for 2024. Feel free to share yours!",
    tags: ["Pricing"],
    comments: 18,
    likes: 85,
    views: "1.2k",
    pinned: false,
    trending: true,
  },
];

const contributors = [
  {
    name: "Alex Rivera",
    handle: "@alexcreator",
    points: "1.2k",
    img: "https://i.pravatar.cc/100?img=11",
  },
  {
    name: "Elena Rodriguez",
    handle: "@elena",
    points: "850",
    img: "https://i.pravatar.cc/100?img=12",
  },
  {
    name: "Marcus Johnson",
    handle: "@marcus",
    points: "720",
    img: "https://i.pravatar.cc/100?img=13",
  },
];

export function CommunityFeed() {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const cardWidth = 300;
    let scrollPos = 0;

    const interval = setInterval(() => {
      scrollPos += cardWidth;
      if (scrollPos >= el.scrollWidth - el.clientWidth) {
        scrollPos = 0;
        el.scrollTo({ left: 0, behavior: "instant" });
      } else {
        el.scrollTo({ left: scrollPos, behavior: "smooth" });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full px-4 lg:px-10 my-8 lg:my-16">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h2 className="text-lg lg:text-xl font-bold text-slate-900 uppercase">
          Creator Community
        </h2>
        <p className="text-xs lg:text-sm text-slate-500 mt-1">
          Connect with other creators, share wins, and get advice on pricing and
          sponsorships.
        </p>
      </div>

      {/* MOBILE: Horizontal carousel */}
      <div
        ref={scrollRef}
        className="flex lg:hidden gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
      >
        {posts.map((post, index) => (
          <PostCard key={index} post={post} index={index} />
        ))}
      </div>

      {/* DESKTOP: Full grid layout — both columns same height */}
      <div className="hidden lg:grid grid-cols-12 gap-8 items-stretch">
        {/* LEFT COLUMN */}
        <div className="col-span-8 space-y-4 flex flex-col">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 text-lg">
              Community Feed
            </h3>
            <button className="flex items-center gap-2 text-sm px-5 py-1.5 border rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition-colors">
              Latest <ChevronUp size={14} />
            </button>
          </div>

          {posts.map((post, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PostCard post={post} index={index} />
            </motion.div>
          ))}

        </div>

        {/* RIGHT SIDEBAR — same height as left */}
        <div className="col-span-4 flex flex-col gap-5">
          <Card className="p-5 rounded-2xl border bg-white">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">📊</span>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Community Stats
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center bg-slate-50 flex flex-col items-center justify-center py-5 rounded-2xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <IoPersonAddOutline size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Members
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-800">12.4k</p>
              </div>
              <div className="text-center bg-slate-50 flex flex-col items-center justify-center py-5 rounded-2xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <LuMessageSquareText size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Online
                  </span>
                </div>
                <p className="text-2xl font-black text-green-600">342</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border bg-white flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">⭐</span>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Top Contributors
              </h4>
            </div>
            <div className="space-y-4">
              {contributors.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image
                      src={c.img}
                      width={32}
                      height={32}
                      alt="avatar"
                      className="rounded-full"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-tight">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-slate-400">{c.handle}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-500">
                    {c.points}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function PostCard({ post, index }) {
  return (
    <Card className="p-5 rounded-2xl border bg-white hover:shadow-md transition min-w-[280px] w-[280px] lg:w-auto lg:min-w-0 snap-start shrink-0 lg:shrink flex flex-col">
      {/* User row + menu */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Image
            src={`https://i.pravatar.cc/150?img=${index + 3}`}
            width={36}
            height={36}
            alt="avatar"
            className="rounded-full"
          />
          <div className="text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800">{post.name}</span>
              {post.pinned && (
                <span className="bg-purple-100 text-purple-600 text-[9px] font-bold px-1.5 py-0.5 rounded">
                  PINNED
                </span>
              )}
            </div>
            <div className="text-slate-400">
              {post.handle} · {post.badge || ""} {post.time}
            </div>
          </div>
        </div>
        <button className="text-slate-300 hover:text-slate-500 transition-colors p-1 hidden lg:block">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Title */}
      <h4 className="font-bold text-sm lg:text-base text-slate-800 mb-1.5 line-clamp-2">
        {post.title}
      </h4>

      {/* Description */}
      <p className="text-xs lg:text-sm text-slate-500 mb-3 line-clamp-3 flex-1">
        {post.desc}
      </p>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          {post.tags.map((tag, i) => (
            <span
              key={i}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100"
            >
              {tag}
            </span>
          ))}
          {post.trending && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-500 border border-orange-100">
              <Flame size={10} /> Trending
            </span>
          )}
        </div>
      )}

      {/* Footer stats */}
      <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-50">
        <span className="flex items-center gap-1">
          <Heart size={14} />
          {post.likes}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare size={14} />
          {post.comments}
        </span>
        <span className="flex items-center gap-1">
          <Eye size={14} />
          {post.views}
        </span>
      </div>
    </Card>
  );
}
