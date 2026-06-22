"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  ThumbsUp,
  MessageCircle,
  User,
  Settings,
  LogOut,
  X,
  Sparkles,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { setUserOnlineStatus } from "@/services/chatService";
import { watchTotalUnreadCount } from "@/services/chatService";
import { useSidebarStore } from "@/store/useSidebarStore";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard",    icon: LayoutDashboard },
  { label: "Discover",  href: "/dashboard",    icon: Sparkles },
  { label: "Matches",   href: "/matches",      icon: Heart },
  { label: "Likes",     href: "/likes",        icon: ThumbsUp },
  { label: "Messages",  href: "/chat",         icon: MessageCircle },
  { label: "Profile",   href: "/profile",      icon: User },
  { label: "Settings",  href: "/profile/edit", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();
  const [unreadCount, setUnreadCount] = useState(0);

  // Real-time unread count
  useEffect(() => {
    let unsubMessages: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubMessages?.();
      if (!user) return;
      unsubMessages = watchTotalUnreadCount(user.uid, setUnreadCount);
    });
    return () => { unsubAuth(); unsubMessages?.(); };
  }, []);

  // Close sidebar when route changes (mobile)
  useEffect(() => { close(); }, [pathname, close]);

  const handleLogout = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) await setUserOnlineStatus(currentUser.uid, false).catch(() => {});
    await signOut(auth);
    window.location.href = "/auth/login";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <Heart size={18} className="text-white fill-white" />
          </div>
          <span className="text-xl font-bold text-gradient-brand">DatingHub</span>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={close}
          className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          Navigation
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.label === "Dashboard"
              ? pathname === "/dashboard"
              : item.label === "Discover"
              ? false
              : item.href === "/dashboard"
              ? false
              : pathname.startsWith(item.href);

          const showBadge = item.href === "/chat" && unreadCount > 0;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${
                  isActive
                    ? "bg-linear-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-200"
                    : "text-gray-600 hover:bg-pink-50 hover:text-pink-600"
                }`}
            >
              <Icon
                size={18}
                className={`shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? "text-white" : ""
                }`}
              />
              <span className="flex-1">{item.label}</span>

              {showBadge && (
                <span
                  className={`text-[10px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1 ${
                    isActive
                      ? "bg-white text-pink-600"
                      : "bg-pink-500 text-white"
                  }`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Logout */}
      <div className="px-3 pb-6 border-t border-gray-100 pt-4">
        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all duration-150"
        >
          <LogOut size={18} className="shrink-0 transition-transform group-hover:scale-110" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 min-h-screen shrink-0 flex-col shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out md:hidden flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Mobile navigation"
      >
        <SidebarContent />
      </aside>
    </>
  );
}
