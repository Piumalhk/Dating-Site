"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import type { ChatDocument } from "@/types/chat";

export default function ChatRoomPage() {
  const params = useParams();
  const chatId = params.chatId as string;

  const [chat, setChat] = useState<ChatDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!chatId) return;

    getDoc(doc(db, "chats", chatId))
      .then((snap) => {
        if (snap.exists()) {
          setChat({ id: snap.id, ...snap.data() } as ChatDocument);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [chatId]);

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <ProtectedRoute>
      {/*
        h-screen + overflow-hidden: locks total height to viewport.
        ChatWindow uses flex-col + flex-1 to fill the remaining vertical space.
      */}
      <div className="flex h-screen overflow-hidden bg-gray-100">
        {/* Sidebar hidden on small screens — Chat is full-width on mobile */}
        <div className="hidden md:flex shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center flex-1 text-gray-400 animate-pulse">
          Loading…
        </div>
      </Shell>
    );
  }

  if (notFound || !chat) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-gray-500">
          <p className="text-5xl">💬</p>
          <p className="text-lg font-medium">Conversation not found</p>
          <Link
            href="/chat"
            className="text-pink-500 hover:text-pink-700 hover:underline text-sm"
          >
            Back to Messages
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <ChatWindow chatId={chatId} chat={chat} />
    </Shell>
  );
}
