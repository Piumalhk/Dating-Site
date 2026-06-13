"use client";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import StatCard from "@/components/dashboard/StatCard";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { db, auth } from "@/lib/firebase/config";
import Image from "next/image";
import Link from "next/link";

interface Profile {
  uid: string;
  firstName: string;
  lastName: string;
  interestedIn: string;
  gender: string;
  dob?: string;
  city?: string;
  profileImage?: string;
}

export default function DashboardPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const calculateAge = (dob?: string) => {
    if (!dob) return "N/A";

    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoadingProfiles(false);
        return;
      }

      try {
        const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));

        if (!currentUserDoc.exists()) {
          setLoadingProfiles(false);
          return;
        }

        const currentUserData = currentUserDoc.data();

        const q = query(
          collection(db, "users"),
          where("profileCompleted", "==", true),
          where("gender", "==", currentUserData.interestedIn),
          limit(20),
        );

        const snapshot = await getDocs(q);

        const users = snapshot.docs
          .map((doc) => ({
            uid: doc.id,
            ...doc.data(),
          }))
          .filter((user: any) => user.uid !== currentUser.uid)
          .filter(
            (user: any) => user.interestedIn === currentUserData.gender,
          ) as Profile[];

        setProfiles(users);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingProfiles(false);
      }
    });

    return () => unsubscribe();
  }, []);
  return (
    <ProtectedRoute>
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar />

        <div className="flex-1">
          <Topbar />

          <div className="p-6">
            {/* Welcome */}

            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-3xl p-8 mb-6">
              <h2 className="text-3xl font-bold">Welcome Back ❤️</h2>

              <p className="mt-2">Find your perfect match today.</p>
            </div>

            {/* Stats */}

            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <StatCard title="Matches" value="12" />

              <StatCard title="Messages" value="45" />

              <StatCard title="Likes" value="28" />

              <StatCard title="Profile Views" value="310" />
            </div>

            {/* Suggested Profiles */}
            <div className="bg-white rounded-3xl p-6 shadow">
              <h2 className="text-2xl font-bold mb-6">Suggested Profiles</h2>

              {loadingProfiles ? (
                <div className="text-center py-10">Loading profiles...</div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No matching profiles found.
                </div>
              ) : (
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {profiles.map((profile) => (
                    <div
                      key={profile.uid}
                      className="bg-white border rounded-2xl overflow-hidden hover:shadow-xl transition duration-300"
                    >
                      <div className="relative h-72">
                        <Image
                          src={
                            profile.profileImage ||
                            `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}`
                          }
                          alt={profile.firstName}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg">
                            {profile.firstName} {profile.lastName}
                          </h3>

                          <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">
                            {profile.gender}
                          </span>
                        </div>

                        <p className="text-gray-500 mt-1">
                          {calculateAge(profile.dob)} Years Old
                        </p>

                        <p className="text-gray-500">
                          📍 {profile.city || "Unknown"}
                        </p>

                        <Link
                          href={`/profile/${profile.uid}`}
                          className="block w-full mt-4 bg-pink-600 text-white py-2 rounded-xl hover:bg-pink-700 transition text-center"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Premium */}

            <div className="bg-yellow-100 border border-yellow-300 rounded-3xl p-6 mt-6">
              <h2 className="text-xl font-bold">Upgrade To Premium</h2>

              <p className="mt-2">
                See who liked you, unlimited likes, advanced filters and more.
              </p>

              <button className="mt-4 bg-yellow-500 text-white px-5 py-2 rounded-xl">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
