import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Flame, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const posts = [
  {
    title: "How I landed my first ₹10K deal as a 5K creator",
    comments: 24,
    trending: true,
  },
  {
    title: "Rate card thread — what's everyone charging?",
    comments: 18,
    trending: true,
  },
  {
    title: "New here? Introduce yourself 👋",
    comments: 42,
    trending: false,
  },
];

export function CommunityFeed() {
  return (
    <div className="w-full px-10 space-y-4 my-10">
      <h2 className="text-xl font-bold text-slate-900 px-2">
        Creator Community
      </h2>

      <div className="space-y-3">
        {posts.map((post, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group cursor-pointer p-5 bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all rounded-2xl flex justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {post.title}
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                    <MessageSquare size={14} className="mt-0.5" />
                    {post.comments}
                  </div>
                  {post.trending && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-tighter">
                      <Flame size={12} fill="currentColor" />
                      Trending
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all"
              />
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
