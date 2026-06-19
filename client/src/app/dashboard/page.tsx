"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  limit,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import StatCard from "@/components/dashboard/StatCard";
import ProfileCard, { type LikeState } from "@/components/dashboard/ProfileCard";
import MatchModal from "@/components/matches/MatchModal";
import {
  sendLike,
  getUserSentLikeIds,
  getMatchedUserIds,
} from "@/services/likeService";
import type { UserProfile } from "@/types/users";

export default function DashboardPage() {
  const [currentUserProfile, setCurrentUserProfile] =
    useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [likeStates, setLikeStates] = useState<Record<string, LikeState>>({});
  const [likingId, setLikingId] = useState<string | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Real-time stats
  const [matchCount, setMatchCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);

  // Match modal
  const [matchModal, setMatchModal] = useState<{
    open: boolean;
    matchedProfile: UserProfile | null;
  }>({ open: false, matchedProfile: null });

  // ─── Load profiles + initial like states ────────────────────────────────
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoadingProfiles(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) {
          setLoadingProfiles(false);
          return;
        }
        const userData = { uid: currentUser.uid, ...userDoc.data() } as UserProfile;
        setCurrentUserProfile(userData);

        // Fetch suggested profiles filtered by gender preference
        const q = query(
          collection(db, "users"),
          where("profileCompleted", "==", true),
          where("gender", "==", userData.interestedIn),
          limit(20)
        );
        const snap = await getDocs(q);
        const suggested = snap.docs
          .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
          .filter((u) => u.uid !== currentUser.uid)
          // Mutual interest filter
          .filter((u) => u.interestedIn === userData.gender);

        setProfiles(suggested);

        // Batch-load existing like states to set correct button appearances
        const [likedIds, matchedIds] = await Promise.all([
          getUserSentLikeIds(currentUser.uid),
          getMatchedUserIds(currentUser.uid),
        ]);

        const states: Record<string, LikeState> = {};
        suggested.forEach((u) => {
          if (matchedIds.has(u.uid)) states[u.uid] = "matched";
          else if (likedIds.has(u.uid)) states[u.uid] = "liked";
          else states[u.uid] = "none";
        });
        setLikeStates(states);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoadingProfiles(false);
      }
    });

    return () => unsubAuth();
  }, []);

  // ─── Real-time stats listeners ───────────────────────────────────────────
  useEffect(() => {
    let unsubMatches: (() => void) | null = null;
    let unsubLikes: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      // Clean up previous listeners when user changes
      unsubMatches?.();
      unsubLikes?.();

      if (!currentUser) return;

      unsubMatches = onSnapshot(
        query(
          collection(db, "matches"),
          where("users", "array-contains", currentUser.uid)
        ),
        (snap) => setMatchCount(snap.size)
      );

      unsubLikes = onSnapshot(
        query(
          collection(db, "likes"),
          where("toUser", "==", currentUser.uid)
        ),
        (snap) => setLikesCount(snap.size)
      );
    });

    return () => {
      unsubAuth();
      unsubMatches?.();
      unsubLikes?.();
    };
  }, []);

  // ─── Like handler ────────────────────────────────────────────────────────
  const handleLike = useCallback(
    async (targetUserId: string) => {
      const currentUser = auth.currentUser;
      if (!currentUser || likingId !== null) return;

      setLikingId(targetUserId);
      try {
        const result = await sendLike(currentUser.uid, targetUserId);

        if (result.matched) {
          setLikeStates((prev) => ({ ...prev, [targetUserId]: "matched" }));
          const matchedProfile =
            profiles.find((p) => p.uid === targetUserId) ?? null;
          setMatchModal({ open: true, matchedProfile });
        } else {
          setLikeStates((prev) => ({ ...prev, [targetUserId]: "liked" }));
        }
      } catch (err) {
        console.error("Failed to send like:", err);
      } finally {
        setLikingId(null);
      }
    },
    [profiles, likingId]
  );

  return (
    <ProtectedRoute>
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <Topbar />

          <div className="p-6 space-y-6">
            {/* Welcome banner */}
            <div className="bg-linear-to-r from-pink-500 to-purple-600 text-white rounded-3xl p-8">
              <h2 className="text-3xl font-bold">Welcome Back ❤️</h2>
              <p className="mt-2 text-pink-100">
                Find your perfect match today.
              </p>
            </div>

            {/* Stats — real-time */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Matches" value={String(matchCount)} />
              <StatCard title="Likes Received" value={String(likesCount)} />
              <StatCard title="Messages" value="0" />
              <StatCard title="Profile Views" value="0" />
            </div>

            {/* Suggested profiles */}
            <div className="bg-white rounded-3xl p-6 shadow">
              <h2 className="text-2xl font-bold mb-6">Suggested Profiles</h2>

              {loadingProfiles ? (
                /* Skeleton loader */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-100 rounded-2xl h-80 animate-pulse"
                    />
                  ))}
                </div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-5xl mb-4">🔍</p>
                  <p className="text-xl font-medium text-gray-600">
                    No matching profiles found.
                  </p>
                  <p className="text-sm mt-2">
                    Complete your profile or broaden your preferences.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {profiles.map((profile) => (
                    <ProfileCard
                      key={profile.uid}
                      profile={profile}
                      likeState={likeStates[profile.uid] ?? "none"}
                      isLiking={likingId === profile.uid}
                      onLike={handleLike}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Premium CTA */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-yellow-800">
                  Upgrade To Premium
                </h2>
                <p className="mt-1 text-yellow-700 text-sm">
                  See who liked you, unlimited likes, advanced filters and more.
                </p>
              </div>
              <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-xl font-medium transition">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Match celebration modal */}
      <MatchModal
        isOpen={matchModal.open}
        matchedUser={matchModal.matchedProfile}
        currentUser={currentUserProfile}
        onClose={() => setMatchModal({ open: false, matchedProfile: null })}
        onMessage={() => {
          // TODO: route to /messages/{matchId} once messaging is built
          setMatchModal({ open: false, matchedProfile: null });
        }}
      />
    </ProtectedRoute>
  );
}
