"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, Send, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

const API_HEADERS = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  return {
    url: supabaseUrl,
    headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  };
};

export default function ChatModule() {
  const t = useTranslations("InfluencerChats");
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 1024);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { url, headers } = API_HEADERS();
      const res = await fetch(`${url}/functions/v1/chat`, {
        method: "POST", headers,
        body: JSON.stringify({ action: "listConversations", userId: user.id }),
      });
      const data = await res.json();
      if (data?.conversations) setConversations(data.conversations);
    } catch {} finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Fetch messages for selected chat
  const fetchMessages = useCallback(async () => {
    if (!selectedChat?.id || !user?.id) return;
    try {
      const { url, headers } = API_HEADERS();
      const res = await fetch(`${url}/functions/v1/chat`, {
        method: "POST", headers,
        body: JSON.stringify({ action: "getMessages", userId: user.id, conversationId: selectedChat.id }),
      });
      const data = await res.json();
      if (data?.messages) setMessages(data.messages);
    } catch {}
  }, [selectedChat?.id, user?.id]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      // Poll for new messages every 3s
      pollRef.current = setInterval(fetchMessages, 3000);
      return () => clearInterval(pollRef.current);
    }
  }, [selectedChat, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || sending || !selectedChat?.id) return;
    setSending(true);
    try {
      const { url, headers } = API_HEADERS();
      const res = await fetch(`${url}/functions/v1/chat`, {
        method: "POST", headers,
        body: JSON.stringify({ action: "sendMessage", userId: user.id, conversationId: selectedChat.id, content: newMessage }),
      });
      const data = await res.json();
      if (data?.success) {
        setNewMessage("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        await fetchMessages();
        fetchConversations(); // Update last message in sidebar
      }
    } catch {} finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffDay === 0) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    if (diffDay === 1) return t("time.yesterday");
    if (diffDay < 7) return d.toLocaleDateString("en-IN", { weekday: "short" });
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const formatMsgTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const filteredConversations = searchQuery
    ? conversations.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  return (
    <div className="flex h-screen w-full bg-[#F8F9FD] overflow-hidden font-sans lg:mt-20">
      {/* Sidebar */}
      <div className={`${isMobile && selectedChat ? "hidden" : "flex"} w-full lg:w-[400px] flex-col border-r bg-white`}>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 rounded-full bg-pink-50 hover:bg-pink-100 cursor-pointer transition-colors active:scale-90">
              <ChevronLeft className="w-5 h-5 text-[#E60076]" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">{t("title")}</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input className="pl-10 bg-slate-50 border-none rounded-xl h-11" placeholder={t("searchPlaceholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-24 lg:pb-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin text-purple-500" />
              <p className="text-xs font-bold text-slate-400">{t("loading")}</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-16">
              <Send size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400">{t("empty.noConversations")}</p>
              <p className="text-xs text-slate-300 mt-1">{t("empty.brandsHint")}</p>
            </div>
          ) : (
            filteredConversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedChat(c)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all mb-1 ${
                  selectedChat?.id === c.id ? "bg-pink-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                    <AvatarImage src={c.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-sm font-bold">
                      {c.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {c.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E60076] border-2 border-white text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                      {c.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold text-sm truncate ${selectedChat?.id === c.id ? "text-[#E60076]" : "text-slate-800"}`}>{c.name}</span>
                    <span className="text-[9px] text-slate-400 font-medium shrink-0 ml-2">{formatTime(c.lastMessageTime)}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${c.unread > 0 ? "text-slate-700 font-semibold" : "text-slate-400"}`}>
                    {c.isLastMessageMine ? t("youPrefix") : ""}{c.lastMessage || t("noMessagesYet")}
                  </p>
                </div>
              </div>
            ))
          )}
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
                <header className="bg-white p-3.5 lg:px-8 lg:py-4 flex items-center gap-3 border-b shadow-sm sticky top-0 z-10">
                  {isMobile && (
                    <button onClick={() => setSelectedChat(null)} className="p-2 rounded-full bg-pink-50 cursor-pointer">
                      <ChevronLeft className="w-5 h-5 text-[#E60076]" />
                    </button>
                  )}
                  <Avatar className="h-10 w-10 ring-2 ring-pink-50">
                    <AvatarImage src={selectedChat.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-sm font-bold">
                      {selectedChat.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{selectedChat.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{t("online")}</span>
                    </div>
                  </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-3 scrollbar-hide">
                  {messages.length === 0 && (
                    <div className="text-center py-16">
                      <p className="text-sm text-slate-400">{t("emptyThread")}</p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div key={msg.message_id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] lg:max-w-[65%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? "bg-[#E60076] text-white rounded-tr-sm"
                            : "bg-white text-slate-700 rounded-tl-sm border border-slate-100 shadow-sm"
                        }`}>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <span className={`text-[8px] mt-1 block font-medium ${isMine ? "text-white/60 text-right" : "text-slate-400"}`}>
                            {formatMsgTime(msg.sent_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <footer className="p-3 lg:p-4 bg-white border-t">
                  <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t("inputPlaceholder")}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 resize-none max-h-28 outline-none text-slate-700 placeholder:text-slate-400"
                      onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sending}
                      className="rounded-xl bg-[#E60076] hover:bg-[#c50065] h-10 w-10 flex items-center justify-center shadow-lg shadow-pink-200 transition-all active:scale-95 shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {sending ? <Loader2 size={18} className="text-white animate-spin" /> : <Send size={18} className="text-white ml-0.5" />}
                    </button>
                  </div>
                </footer>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Send size={32} />
                </div>
                <p className="font-medium">{t("selectPrompt")}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
