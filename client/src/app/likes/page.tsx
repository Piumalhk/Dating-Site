"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import Image from "next/image";
import Link from "next/link";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import MatchModal from "@/components/matches/MatchModal";
import { sendLike } from "@/services/likeService";
import type { LikeDocument, UserProfile } from "@/types/users";
import toast from "react-hot-toast";
import { Heart, MapPin, Briefcase, ThumbsUp } from "lucide-react";

type ButtonState = "none" | "loading" | "liked" | "matched";

interface LikerEntry {
  uid: string;
  profile: UserProfile;
  likeStatus: string;
}

function calculateAge(dob?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function LikesPage() {
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [likers,       setLikers]       = useState<LikerEntry[]>([]);
  const [buttonStates, setButtonStates] = useState<Record<string, ButtonState>>({});
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [matchModal,   setMatchModal]   = useState<{ open: boolean; matchedProfile: UserProfile | null }>({
    open: false, matchedProfile: null,
  });

  useEffect(() => {
    let unsubLikes: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { setLoading(false); return; }

      try {
        const myDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (myDoc.exists()) setCurrentUserProfile({ uid: currentUser.uid, ...myDoc.data() } as UserProfile);
      } catch {}

      unsubLikes = onSnapshot(
        query(collection(db, "likes"), where("toUser", "==", currentUser.uid)),
        async (snap) => {
          try {
            const likes = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LikeDocument, "id">) }));
            if (likes.length === 0) { setLikers([]); setLoading(false); return; }

            const entries = await Promise.all(
              likes.map(async (like) => {
                const userDoc = await getDoc(doc(db, "users", like.fromUser));
                if (!userDoc.exists()) return null;
                return {
                  uid: like.fromUser,
                  profile: { uid: like.fromUser, ...userDoc.data() } as UserProfile,
                  likeStatus: like.status,
                };
              })
            );

            const valid = entries.filter(Boolean) as LikerEntry[];
            setLikers(valid);
            setButtonStates((prev) => {
              const next: Record<string, ButtonState> = {};
              valid.forEach((e) => {
                if (e.likeStatus === "matched")              next[e.uid] = "matched";
                else if (prev[e.uid] === "liked" || prev[e.uid] === "matched") next[e.uid] = prev[e.uid];
                else                                         next[e.uid] = "none";
              });
              return next;
            });
          } catch { setError("Failed to load likes."); }
          finally { setLoading(false); }
        },
        () => { setError("Failed to load likes."); setLoading(false); }
      );
    });
    return () => { unsubAuth(); unsubLikes?.(); };
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
        setMatchModal({ open: true, matchedProfile: entry?.profile ?? null });
        toast.success("🎉 It's a Match!");
      } else {
        setButtonStates((prev) => ({ ...prev, [targetUid]: "liked" }));
        toast.success("❤️ Liked back!");
      }
    } catch {
      toast.error("Failed to send like");
      setButtonStates((prev) => ({ ...prev, [targetUid]: "none" }));
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Topbar />
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-12">
            {/* Page header */}
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <ThumbsUp size={17} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">People Who Like You</h1>
                {!loading && likers.length > 0 && (
                  <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    {likers.length}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm ml-12">Like them back to create a match!</p>
            </div>

            {/* Skeletons */}
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
                <p className="text-4xl mb-3">⚠️</p>
                <p className="text-red-500 font-medium">{error}</p>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && likers.length === 0 && (
              <div className="text-center py-24 bg-white rounded-3xl shadow-sm">
                <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
                  <Heart size={32} className="text-purple-300" />
                </div>
                <h2 className="text-xl font-semibold text-gray-700 mb-1">No likes yet</h2>
                <p className="text-gray-400 text-sm">
                  Your admirers will appear here once they like your profile.
                </p>
              </div>
            )}

            {/* Liker list */}
            {!loading && !error && likers.length > 0 && (
              <div className="space-y-3">
                {likers.map(({ uid, profile }) => {
                  const state = buttonStates[uid] ?? "none";
                  const age   = calculateAge(profile.dob);

                  return (
                    <div
                      key={uid}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 p-4"
                    >
                      {/* Avatar */}
                      <Link href={`/profile/${uid}`} className="shrink-0">
                        <div className="relative">
                          <Image
                            src={
                              profile.profileImage ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                `${profile.firstName} ${profile.lastName ?? ""}`
                              )}&background=f9a8d4&color=9d174d&size=100`
                            }
                            alt={profile.firstName}
                            width={60}
                            height={60}
                            className="rounded-full object-cover border-2 border-pink-100"
                            unoptimized
                          />
                          {state === "matched" && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center border-2 border-white">
                              <Heart size={9} className="text-white fill-white" />
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {profile.firstName} {profile.lastName}
                          {age !== null && (
                            <span className="text-gray-400 font-normal text-sm">, {age}</span>
                          )}
                        </h3>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                          {profile.city && (
                            <span className="flex items-center gap-1">
                              <MapPin size={10} /> {profile.city}
                            </span>
                          )}
                          {profile.job && (
                            <span className="flex items-center gap-1">
                              <Briefcase size={10} /> {profile.job}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/profile/${uid}`}>
                          <button className="btn-secondary px-4 py-2 text-sm rounded-xl">
                            View
                          </button>
                        </Link>

                        {state === "matched" ? (
                          <span className="px-4 py-2 rounded-xl bg-purple-100 text-purple-700 text-sm font-semibold">
                            💕 Matched
                          </span>
                        ) : state === "liked" ? (
                          <span className="px-4 py-2 rounded-xl bg-pink-100 text-pink-600 text-sm font-semibold">
                            ❤️ Liked
                          </span>
                        ) : (
                          <button
                            onClick={() => handleLikeBack(uid)}
                            disabled={state === "loading"}
                            className="btn-primary px-4 py-2 text-sm rounded-xl"
                          >
                            {state === "loading" ? (
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <><Heart size={13} /> Like Back</>
                            )}
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
