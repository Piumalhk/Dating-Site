"use client";

import { User, LogOut, Settings, Bell, MessageCircle, Heart, Menu, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { setUserOnlineStatus } from "@/services/chatService";
import { watchTotalUnreadCount } from "@/services/chatService";
import { useSidebarStore } from "@/store/useSidebarStore";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard":    "Discover",
  "/matches":      "Your Matches",
  "/likes":        "People Who Like You",
  "/chat":         "Messages",
  "/profile":      "My Profile",
  "/profile/edit": "Edit Profile",
  "/profile/setup":"Profile Setup",
};

function getPageTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.startsWith("/chat/")) return "Conversation";
  if (pathname.startsWith("/profile/")) return "Profile";
  return "DatingHub";
}

export default function Topbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { toggle } = useSidebarStore();

  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [userData,      setUserData]      = useState<any>(null);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef    = useRef<HTMLDivElement>(null);

  // Fetch user data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setUserData(null); return; }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setUserData(snap.data());
      } catch {}
    });
    return () => unsub();
  }, []);

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) await setUserOnlineStatus(currentUser.uid, false).catch(() => {});
    await signOut(auth);
    window.location.href = "/auth/login";
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-30 shadow-sm">
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-pink-50 hover:text-pink-600 transition"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 hidden sm:block">{pageTitle}</h1>
      </div>

      {/* Right: notifications + avatar */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((o) => !o); setDropdownOpen(false); }}
            className="relative p-2 rounded-xl text-gray-500 hover:bg-pink-50 hover:text-pink-600 transition"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-pink-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-scale-in">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <p className="font-semibold text-gray-800 text-sm">Notifications</p>
                {unreadCount > 0 && (
                  <span className="text-xs text-pink-500 font-medium">{unreadCount} new</span>
                )}
              </div>

              {unreadCount > 0 ? (
                <div className="p-3 space-y-1">
                  <Link
                    href="/chat"
                    onClick={() => setNotifOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-pink-50 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                      <MessageCircle size={15} className="text-pink-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-gray-400">Tap to view your chats</p>
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-2xl mb-2">🔔</p>
                  <p className="text-sm text-gray-400">You&apos;re all caught up!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen((o) => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 transition"
            aria-label="User menu"
          >
            <div className="relative">
              <Image
                src={
                  userData?.profileImage ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    `${userData?.firstName || "U"} ${userData?.lastName || ""}`
                  )}&background=f9a8d4&color=9d174d`
                }
                alt="Profile"
                width={36}
                height={36}
                className="rounded-full object-cover border-2 border-pink-100"
                unoptimized
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-25 truncate">
              {userData?.firstName || "You"}
            </span>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-scale-in">
              {/* User info header */}
              <div className="px-4 py-3.5 border-b border-gray-50 bg-linear-to-r from-pink-50 to-purple-50">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {userData?.firstName} {userData?.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{userData?.email}</p>
              </div>

              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => { router.push("/profile"); setDropdownOpen(false); }}
                  className="w-full px-3 py-2.5 flex items-center gap-3 rounded-xl hover:bg-pink-50 text-gray-700 hover:text-pink-600 text-sm transition"
                >
                  <User size={15} className="shrink-0" /> View Profile
                </button>

                <button
                  onClick={() => { router.push("/matches"); setDropdownOpen(false); }}
                  className="w-full px-3 py-2.5 flex items-center gap-3 rounded-xl hover:bg-pink-50 text-gray-700 hover:text-pink-600 text-sm transition"
                >
                  <Heart size={15} className="shrink-0" /> Matches
                </button>

                <button
                  onClick={() => { router.push("/chat"); setDropdownOpen(false); }}
                  className="w-full px-3 py-2.5 flex items-center gap-3 rounded-xl hover:bg-pink-50 text-gray-700 hover:text-pink-600 text-sm transition"
                >
                  <MessageCircle size={15} className="shrink-0" /> Messages
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-pink-500 text-white text-[10px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { router.push("/profile/edit"); setDropdownOpen(false); }}
                  className="w-full px-3 py-2.5 flex items-center gap-3 rounded-xl hover:bg-pink-50 text-gray-700 hover:text-pink-600 text-sm transition"
                >
                  <Settings size={15} className="shrink-0" /> Settings
                </button>

                <div className="my-1 border-t border-gray-100" />

                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2.5 flex items-center gap-3 rounded-xl hover:bg-red-50 text-red-500 text-sm transition"
                >
                  <LogOut size={15} className="shrink-0" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
