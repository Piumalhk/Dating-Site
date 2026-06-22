"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import {
  watchMessages,
  sendMessage,
  markMessagesAsRead,
} from "@/services/chatService";
import type { ChatDocument, MessageDocument } from "@/types/chat";
import type { UserProfile } from "@/types/users";

interface ChatWindowProps {
  chatId: string;
  chat: ChatDocument;
}

export default function ChatWindow({ chatId, chat }: ChatWindowProps) {
  const [currentUserId,   setCurrentUserId]   = useState<string | null>(null);
  const [partner,         setPartner]         = useState<UserProfile | null>(null);
  const [messages,        setMessages]        = useState<MessageDocument[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef      = useRef<HTMLDivElement>(null);
  const scrollContainerRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUserId(user?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const partnerId = chat.users.find((uid) => uid !== currentUserId);
    if (!partnerId) return;
    const unsub = onSnapshot(doc(db, "users", partnerId), (snap) => {
      if (snap.exists()) setPartner({ uid: partnerId, ...snap.data() } as UserProfile);
    });
    return () => unsub();
  }, [currentUserId, chat.users]);

  useEffect(() => {
    const unsub = watchMessages(chatId, (msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    const id = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);
    return () => clearTimeout(id);
  }, [messages.length]);

  useEffect(() => {
    if (!currentUserId || messages.length === 0) return;
    markMessagesAsRead(chatId, currentUserId).catch(console.error);
  }, [chatId, currentUserId, messages.length]);

  const handleSend = async (text: string) => {
    if (!currentUserId) return;
    await sendMessage(chatId, currentUserId, text, chat.users);
  };

  const onlineLabel = () => {
    if (!partner) return "";
    if (partner.isOnline) return "Online";
    if (partner.lastSeen) {
      return `Last seen ${formatDistanceToNow(partner.lastSeen.toDate(), { addSuffix: true })}`;
    }
    return "Offline";
  };

  const avatarSrc =
    partner?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${partner?.firstName ?? "U"} ${partner?.lastName ?? ""}`
    )}&background=f9a8d4&color=9d174d&size=80`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="h-16 border-b border-gray-100 bg-white flex items-center px-4 gap-3 shrink-0 shadow-sm z-10">
        <Link
          href="/chat"
          className="text-gray-400 hover:text-pink-600 transition p-1.5 -ml-1 rounded-xl hover:bg-pink-50"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={20} />
        </Link>

        {partner ? (
          <>
            <Link href={`/profile/${partner.uid}`} className="relative shrink-0">
              <Image
                src={avatarSrc}
                alt={partner.firstName}
                width={40}
                height={40}
                className="rounded-full object-cover border-2 border-pink-100"
                unoptimized
              />
              {partner.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
              )}
            </Link>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate leading-tight">
                {partner.firstName} {partner.lastName}
              </p>
              <p className={`text-xs truncate leading-tight ${partner.isOnline ? "text-green-500 font-medium" : "text-gray-400"}`}>
                {partner.isOnline && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1 align-middle" />}
                {onlineLabel()}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 ml-auto">
              <button className="p-2 rounded-xl text-gray-400 hover:text-pink-600 hover:bg-pink-50 transition" aria-label="Voice call">
                <Phone size={18} />
              </button>
              <button className="p-2 rounded-xl text-gray-400 hover:text-pink-600 hover:bg-pink-50 transition" aria-label="Video call">
                <Video size={18} />
              </button>
              <button className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition" aria-label="More options">
                <MoreVertical size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
            <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
          </div>
        )}
      </div>

      {/* ── Messages area ─────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-5 space-y-0.5"
        style={{ background: "linear-gradient(180deg, #fdf2f8 0%, #f9fafb 100%)" }}
      >
        {loadingMessages ? (
          <div className="space-y-3 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="h-9 bg-gray-200 rounded-2xl animate-pulse"
                  style={{ width: `${40 + (i * 7) % 30}%` }}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center">
              <span className="text-3xl">👋</span>
            </div>
            <p className="text-sm font-medium text-center">
              Say hello to {partner?.firstName ?? "your match"}!<br />
              <span className="text-xs text-gray-300">Start your conversation below</span>
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUserId}
              />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ─────────────────────────────────────────────────────── */}
      <MessageInput onSend={handleSend} disabled={!currentUserId} />
    </div>
  );
}
