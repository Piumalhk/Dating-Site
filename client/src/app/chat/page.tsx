"use client";

import ProtectedRoute from "@/features/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import ChatList from "@/components/chat/ChatList";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <Topbar />

          <div className="max-w-2xl mx-auto p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-500 mt-1 text-sm">
                Your conversations with matches
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow overflow-hidden">
              <ChatList />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
