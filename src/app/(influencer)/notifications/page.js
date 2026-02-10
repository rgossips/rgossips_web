"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, FileText, CheckCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation"; // Import the router

const NOTIFICATIONS = [
  {
    id: 1,
    title: "New Task Assigned to You!",
    description:
      "You have a new task for this sprint from Alicia. You can check your task 'Create Onboarding Screen' by tapping here.",
    time: "09:10",
    icon: <FileText className="w-6 h-6 text-[#E60076]" />,
    unread: true,
  },
  {
    id: 2,
    title: "Expense has been approved!",
    description:
      "Your expense has been approved by Jessica. View your expense report here.",
    time: "09:10",
    icon: <CheckCircle className="w-6 h-6 text-[#E60076]" />,
    unread: false,
  },
  {
    id: 3,
    title: "You have invited in meeting!",
    description:
      "You have been invited to a meeting. Tap to find the meeting details.",
    time: "09:10",
    icon: <Users className="w-6 h-6 text-[#E60076]" />,
    unread: false,
  },
];

export default function NotificationsPage() {
  const router = useRouter(); // Initialize router

  return (
    <div className="min-h-screen bg-[#F8F9FD] pb-10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white px-6 py-5 flex items-center justify-between shadow-sm">
        {/* Updated Back Button */}
        <button
          onClick={() => router.back()} // Go to -1 in history
          className="p-2 rounded-full bg-[#FCE6F1] hover:bg-[#F9CFE3] transition-colors active:scale-90"
        >
          <ChevronLeft className="w-6 h-6 text-[#E60076]" />
        </button>

        <h1 className="text-xl font-bold text-slate-800">Messages</h1>
        <div className="w-10" />
      </header>

      {/* Notification List */}
      <main className="max-w-2xl mx-auto mt-4 px-4 space-y-3">
        {NOTIFICATIONS.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${
              item.unread
                ? "bg-white border-slate-100 shadow-md"
                : "bg-white/60 border-transparent opacity-80"
            }`}
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#FCE6F1] flex items-center justify-center">
              {item.icon}
            </div>

            <div className="flex-grow space-y-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight">
                  {item.title}
                </h3>
                <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap ml-2">
                  {item.time}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                {item.description}
              </p>
            </div>

            {item.unread && (
              <div className="absolute top-5 right-2 w-2 h-2 bg-[#E60076] rounded-full" />
            )}
          </motion.div>
        ))}
      </main>

      <div className="mt-10 text-center">
        <button className="text-[#E60076] text-sm font-bold uppercase tracking-widest hover:underline">
          Mark all as read
        </button>
      </div>
    </div>
  );
}
