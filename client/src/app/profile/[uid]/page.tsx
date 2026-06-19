"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import Image from "next/image";
import Link from "next/link";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import MatchModal from "@/components/matches/MatchModal";
import {
  sendLike,
  checkExistingLike,
  getMatchedUserIds,
} from "@/services/likeService";
import type { UserProfile } from "@/types/users";

type LikeState = "none" | "loading" | "liked" | "matched";

function calculateAge(dob?: string): number | "N/A" {
  if (!dob) return "N/A";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function ProfileViewPage() {
  // useParams() is the correct hook for client components in Next.js 15/16
  const params = useParams();
  const uid = params.uid as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentUserProfile, setCurrentUserProfile] =
    useState<UserProfile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [likeState, setLikeState] = useState<LikeState>("none");
  const [loading, setLoading] = useState(true);
  const [matchModalOpen, setMatchModalOpen] = useState(false);

  useEffect(() => {
    if (!uid) return;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setIsOwnProfile(currentUser.uid === uid);

      try {
        // Fetch target profile and current user's profile in parallel
        const [targetSnap, mySnap] = await Promise.all([
          getDoc(doc(db, "users", uid)),
          getDoc(doc(db, "users", currentUser.uid)),
        ]);

        if (targetSnap.exists()) {
          setProfile({ uid, ...targetSnap.data() } as UserProfile);
        }

        if (mySnap.exists()) {
          setCurrentUserProfile({
            uid: currentUser.uid,
            ...mySnap.data(),
          } as UserProfile);
        }

        // Only check like state for other people's profiles
        if (currentUser.uid !== uid) {
          const [alreadyLiked, matchedIds] = await Promise.all([
            checkExistingLike(currentUser.uid, uid),
            getMatchedUserIds(currentUser.uid),
          ]);

          if (matchedIds.has(uid)) setLikeState("matched");
          else if (alreadyLiked) setLikeState("liked");
          else setLikeState("none");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, [uid]);

  const handleLike = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || likeState !== "none") return;

    setLikeState("loading");
    try {
      const result = await sendLike(currentUser.uid, uid);
      if (result.matched) {
        setLikeState("matched");
        setMatchModalOpen(true);
      } else {
        setLikeState("liked");
      }
    } catch (err) {
      console.error("Error sending like:", err);
      setLikeState("none");
    }
  };

  // ── Shell wrapper shared by all states ──────────────────────────────────
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <ProtectedRoute>
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0 overflow-y-auto">
          <Topbar />
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-400 animate-pulse text-lg">
            Loading profile…
          </div>
        </div>
      </Shell>
    );
  }

  if (!profile) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 gap-4">
          <p className="text-5xl">🔍</p>
          <p className="text-xl font-medium">Profile not found.</p>
          <Link
            href="/dashboard"
            className="text-pink-600 hover:underline text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </Shell>
    );
  }

  const age = calculateAge(profile.dob);

  return (
    <Shell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Cover banner */}
        <div className="h-48 bg-linear-to-r from-pink-500 via-purple-500 to-indigo-600 rounded-3xl" />

        {/* Profile card — overlaps the cover */}
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 -mt-16 mx-2">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            {/* Avatar */}
            <Image
              src={
                profile.profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  `${profile.firstName} ${profile.lastName ?? ""}`
                )}&background=f9a8d4&color=9d174d&size=256`
              }
              alt={profile.firstName}
              width={140}
              height={140}
              className="rounded-full object-cover border-4 border-white shadow-lg shrink-0"
              unoptimized
            />

            {/* Info + actions */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
                {age !== "N/A" && (
                  <span className="text-xl font-normal text-gray-400">
                    , {age}
                  </span>
                )}
              </h1>

              <div className="mt-2 space-y-0.5 text-gray-500 text-sm">
                {(profile.city || profile.country) && (
                  <p>
                    📍{" "}
                    {[profile.city, profile.country].filter(Boolean).join(", ")}
                  </p>
                )}
                {profile.job && <p>💼 {profile.job}</p>}
                {profile.religion && <p>🙏 {profile.religion}</p>}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 mt-5 justify-center sm:justify-start">
                {isOwnProfile ? (
                  <Link
                    href="/profile/edit"
                    className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-xl font-medium transition"
                  >
                    Edit Profile
                  </Link>
                ) : (
                  <button
                    onClick={handleLike}
                    disabled={likeState !== "none"}
                    className={`px-6 py-2.5 rounded-xl font-medium transition
                      ${
                        likeState === "matched"
                          ? "bg-purple-100 text-purple-700 cursor-default"
                          : likeState === "liked"
                          ? "bg-pink-100 text-pink-600 cursor-default"
                          : likeState === "loading"
                          ? "bg-pink-300 text-white cursor-wait"
                          : "bg-pink-600 hover:bg-pink-700 text-white"
                      }`}
                  >
                    {likeState === "matched"
                      ? "💕 Matched"
                      : likeState === "liked"
                      ? "❤️ Liked"
                      : likeState === "loading"
                      ? "…"
                      : "❤️ Like"}
                  </button>
                )}

                <Link
                  href="/dashboard"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-medium transition"
                >
                  ← Back
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* Bio */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow p-6">
            <h2 className="text-xl font-bold mb-3 text-gray-900">About Me</h2>
            <p className="text-gray-600 leading-7">
              {profile.bio || "No bio added yet."}
            </p>
          </div>

          {/* Personal info */}
          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Personal Info
            </h2>
            <div className="space-y-4">
              {[
                { label: "Gender", value: profile.gender },
                { label: "Religion", value: profile.religion },
                { label: "Education", value: profile.education },
                { label: "Civil Status", value: profile.civilStatus },
                { label: "Height", value: profile.height },
              ]
                .filter((f) => f.value)
                .map((field) => (
                  <div key={field.label}>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      {field.label}
                    </p>
                    <p className="font-semibold text-gray-800">{field.value}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Looking for */}
          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-xl font-bold mb-3 text-gray-900">
              Looking For
            </h2>
            <p className="font-semibold text-pink-600">
              {profile.interestedIn || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Match modal — only shown for other people's profiles */}
      {!isOwnProfile && (
        <MatchModal
          isOpen={matchModalOpen}
          matchedUser={profile}
          currentUser={currentUserProfile}
          onClose={() => setMatchModalOpen(false)}
          onMessage={() => setMatchModalOpen(false)}
        />
      )}
    </Shell>
  );
}
