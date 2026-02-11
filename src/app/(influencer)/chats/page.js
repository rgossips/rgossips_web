"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronLeft,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Box,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"; // For back navigation

export default function ChatModule() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 1024);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#F8F9FD] overflow-hidden font-sans">
      {/* Sidebar */}
      <div
        className={`${isMobile && selectedChat ? "hidden" : "flex"} w-full lg:w-[400px] flex-col border-r bg-white`}
      >
        {/* Header with Back Button */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            {/* The Pink Circular Back Button from your image */}
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-[#FCE6F1] hover:bg-[#F9CFE3] transition-colors active:scale-90 flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6 text-[#E60076]" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">Messages</h1>
          </div>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <Input
              className="pl-10 bg-slate-50 border-none rounded-xl h-12"
              placeholder="Search messages..."
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {CONTACTS.map((contact) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={contact.id}
              onClick={() => setSelectedChat(contact)}
              className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all mb-1 ${
                selectedChat?.id === contact.id
                  ? "bg-[#FCE6F1]"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback>{contact.name[0]}</AvatarFallback>
                </Avatar>
                {contact.unread && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E60076] border-2 border-white text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {contact.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span
                    className={`font-bold text-sm ${selectedChat?.id === contact.id ? "text-[#E60076]" : "text-slate-800"}`}
                  >
                    {contact.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {contact.time}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {contact.lastMsg}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <AnimatePresence mode="wait">
        {(selectedChat || !isMobile) && (
          <motion.div
            key={selectedChat?.id || "empty"}
            initial={isMobile ? { x: "100%" } : { opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%" }}
            className={`${isMobile && !selectedChat ? "hidden" : "flex"} flex-1 flex-col bg-[#F8F9FD] h-full relative`}
          >
            {selectedChat ? (
              <>
                <header className="bg-white p-4 lg:px-8 lg:py-5 flex items-center justify-between border-b shadow-sm sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    {isMobile && (
                      <button
                        onClick={() => setSelectedChat(null)}
                        className="p-2 rounded-full bg-[#FCE6F1]"
                      >
                        <ChevronLeft className="w-5 h-5 text-[#E60076]" />
                      </button>
                    )}
                    <Avatar className="h-10 w-10 ring-2 ring-[#FCE6F1]">
                      <AvatarImage src={selectedChat.avatar} />
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm lg:text-base">
                        {selectedChat.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                          Active Now
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 rounded-full"
                    >
                      <Search size={20} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 rounded-full"
                    >
                      <MoreVertical size={20} />
                    </Button>
                  </div>
                </header>

                <div className="flex-1 max-h-[75%] overflow-y-auto p-4 lg:p-8 space-y-6 scrollbar-hide">
                  {MOCK_MESSAGES.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] lg:max-w-[70%] p-4 rounded-2xl shadow-sm text-sm ${
                          msg.sender === "me"
                            ? "bg-[#E60076] text-white rounded-tr-none shadow-[#E60076]/20"
                            : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                        }`}
                      >
                        <p className="leading-relaxed">{msg.text}</p>
                        <span
                          className={`text-[9px] mt-2 block font-medium opacity-70 ${msg.sender === "me" ? "text-right" : ""}`}
                        >
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Input UI */}
                <footer className="p-4 lg:p-6 bg-white border-t">
                  <div className="max-w-4xl lg:max-w-[100%] mx-auto space-y-3">
                    {/* Main Input Box */}
                    <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
                      {/* Plus/Expand Action */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 shrink-0 hover:text-[#E60076] hover:bg-[#FCE6F1] rounded-xl"
                      >
                        <div className="bg-[#E60076] rounded-lg p-1">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </div>
                      </Button>

                      {/* Hidden File Input Trigger (UI Only) */}
                      <label className="cursor-pointer p-2 text-slate-400 hover:text-[#E60076] transition-colors">
                        <Paperclip size={22} />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                        />
                      </label>

                      {/* Textarea for multi-line support */}
                      <textarea
                        rows={1}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none max-h-32 outline-none text-slate-700 placeholder:text-slate-400"
                        onInput={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = e.target.scrollHeight + "px";
                        }}
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 shrink-0 hover:text-[#E60076]"
                      >
                        <Smile size={22} />
                      </Button>

                      {/* Send Button with Brand Glow */}
                      <Button className="rounded-xl bg-[#E60076] hover:bg-[#c50065] h-11 w-11 p-0 shadow-lg shadow-[#E60076]/30 transition-all active:scale-95 shrink-0">
                        <Send size={20} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                </footer>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Send size={32} />
                </div>
                <p className="font-medium">
                  Select a conversation to start chatting
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Mock Data ---
const CONTACTS = [
  {
    id: 1,
    name: "Alicia Rochefort",
    lastMsg: "Hey Ronald, we have to attend our daily stand up...",
    time: "09:12",
    avatar: "https://i.pravatar.cc/150?u=alicia",
    unread: 1,
  },
  {
    id: 2,
    name: "Jessica Tan",
    lastMsg: "Sure, wait, I'll send you",
    time: "09:10",
    avatar: "https://i.pravatar.cc/150?u=jessica",
  },
  {
    id: 3,
    name: "Lolita Xue",
    lastMsg: "It's around 11:00, in the meeting room",
    time: "09:10",
    avatar: "https://i.pravatar.cc/150?u=lolita",
  },
];

const MOCK_MESSAGES = [
  {
    id: 1,
    sender: "them",
    text: "Hey Ronald, we have to attend our daily stand up",
    time: "09:10",
  },
  {
    id: 2,
    sender: "me",
    text: "Sure, when will daily stand up starts?",
    time: "09:12",
  },
  {
    id: 3,
    sender: "them",
    text: "It's around 11:00, in the meeting room",
    time: "09:13",
  },
  {
    id: 4,
    sender: "me",
    text: "Okay Alicia, I'll make sure to attend the daily stand up and make sure everything goes well.",
    time: "09:14",
  },
];
