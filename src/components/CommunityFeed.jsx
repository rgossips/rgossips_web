"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Flame, Heart, Eye } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { FaPlus } from "react-icons/fa";
import { IoPersonAddOutline } from "react-icons/io5";
import { LuMessageSquareText } from "react-icons/lu";

const posts = [
  {
    name: "Sarah Jenkins",
    handle: "@sarah",
    time: "2h ago",
    title: "How I landed my first ₹10K deal as a 5K creator",
    desc: "It took a lot of cold emailing, but I finally figured out a framework that actually gets responses from brand managers...",
    comments: 24,
    likes: 112,
    views: "2.4k",
    pinned: true,
  },
  {
    name: "David Chen",
    handle: "@david",
    time: "5h ago",
    title: "Rate card thread — what's everyone charging?",
    desc: "Let's be transparent. I'm currently at 20k on IG and 50k on TikTok. Here's my current rate card for 2024...",
    comments: 18,
    likes: 85,
    views: "1.2k",
    pinned: false,
  },
  {
    name: "Priya Sharma",
    handle: "@priya",
    time: "8h ago",
    title: "Best tools for tracking brand deal ROI?",
    desc: "I've been using spreadsheets but there has to be a better way. What tools do you all use to track your campaigns...",
    comments: 31,
    likes: 67,
    views: "980",
    pinned: false,
  },
];

const contributors = [
  {
    name: "Alex Rivera",
    points: "1.2k",
    img: "https://i.pravatar.cc/100?img=11",
  },
  {
    name: "Elena Rodriguez",
    points: "850",
    img: "https://i.pravatar.cc/100?img=12",
  },
  {
    name: "Marcus Johnson",
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

      {/* DESKTOP: Full grid layout */}
      <div className="hidden lg:grid grid-cols-12 gap-8">
        {/* LEFT COLUMN */}
        <div className="col-span-9 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 text-lg">
              Community Feed
            </h3>
            <div className="flex gap-3">
              <button className="text-sm px-5 py-1 border rounded-lg bg-white cursor-pointer">
                Latest
              </button>
            </div>
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

          <button className="w-full cursor-pointer hover:scale-[1.02] transition-transform py-3 text-sm text-slate-500 bg-slate-100 rounded-xl">
            Load more discussions
          </button>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="col-span-3 space-y-6">
          <div className="btn-purple flex items-center justify-center gap-3 px-3 py-2 rounded-2xl cursor-pointer">
            <FaPlus /> Start a Discussion
          </div>

          <Card className="p-5 rounded-2xl border bg-white">
            <h4 className="text-sm font-semibold mb-4">COMMUNITY STATS</h4>
            <div className="flex justify-between">
              <div className="text-center bg-slate-100 w-[125px] flex flex-col items-center justify-center aspect-square rounded-3xl">
                <div className="flex items-center gap-2 mb-1">
                  <IoPersonAddOutline />
                  <p className="text-xl font-bold">12.4k</p>
                </div>
                <p className="text-xs text-slate-400">Members</p>
              </div>
              <div className="text-center bg-slate-100 w-[125px] flex flex-col items-center justify-center aspect-square rounded-3xl">
                <div className="flex items-center gap-2 mb-1">
                  <LuMessageSquareText />
                  <p className="text-xl font-bold text-green-600">342</p>
                </div>
                <p className="text-xs text-slate-400">Online</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border bg-white">
            <h4 className="text-sm font-semibold mb-4">TOP CONTRIBUTORS</h4>
            <div className="space-y-3">
              {contributors.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image
                      src={c.img}
                      width={28}
                      height={28}
                      alt="avatar"
                      className="rounded-full"
                    />
                    <span className="text-sm text-slate-700">{c.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{c.points}</span>
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
      {/* User */}
      <div className="flex items-center gap-3 mb-3">
        <Image
          src={`https://i.pravatar.cc/150?img=${index + 3}`}
          width={32}
          height={32}
          alt="avatar"
          className="rounded-full"
        />
        <div className="text-xs">
          <span className="font-semibold text-slate-800">{post.name}</span>{" "}
          {post.pinned && (
            <span className="text-purple-500 font-semibold ml-1">PINNED</span>
          )}
          <div className="text-slate-400">
            {post.handle} · {post.time}
          </div>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-sm lg:text-base text-slate-800 mb-2 line-clamp-2">
        {post.title}
      </h4>

      {/* Description */}
      <p className="text-xs lg:text-sm text-slate-500 mb-4 line-clamp-3 flex-1">
        {post.desc}
      </p>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-slate-400">
        <div className="flex gap-3">
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
        {post.pinned && (
          <div className="flex items-center gap-1 text-orange-500 text-[11px] font-semibold">
            <Flame size={12} />
            Trending
          </div>
        )}
      </div>
    </Card>
  );
}
