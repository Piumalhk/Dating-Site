"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { watchUserChats } from "@/services/chatService";
import type { ChatDocument } from "@/types/chat";
import type { UserProfile } from "@/types/users";

interface EnrichedChat {
  chat: ChatDocument;
  partner: UserProfile;
  unreadCount: number;
}

export default function ChatList() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [chats, setChats] = useState<EnrichedChat[]>([]);
  const [partnerProfiles, setPartnerProfiles] = useState<
    Record<string, UserProfile>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Auth ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  // ── Watch user's chats ──────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;

    const unsub = watchUserChats(currentUserId, (chatDocs) => {
      // Compute unread counts immediately (no async needed)
      const enriched = chatDocs.map((chat) => ({
        chat,
        // Partner profile will be filled by the partner-listener effect
        partner: partnerProfiles[
          chat.users.find((u) => u !== currentUserId)!
        ] ?? ({ firstName: "…" } as UserProfile),
        unreadCount: chat.unreadCounts?.[currentUserId] ?? 0,
      }));
      setChats(enriched);
      setLoading(false);
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // ── Real-time partner profile listeners (online status etc.) ────────────
  useEffect(() => {
    if (!currentUserId || chats.length === 0) return;

    const partnerIds = [
      ...new Set(
        chats.map((c) => c.chat.users.find((u) => u !== currentUserId)!)
      ),
    ];

    const unsubs = partnerIds.map((pid) =>
      onSnapshot(doc(db, "users", pid), (snap) => {
        if (snap.exists()) {
          setPartnerProfiles((prev) => ({
            ...prev,
            [pid]: { uid: pid, ...snap.data() } as UserProfile,
          }));
        }
      })
    );

    return () => unsubs.forEach((u) => u());
  }, [currentUserId, chats.length]);

  // Merge latest partner profiles into chats
  const enrichedChats: EnrichedChat[] = chats.map((entry) => {
    const partnerId = entry.chat.users.find((u) => u !== currentUserId)!;
    return {
      ...entry,
      partner: partnerProfiles[partnerId] ?? entry.partner,
    };
  });

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center text-red-500 px-4">{error}</div>
    );
  }

  if (enrichedChats.length === 0) {
    return (
      <div className="py-20 text-center px-4">
        <p className="text-5xl mb-4">💬</p>
        <h2 className="text-xl font-semibold text-gray-700">
          No conversations yet
        </h2>
        <p className="text-gray-400 text-sm mt-2">
          Match with someone to start chatting!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {enrichedChats.map(({ chat, partner, unreadCount }) => {
        const hasUnread = unreadCount > 0;
        const lastTime = chat.lastMessageAt?.toDate
          ? formatDistanceToNow(chat.lastMessageAt.toDate(), {
              addSuffix: true,
            })
          : chat.createdAt?.toDate
          ? formatDistanceToNow(chat.createdAt.toDate(), { addSuffix: true })
          : "";

        return (
          <Link key={chat.id} href={`/chat/${chat.id}`}>
            <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition cursor-pointer">
              {/* Avatar + online dot */}
              <div className="relative shrink-0">
                <Image
                  src={
                    partner.profileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${partner.firstName} ${partner.lastName ?? ""}`
                    )}&background=f9a8d4&color=9d174d&size=80`
                  }
                  alt={partner.firstName ?? "User"}
                  width={52}
                  height={52}
                  className="rounded-full object-cover"
                  unoptimized
                />
                {partner.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
                )}
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`font-semibold truncate ${
                      hasUnread ? "text-gray-900" : "text-gray-700"
                    }`}
                  >
                    {partner.firstName} {partner.lastName}
                  </p>
                  <span className="text-xs text-gray-400 shrink-0">
                    {lastTime}
                  </span>
                </div>
                <p
                  className={`text-sm truncate mt-0.5 ${
                    hasUnread
                      ? "font-medium text-gray-800"
                      : "text-gray-500"
                  }`}
                >
                  {chat.lastMessage ?? "Start a conversation…"}
                </p>
              </div>

              {/* Unread badge */}
              {hasUnread && (
                <span className="bg-pink-500 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shrink-0">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
