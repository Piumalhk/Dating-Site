"use client";

import { Bell, User, LogOut, Settings} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function Topbar() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ FIX 1: Proper auth listener (NOT auth.currentUser)
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ✅ FIX 2: Proper logout handling
  const handleLogout = async () => {
    try {
      await signOut(auth);

      setUserData(null);
      setOpen(false);

      // IMPORTANT: force full reset navigation
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="bg-white border-b h-16 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="flex items-center gap-5">
        {/* Notification */}
        <Link href="/home">
        <button className="text-black border border-white px-4 py-2 rounded-full  hover:text-pink-600 transition"
      >
        ← Back to Home
  
        </button></Link>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2"
          >
            <Image
              src={
                userData?.profileImage ||
                "https://ui-avatars.com/api/?name=User"
              }
              alt="Profile"
              width={40}
              height={40}
              className="rounded-full object-cover border"
            />
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border overflow-hidden z-50">
              {/* User Info */}
              <div className="p-4 border-b">
                <p className="font-semibold">
                  {userData?.firstName} {userData?.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {userData?.email}
                </p>
              </div>

              {/* Profile */}
              <button
                onClick={() => router.push("/profile")}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50"
              >
                <User size={18} />
                View Profile
              </button>

              {/* Edit */}
              <button
                onClick={() => router.push("/profile/edit")}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50"
              >
                <Settings size={18} />
                Edit Profile
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}