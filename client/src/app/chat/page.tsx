"use client";

import ProtectedRoute from "@/features/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import ChatList from "@/components/chat/ChatList";
import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Topbar />
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-12">
            {/* Page header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <MessageCircle size={17} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              </div>
              <p className="text-gray-400 text-sm ml-12">Your conversations with matches</p>
            </div>

            {/* Chat list card */}
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
              <ChatList />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
