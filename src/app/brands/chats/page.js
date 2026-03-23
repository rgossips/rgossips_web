"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronLeft,
  MoreVertical,
  Send,
  Mic,
  ThumbsUp,
  Play,
  Pause,
  ArrowRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function ChatModule() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [playingAudio, setPlayingAudio] = useState(null);

  React.useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 1024);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const tabs = ["All", "Unread", "Pinned", "Campaigns"];

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden font-sans">
      {/* Full-width Purple Gradient Header */}
      <section className="w-full bg-linear-to-b from-[#4C75BE] to-[#4A3996] px-6 lg:px-10 pt-8 lg:pt-10 pb-10 lg:pb-14 mb-4 rounded-b-[40px] text-white relative z-10">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-white/70 text-xs mt-1">6 Running Projects</p>
          </div>
        </div>

        {/* Search Bar - positioned to overlap bottom edge */}
        <div className="absolute left-6 right-6 lg:left-10 lg:right-10 -bottom-6 flex items-center bg-white rounded-full p-2 shadow-lg shadow-gray-200/50">
          <input
            type="text"
            placeholder="Search or start a new chat"
            className="w-full pl-4 text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
          <button className="bg-[#5851DB] hover:bg-[#4338CA] p-2.5 rounded-full text-white shrink-0 transition-colors">
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Main Content - Sidebar + Chat */}
      <div className="flex flex-1 mt-8 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${isMobile && selectedChat ? "hidden" : "flex"} w-full lg:w-[420px] flex-col border-r bg-white`}
        >
          {/* Filter Tabs */}
          <div className="flex items-center gap-3 px-5 py-4 border-b">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/25"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {CONTACTS.map((contact) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={contact.id}
                onClick={() => setSelectedChat(contact)}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all mb-1 ${
                  selectedChat?.id === contact.id
                    ? "bg-[#F3F1FF]"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{contact.name[0]}</AvatarFallback>
                  </Avatar>
                  {contact.unread && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#4F46E5] border-2 border-white text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {contact.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-slate-800">
                      {contact.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {contact.time}
                    </span>
                  </div>
                  <span
                    className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mt-1 ${contact.tagColor}`}
                  >
                    {contact.campaign}
                  </span>
                  <p className="text-xs text-slate-500 truncate mt-1">
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
                  {/* Chat Header */}
                  <header className="bg-white px-6 py-4 flex items-center justify-between border-b shadow-sm sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                      {isMobile && (
                        <button
                          onClick={() => setSelectedChat(null)}
                          className="p-2 rounded-full bg-[#EAE7FF]"
                        >
                          <ChevronLeft className="w-5 h-5 text-[#4F46E5]" />
                        </button>
                      )}
                      <Avatar className="h-10 w-10 ring-2 ring-[#EAE7FF]">
                        <AvatarImage src={selectedChat.avatar} />
                        <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">
                          {selectedChat.name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          <span className="text-slate-500">★</span> Regarding:{" "}
                          <span className="font-medium text-slate-600">
                            {selectedChat.campaign}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 rounded-full hover:text-[#4F46E5] hover:bg-[#F3F1FF]"
                      >
                        <Search size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 rounded-full hover:text-[#4F46E5] hover:bg-[#F3F1FF]"
                      >
                        <MoreVertical size={18} />
                      </Button>
                    </div>
                  </header>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 lg:px-10 lg:py-8 space-y-5 scrollbar-hide">
                    {MOCK_MESSAGES.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] lg:max-w-[60%] ${
                            msg.type === "audio" ? "w-[320px]" : ""
                          }`}
                        >
                          {msg.type === "audio" ? (
                            <div
                              className={`p-3.5 rounded-2xl shadow-sm flex items-center gap-3 ${
                                msg.sender === "me"
                                  ? "bg-[#4F46E5] rounded-tr-sm"
                                  : "bg-white border border-slate-100 rounded-tl-sm"
                              }`}
                            >
                              <button
                                onClick={() =>
                                  setPlayingAudio(
                                    playingAudio === msg.id ? null : msg.id,
                                  )
                                }
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                  msg.sender === "me"
                                    ? "bg-white/20"
                                    : "bg-[#F3F1FF]"
                                }`}
                              >
                                {playingAudio === msg.id ? (
                                  <Pause
                                    size={16}
                                    className={
                                      msg.sender === "me"
                                        ? "text-white"
                                        : "text-[#4F46E5]"
                                    }
                                  />
                                ) : (
                                  <Play
                                    size={16}
                                    className={`ml-0.5 ${msg.sender === "me" ? "text-white" : "text-[#4F46E5]"}`}
                                  />
                                )}
                              </button>
                              <div className="flex-1">
                                <div
                                  className={`flex items-center gap-[3px] h-6 ${msg.sender === "me" ? "opacity-80" : "opacity-50"}`}
                                >
                                  {Array.from({ length: 30 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-[3px] rounded-full ${msg.sender === "me" ? "bg-white" : "bg-slate-400"}`}
                                      style={{
                                        height: `${Math.random() * 16 + 4}px`,
                                      }}
                                    />
                                  ))}
                                </div>
                                <span
                                  className={`text-[10px] mt-1 block ${msg.sender === "me" ? "text-white/60" : "text-slate-400"}`}
                                >
                                  {msg.duration}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`p-4 rounded-2xl shadow-sm text-sm ${
                                msg.sender === "me"
                                  ? "bg-[#4F46E5] text-white rounded-tr-sm"
                                  : "bg-white text-slate-700 rounded-tl-sm border border-slate-100"
                              }`}
                            >
                              <p className="leading-relaxed">{msg.text}</p>
                            </div>
                          )}
                          <span
                            className={`text-[10px] mt-1.5 block text-slate-400 ${msg.sender === "me" ? "text-right" : ""}`}
                          >
                            {msg.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer Input */}
                  <footer className="p-4 lg:px-8 lg:py-5 bg-white border-t">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 flex items-end gap-2 bg-[#F8F9FD] p-2.5 rounded-2xl border border-slate-100">
                        <textarea
                          rows={1}
                          placeholder="Type a message..."
                          className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1.5 resize-none max-h-32 outline-none text-slate-700 placeholder:text-slate-400"
                          onInput={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height =
                              e.target.scrollHeight + "px";
                          }}
                        />
                      </div>
                      <button className="h-11 w-11 rounded-full bg-[#F3F1FF] hover:bg-[#EAE7FF] flex items-center justify-center transition-colors text-[#4F46E5] shrink-0">
                        <Mic size={20} />
                      </button>
                      <button className="h-11 w-11 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] flex items-center justify-center transition-all shadow-lg shadow-[#4F46E5]/30 active:scale-95 shrink-0">
                        <Send size={18} className="text-white ml-0.5" />
                      </button>
                      <button className="h-11 w-11 rounded-full bg-[#F3F1FF] hover:bg-[#EAE7FF] flex items-center justify-center transition-colors text-[#4F46E5] shrink-0">
                        <ThumbsUp size={20} />
                      </button>
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
    </div>
  );
}

// --- Mock Data ---
const CONTACTS = [
  {
    id: 1,
    name: "Faisal Shaikh",
    campaign: "Food Campaign",
    tagColor: "bg-[#EAE7FF] text-[#4F46E5]",
    lastMsg: "Hey, I can do this in 2 days",
    time: "3:45 PM",
    avatar: "https://i.pravatar.cc/150?u=faisal",
    unread: 1,
  },
  {
    id: 2,
    name: "Sarah Rahman",
    campaign: "Skincare Launch",
    tagColor: "bg-[#FCE6F1] text-[#C5006A]",
    lastMsg: "Let me check the brief again.",
    time: "1:16 PM",
    avatar: "https://i.pravatar.cc/150?u=sarah",
  },
  {
    id: 3,
    name: "Arjun Mehta",
    campaign: "Tech Review",
    tagColor: "bg-[#E0F7EC] text-[#0D7C4A]",
    lastMsg: "I'll send the draft by tonight",
    time: "12:30 PM",
    avatar: "https://i.pravatar.cc/150?u=arjun",
  },
  {
    id: 4,
    name: "Priya Nair",
    campaign: "Fashion Week",
    tagColor: "bg-[#FFF3E0] text-[#E65100]",
    lastMsg: "Can we reschedule the shoot?",
    time: "11:45 AM",
    avatar: "https://i.pravatar.cc/150?u=priya",
  },
  {
    id: 5,
    name: "Ravi Kumar",
    campaign: "Fitness Brand",
    tagColor: "bg-[#E3F2FD] text-[#1565C0]",
    lastMsg: "The content is ready for review",
    time: "10:20 AM",
    avatar: "https://i.pravatar.cc/150?u=ravi",
  },
  {
    id: 6,
    name: "Meera Joshi",
    campaign: "Travel Vlog",
    tagColor: "bg-[#F3E5F5] text-[#7B1FA2]",
    lastMsg: "Uploaded the final cut!",
    time: "Yesterday",
    avatar: "https://i.pravatar.cc/150?u=meera",
  },
];

const MOCK_MESSAGES = [
  {
    id: 1,
    sender: "them",
    text: "Oh, hello! All perfectly, I will check it and get back to you soon",
    time: "04:45 PM",
  },
  {
    id: 2,
    sender: "me",
    text: "Oh, hello! All perfectly, I will check it and get back to you soon",
    time: "04:01 PM",
  },
  {
    id: 3,
    sender: "them",
    text: "Oh, hello! All perfectly, I will check it and get back to you soon",
    time: "04:33 PM",
  },
  {
    id: 4,
    sender: "them",
    type: "audio",
    duration: "01:24",
    time: "04:33 PM",
  },
  {
    id: 5,
    sender: "me",
    text: "Oh, hello! All perfectly, I will check it and get back to you soon",
    time: "04:45 PM",
  },
];
