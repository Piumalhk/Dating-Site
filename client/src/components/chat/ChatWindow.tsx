"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<MessageDocument[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Auth ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  // ── Partner profile (real-time for online status) ─────────────────────────
  useEffect(() => {
    if (!currentUserId) return;

    const partnerId = chat.users.find((uid) => uid !== currentUserId);
    if (!partnerId) return;

    const unsub = onSnapshot(doc(db, "users", partnerId), (snap) => {
      if (snap.exists()) {
        setPartner({ uid: partnerId, ...snap.data() } as UserProfile);
      }
    });
    return () => unsub();
  }, [currentUserId, chat.users]);

  // ── Messages ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = watchMessages(chatId, (msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
    });
    return () => unsub();
  }, [chatId]);

  // ── Auto-scroll to bottom when messages change ────────────────────────────
  useEffect(() => {
    // Small delay lets the DOM paint first
    const id = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);
    return () => clearTimeout(id);
  }, [messages.length]);

  // ── Mark incoming messages as read when chat is open ─────────────────────
  useEffect(() => {
    if (!currentUserId || messages.length === 0) return;
    markMessagesAsRead(chatId, currentUserId).catch(console.error);
  }, [chatId, currentUserId, messages.length]);

  // ── Send handler ──────────────────────────────────────────────────────────
  const handleSend = async (text: string) => {
    if (!currentUserId) return;
    await sendMessage(chatId, currentUserId, text, chat.users);
  };

  // ── Online status label ───────────────────────────────────────────────────
  const onlineLabel = () => {
    if (!partner) return null;
    if (partner.isOnline) return "🟢 Online";
    if (partner.lastSeen) {
      return `Last seen ${formatDistanceToNow(partner.lastSeen.toDate(), {
        addSuffix: true,
      })}`;
    }
    return "Offline";
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Chat header ────────────────────────────────────────────────────── */}
      <div className="h-16 border-b border-gray-100 bg-white flex items-center px-4 gap-3 shrink-0 shadow-sm z-10">
        <Link
          href="/chat"
          className="text-gray-400 hover:text-gray-600 transition p-1 -ml-1 rounded-full hover:bg-gray-100"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={20} />
        </Link>

        {partner ? (
          <>
            <div className="relative shrink-0">
              <Image
                src={
                  partner.profileImage ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    `${partner.firstName} ${partner.lastName ?? ""}`
                  )}&background=f9a8d4&color=9d174d&size=80`
                }
                alt={partner.firstName}
                width={40}
                height={40}
                className="rounded-full object-cover"
                unoptimized
              />
              {partner.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
              )}
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {partner.firstName} {partner.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{onlineLabel()}</p>
            </div>

            {/* View Profile shortcut */}
            <Link
              href={`/profile/${partner.uid}`}
              className="ml-auto text-xs text-pink-500 hover:text-pink-700 hover:underline shrink-0"
            >
              View Profile
            </Link>
          </>
        ) : (
          /* Loading skeleton for header */
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse shrink-0" />
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
        )}
      </div>

      {/* ── Messages area ────────────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 space-y-0.5"
      >
        {loadingMessages ? (
          /* Loading skeletons */
          <div className="space-y-3 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="h-9 bg-gray-200 rounded-2xl animate-pulse"
                  style={{ width: `${40 + Math.random() * 30}%` }}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-gray-400">
            <span className="text-5xl">👋</span>
            <p className="text-sm font-medium">
              Say hello to {partner?.firstName ?? "your match"}!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUserId}
            />
          ))
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ────────────────────────────────────────────────────────────── */}
      <MessageInput onSend={handleSend} disabled={!currentUserId} />
    </div>
  );
}
