"use client";

import { User, LogOut, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { setUserOnlineStatus } from "@/services/chatService";

export default function Topbar() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user data when auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserData(null);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    });

    return () => unsub();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      // Mark offline BEFORE signing out (user is still authenticated here)
      const currentUser = auth.currentUser;
      if (currentUser) {
        await setUserOnlineStatus(currentUser.uid, false);
      }

      await signOut(auth);
      setUserData(null);
      setOpen(false);

      // Hard redirect to clear all client state
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="bg-white border-b h-16 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>

      <div className="flex items-center gap-5">
        {/* Back to public home */}
        <Link href="/home">
          <button className="text-gray-600 border border-gray-200 px-4 py-1.5 rounded-full text-sm hover:text-pink-600 hover:border-pink-200 transition">
            ← Back to Home
          </button>
        </Link>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2"
            aria-label="User menu"
          >
            <Image
              src={
                userData?.profileImage ||
                "https://ui-avatars.com/api/?name=User&background=f9a8d4&color=9d174d"
              }
              alt="Profile"
              width={40}
              height={40}
              className="rounded-full object-cover border-2 border-gray-100"
              unoptimized
            />
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              {/* User info */}
              <div className="p-4 border-b border-gray-50">
                <p className="font-semibold text-gray-900">
                  {userData?.firstName} {userData?.lastName}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {userData?.email}
                </p>
              </div>

              <button
                onClick={() => { router.push("/profile"); setOpen(false); }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-gray-700 text-sm"
              >
                <User size={16} />
                View Profile
              </button>

              <button
                onClick={() => { router.push("/profile/edit"); setOpen(false); }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-gray-700 text-sm"
              >
                <Settings size={16} />
                Edit Profile
              </button>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50 text-sm"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
