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
import toast from "react-hot-toast";
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
import { Heart, ThumbsUp, MessageCircle, Eye, Sparkles, Crown } from "lucide-react";

export default function DashboardPage() {
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [profiles, setProfiles]           = useState<UserProfile[]>([]);
  const [likeStates, setLikeStates]       = useState<Record<string, LikeState>>({});
  const [likingId, setLikingId]           = useState<string | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const [matchCount,  setMatchCount]  = useState(0);
  const [likesCount,  setLikesCount]  = useState(0);

  const [matchModal, setMatchModal] = useState<{
    open: boolean;
    matchedProfile: UserProfile | null;
  }>({ open: false, matchedProfile: null });

  // ── Load profiles + initial like states ─────────────────────────────────
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { setLoadingProfiles(false); return; }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) { setLoadingProfiles(false); return; }

        const userData = { uid: currentUser.uid, ...userDoc.data() } as UserProfile;
        setCurrentUserProfile(userData);

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
          .filter((u) => u.interestedIn === userData.gender);

        setProfiles(suggested);

        const [likedIds, matchedIds] = await Promise.all([
          getUserSentLikeIds(currentUser.uid),
          getMatchedUserIds(currentUser.uid),
        ]);

        const states: Record<string, LikeState> = {};
        suggested.forEach((u) => {
          if (matchedIds.has(u.uid))      states[u.uid] = "matched";
          else if (likedIds.has(u.uid))   states[u.uid] = "liked";
          else                            states[u.uid] = "none";
        });
        setLikeStates(states);
      } catch (err) {
        console.error("Error loading dashboard:", err);
        toast.error("Failed to load profiles");
      } finally {
        setLoadingProfiles(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // ── Real-time stats ──────────────────────────────────────────────────────
  useEffect(() => {
    let unsubMatches: (() => void) | null = null;
    let unsubLikes:   (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubMatches?.();
      unsubLikes?.();
      if (!currentUser) return;

      unsubMatches = onSnapshot(
        query(collection(db, "matches"), where("users", "array-contains", currentUser.uid)),
        (snap) => setMatchCount(snap.size)
      );
      unsubLikes = onSnapshot(
        query(collection(db, "likes"), where("toUser", "==", currentUser.uid)),
        (snap) => setLikesCount(snap.size)
      );
    });

    return () => { unsubAuth(); unsubMatches?.(); unsubLikes?.(); };
  }, []);

  // ── Like handler ─────────────────────────────────────────────────────────
  const handleLike = useCallback(
    async (targetUserId: string) => {
      const currentUser = auth.currentUser;
      if (!currentUser || likingId !== null) return;

      setLikingId(targetUserId);
      try {
        const result = await sendLike(currentUser.uid, targetUserId);

        if (result.matched) {
          setLikeStates((prev) => ({ ...prev, [targetUserId]: "matched" }));
          const matchedProfile = profiles.find((p) => p.uid === targetUserId) ?? null;
          setMatchModal({ open: true, matchedProfile });
          toast.success("🎉 It's a Match!");
        } else {
          setLikeStates((prev) => ({ ...prev, [targetUserId]: "liked" }));
          toast.success("❤️ Like sent!");
        }
      } catch {
        toast.error("❌ Failed to send like");
      } finally {
        setLikingId(null);
      }
    },
    [profiles, likingId]
  );

  const firstName = currentUserProfile?.firstName || "there";

  return (
    <ProtectedRoute>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <Topbar />

          <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
            {/* ── Welcome Hero ─────────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-linear-to-br from-pink-500 via-rose-500 to-purple-600 text-white rounded-3xl p-7 sm:p-10 animate-gradient-x shadow-xl shadow-pink-200/50">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={18} className="text-yellow-300" />
                  <span className="text-sm font-medium text-white/80">Daily Matches Ready</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-bold">
                  Welcome back, {firstName}! ❤️
                </h2>
                <p className="mt-2 text-pink-100 text-sm sm:text-base max-w-md">
                  Your perfect match could be just one swipe away. Explore today&apos;s suggested profiles below.
                </p>
              </div>
            </div>

            {/* ── Stats Grid ────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Matches"
                value={matchCount}
                icon={Heart}
                gradient="bg-linear-to-br from-pink-500 to-rose-600"
                iconBg="bg-white/20"
                trend="Mutual connections"
              />
              <StatCard
                title="Likes Received"
                value={likesCount}
                icon={ThumbsUp}
                gradient="bg-linear-to-br from-purple-500 to-indigo-600"
                iconBg="bg-white/20"
                trend="People who liked you"
              />
              <StatCard
                title="Messages"
                value="—"
                icon={MessageCircle}
                gradient="bg-linear-to-br from-amber-400 to-orange-500"
                iconBg="bg-white/20"
                trend="Active conversations"
              />
              <StatCard
                title="Profile Views"
                value="—"
                icon={Eye}
                gradient="bg-linear-to-br from-teal-400 to-cyan-600"
                iconBg="bg-white/20"
                trend="This week"
              />
            </div>

            {/* ── Suggested Profiles ───────────────────────────────────── */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Suggested Profiles</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Curated matches based on your preferences</p>
                </div>
                {!loadingProfiles && profiles.length > 0 && (
                  <span className="text-xs font-medium text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
                    {profiles.length} profiles
                  </span>
                )}
              </div>

              {loadingProfiles ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-3xl h-72 animate-pulse" />
                  ))}
                </div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={32} className="text-pink-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700">No matching profiles found</p>
                  <p className="text-sm text-gray-400 mt-1">Complete your profile or update your preferences.</p>
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

            {/* ── Premium CTA ───────────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-linear-to-r from-amber-400 to-orange-500 rounded-3xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-amber-200/50">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-2 right-8 text-6xl">✨</div>
                <div className="absolute bottom-2 left-8 text-4xl">⭐</div>
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <Crown size={18} className="text-white" />
                  <span className="text-white font-semibold text-sm">Premium Membership</span>
                </div>
                <h3 className="text-white font-bold text-xl sm:text-2xl">Unlock Your Full Potential</h3>
                <p className="text-white/80 text-sm mt-1">
                  See who liked you, unlimited likes, advanced filters and more.
                </p>
              </div>
              <button className="relative bg-white text-orange-600 font-bold px-7 py-3 rounded-2xl hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 shrink-0">
                Upgrade Now ✨
              </button>
            </div>
          </div>
        </div>
      </div>

      <MatchModal
        isOpen={matchModal.open}
        matchedUser={matchModal.matchedProfile}
        currentUser={currentUserProfile}
        onClose={() => setMatchModal({ open: false, matchedProfile: null })}
        onMessage={() => setMatchModal({ open: false, matchedProfile: null })}
      />
    </ProtectedRoute>
  );
}
