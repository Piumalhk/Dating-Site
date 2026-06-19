"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  ThumbsUp as Like,
  MessageCircle,
  User,
  Settings,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { watchTotalUnreadCount } from "@/services/chatService";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Matches",   href: "/matches",   icon: Heart },
  { label: "Likes",     href: "/likes",     icon: Like },
  { label: "Messages",  href: "/chat",      icon: MessageCircle },
  { label: "Profile",   href: "/profile",   icon: User },
  { label: "Settings",  href: "/profile/edit", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let unsubMessages: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubMessages?.();
      if (!user) return;

      unsubMessages = watchTotalUnreadCount(user.uid, (count) => {
        setUnreadCount(count);
      });
    });

    return () => {
      unsubAuth();
      unsubMessages?.();
    };
  }, []);

  return (
    <aside className="w-64 bg-white border-r min-h-screen shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-50">
        <h2 className="text-2xl font-bold text-pink-600">DatingHub</h2>
      </div>

      {/* Nav */}
      <nav className="px-4 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          const showBadge = item.href === "/chat" && unreadCount > 0;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-xl mb-1 transition-colors
                ${
                  isActive
                    ? "bg-pink-50 text-pink-600 font-semibold"
                    : "text-gray-600 hover:bg-pink-50 hover:text-pink-600"
                }`}
            >
              <Icon size={20} className="shrink-0" />
              <span className="flex-1">{item.label}</span>

              {/* Unread message badge */}
              {showBadge && (
                <span className="bg-pink-500 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
