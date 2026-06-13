"use client";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";

interface UserProfile {

  firstName?: string;
  lastName?: string;

  city?: string;
  country?: string;

  bio?: string;

  gender?: string;
  interestedIn?: string;

  religion?: string;
  ethnicity?: string;
  caste?: string;

  occupation?: string;

  fatherName?: string;
  additionalInfo?: string;

  profileImage?: string;
  dob?: string;
}


export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
      try {
        if (!currentUser) {
          setLoading(false);
          return;
        }

        const userRef = doc(db, "users", currentUser.uid);

        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser(userSnap.data() as UserProfile);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Profile not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Cover */}
      <div className="relative h-72 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600">
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Main Card */}
        <div className="relative -mt-24 bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              {/* Avatar */}
              <div>
                <Image
                  src={
                    user.profileImage ||
                    `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&format=png`
                  }
                  alt="Profile"
                  width={180}
                  height={180}
                  className="rounded-full object-cover"
                />
              </div>

              {/* User Details */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold">
                  {user.firstName} {user.lastName}
                </h1>

                <p className="text-gray-500 text-lg mt-2">
                  {calculateAge(user.dob)} Years Old
                </p>

                <p className="text-gray-500 mt-1">
                  📍 {user.city || "Unknown City"}
                </p>
<div className="flex gap-4 mt-4 justify-center md:justify-start">
                <div className="mt-4">
                  <Link
                    href="/profile/edit"
                    className="inline-flex bg-pink-600 text-white px-6 py-3 rounded-xl hover:bg-pink-700 transition"
                  >
                    Edit Profile
                  </Link>
                  </div>

                  <div className="mt-4">

                    <Link
                    href="/dashboard"
                    className="inline-flex bg-white border-1 text-pink-600 px-6 py-3 rounded-xl hover:border-pink-600 transition"
                  >
                    Back to Dashboard
                  </Link>
                </div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* About */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow p-6">
            <h2 className="text-2xl font-bold mb-4">About Me</h2>

            <p className="text-gray-600 leading-8">
              {user.bio || "No bio added yet."}
            </p>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Profile Stats</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Profile Views</span>
                <span className="font-semibold">0</span>
              </div>

              <div className="flex justify-between">
                <span>Likes Received</span>
                <span className="font-semibold">0</span>
              </div>

              <div className="flex justify-between">
                <span>Matches</span>
                <span className="font-semibold">0</span>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Personal Information</h2>

            <div className="space-y-4">
              <div>
                <p className="text-gray-500">Gender</p>
                <p className="font-semibold">{user.gender || "N/A"}</p>
              </div>

              <div>
                <p className="text-gray-500">Religion</p>
                <p className="font-semibold">{user.religion || "N/A"}</p>
              </div>

              <div>
                <p className="text-gray-500">Occupation</p>
                <p className="font-semibold">{user.occupation || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Match Preferences */}
          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Looking For</h2>

            <p className="font-semibold">{user.interestedIn || "N/A"}</p>
          </div>

          {/* Interests */}
          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Interests</h2>

            <div className="flex flex-wrap gap-3">
              <span className="bg-pink-100 text-pink-600 px-4 py-2 rounded-full">
                Add Interests
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
