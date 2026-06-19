"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import Image from "next/image";
import Link from "next/link";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import MatchModal from "@/components/matches/MatchModal";
import { sendLike } from "@/services/likeService";
import type { LikeDocument, UserProfile } from "@/types/users";

type ButtonState = "none" | "loading" | "liked" | "matched";

interface LikerEntry {
  uid: string;
  profile: UserProfile;
  likeStatus: string;
}

export default function LikesPage() {
  const [currentUserProfile, setCurrentUserProfile] =
    useState<UserProfile | null>(null);
  const [likers, setLikers] = useState<LikerEntry[]>([]);
  const [buttonStates, setButtonStates] = useState<
    Record<string, ButtonState>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchModal, setMatchModal] = useState<{
    open: boolean;
    matchedProfile: UserProfile | null;
  }>({ open: false, matchedProfile: null });

  useEffect(() => {
    let unsubLikes: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // Load current user's profile for the modal avatars
      try {
        const myDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (myDoc.exists()) {
          setCurrentUserProfile({
            uid: currentUser.uid,
            ...myDoc.data(),
          } as UserProfile);
        }
      } catch (_) {
        // non-fatal
      }

      // Real-time listener: who liked me?
      unsubLikes = onSnapshot(
        query(
          collection(db, "likes"),
          where("toUser", "==", currentUser.uid)
        ),
        async (snap) => {
          try {
            const likes = snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<LikeDocument, "id">),
            }));

            if (likes.length === 0) {
              setLikers([]);
              setLoading(false);
              return;
            }

            // Fetch each liker's profile in parallel
            const entries = await Promise.all(
              likes.map(async (like) => {
                const userDoc = await getDoc(
                  doc(db, "users", like.fromUser)
                );
                if (!userDoc.exists()) return null;
                return {
                  uid: like.fromUser,
                  profile: {
                    uid: like.fromUser,
                    ...userDoc.data(),
                  } as UserProfile,
                  likeStatus: like.status,
                };
              })
            );

            const valid = entries.filter(Boolean) as LikerEntry[];
            setLikers(valid);

            // Seed button states from Firestore like status; preserve any
            // in-session "liked" actions the user has already taken.
            setButtonStates((prev) => {
              const next: Record<string, ButtonState> = {};
              valid.forEach((e) => {
                // Already matched → always "matched"
                if (e.likeStatus === "matched") {
                  next[e.uid] = "matched";
                } else {
                  // Keep the in-session state if it's already "liked" or "matched"
                  next[e.uid] =
                    prev[e.uid] === "liked" || prev[e.uid] === "matched"
                      ? prev[e.uid]
                      : "none";
                }
              });
              return next;
            });
          } catch (err) {
            console.error("Error loading likers:", err);
            setError("Failed to load likes.");
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error("Likes listener error:", err);
          setError("Failed to load likes.");
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      unsubLikes?.();
    };
  }, []);

  const handleLikeBack = async (targetUid: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setButtonStates((prev) => ({ ...prev, [targetUid]: "loading" }));

    try {
      const result = await sendLike(currentUser.uid, targetUid);

      if (result.matched) {
        setButtonStates((prev) => ({ ...prev, [targetUid]: "matched" }));
        const entry = likers.find((l) => l.uid === targetUid);
        setMatchModal({
          open: true,
          matchedProfile: entry?.profile ?? null,
        });
      } else {
        setButtonStates((prev) => ({ ...prev, [targetUid]: "liked" }));
      }
    } catch (err) {
      console.error("Error liking back:", err);
      setButtonStates((prev) => ({ ...prev, [targetUid]: "none" }));
    }
  };

  function calculateAge(dob?: string): number | "N/A" {
    if (!dob) return "N/A";
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  return (
    <ProtectedRoute>
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <Topbar />

          <div className="p-6">
            {/* Page header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                People Who Liked You
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Like them back to create a match!
              </p>
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl h-20 animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="text-center py-16 bg-white rounded-3xl shadow">
                <p className="text-5xl mb-4">⚠️</p>
                <p className="text-red-500 font-medium">{error}</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && likers.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl shadow">
                <p className="text-6xl mb-4">💌</p>
                <h2 className="text-xl font-semibold text-gray-700">
                  No likes yet
                </h2>
                <p className="text-gray-400 text-sm mt-2">
                  Your admirers will appear here once they like your profile.
                </p>
              </div>
            )}

            {/* Liker list */}
            {!loading && !error && likers.length > 0 && (
              <div className="space-y-3">
                {likers.map(({ uid, profile }) => {
                  const state = buttonStates[uid] ?? "none";
                  const age = calculateAge(profile.dob);

                  return (
                    <div
                      key={uid}
                      className="bg-white rounded-2xl shadow-sm flex items-center justify-between p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Left: avatar + info */}
                      <div className="flex items-center gap-4 min-w-0">
                        <Image
                          src={
                            profile.profileImage ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              `${profile.firstName} ${profile.lastName ?? ""}`
                            )}&background=f9a8d4&color=9d174d&size=80`
                          }
                          alt={profile.firstName}
                          width={56}
                          height={56}
                          className="rounded-full object-cover border shrink-0"
                          unoptimized
                        />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {profile.firstName} {profile.lastName}
                            {age !== "N/A" && (
                              <span className="text-gray-400 font-normal">
                                , {age}
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {profile.city && `📍 ${profile.city}`}
                            {profile.job && ` • 💼 ${profile.job}`}
                          </p>
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <Link href={`/profile/${uid}`}>
                          <button className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm transition">
                            View
                          </button>
                        </Link>

                        {state === "matched" ? (
                          <button className="px-4 py-2 rounded-xl bg-purple-100 text-purple-700 text-sm font-medium cursor-default">
                            Matched 💕
                          </button>
                        ) : state === "liked" ? (
                          <button className="px-4 py-2 rounded-xl bg-pink-100 text-pink-600 text-sm font-medium cursor-default">
                            Liked ❤️
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLikeBack(uid)}
                            disabled={state === "loading"}
                            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium transition disabled:opacity-60"
                          >
                            {state === "loading" ? "..." : "Like Back ❤️"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
          // TODO: navigate to /messages/{matchId} once messaging is built
          setMatchModal({ open: false, matchedProfile: null });
        }}
      />
    </ProtectedRoute>
  );
}
