"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Flame, Heart, Eye, Plus } from "lucide-react";
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
  return (
    <section className="w-full px-10 my-16">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 uppercase">
          Creator Community
        </h2>
        <p className="text-sm text-slate-500 pl-2 mt-2">
          Connect with other creators, share wins, and get advice on pricing and
          sponsorships.
        </p>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-9 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN */}
        <div className="col-span-9 space-y-4">
          {/* Feed Header */}
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

          {/* Posts */}
          {posts.map((post, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-5 rounded-2xl border bg-white hover:shadow-md transition">
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
                    <span className="font-semibold text-slate-800">
                      {post.name}
                    </span>{" "}
                    {post.pinned && (
                      <span className="text-purple-500 font-semibold ml-1">
                        PINNED
                      </span>
                    )}
                    <div className="text-slate-400">
                      {post.handle} · {post.time}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-slate-800 mb-2">
                  {post.title}
                </h4>

                {/* Description */}
                <p className="text-sm text-slate-500 mb-4">{post.desc}</p>

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

                  <div className="flex items-center gap-1 text-orange-500 text-[11px] font-semibold">
                    <Flame size={12} />
                    Trending
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Load More */}
          <button className="w-full cursor-pointer hover:scale-[105%] py-3 text-sm text-slate-500 bg-slate-100 rounded-xl">
            Load more discussions
          </button>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="col-span-9 lg:col-span-3 space-y-6">
          <div className="btn-purple flex items-center justify-center gap-3 px-3 py-2 rounded-2xl cursor-pointer">
            <FaPlus /> Start a Discussions
          </div>
          {/* Community Stats */}
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

          {/* Top Contributors */}
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
