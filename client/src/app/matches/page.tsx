"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { getOrCreateChat } from "@/services/chatService";
import type { MatchDocument, UserProfile } from "@/types/users";
import toast from "react-hot-toast";
import { MessageCircle, User, Heart, MapPin, Briefcase, Clock } from "lucide-react";

interface EnrichedMatch {
  id: string;
  matchedUser: UserProfile;
  createdAt: Date;
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

export default function MatchesPage() {
  const router = useRouter();
  const [currentUid,  setCurrentUid]  = useState<string | null>(null);
  const [matches,     setMatches]     = useState<EnrichedMatch[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  useEffect(() => {
    let unsubMatches: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setCurrentUid(currentUser?.uid ?? null);
      if (!currentUser) { setLoading(false); return; }

      unsubMatches = onSnapshot(
        query(collection(db, "matches"), where("users", "array-contains", currentUser.uid)),
        async (snap) => {
          try {
            const enriched = await Promise.all(
              snap.docs.map(async (matchDoc) => {
                const data = matchDoc.data() as Omit<MatchDocument, "id">;
                const partnerId = (data.users as string[]).find((uid) => uid !== currentUser.uid)!;
                const partnerSnap = await getDoc(doc(db, "users", partnerId));
                return {
                  id: matchDoc.id,
                  matchedUser: partnerSnap.exists()
                    ? ({ uid: partnerId, ...partnerSnap.data() } as UserProfile)
                    : ({ uid: partnerId, firstName: "Unknown" } as UserProfile),
                  createdAt: data.createdAt?.toDate?.() ?? new Date(),
                };
              })
            );
            enriched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setMatches(enriched);
          } catch { setError("Failed to load match details."); }
          finally  { setLoading(false); }
        },
        () => { setError("Failed to load matches."); setLoading(false); }
      );
    });
    return () => { unsubAuth(); unsubMatches?.(); };
  }, []);

  const handleMessage = async (matchId: string, partnerId: string) => {
    if (!currentUid || messagingId) return;
    setMessagingId(matchId);
    try {
      const chatId = await getOrCreateChat(matchId, [currentUid, partnerId]);
      router.push(`/chat/${chatId}`);
    } catch {
      toast.error("Failed to open chat");
      setMessagingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Topbar />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-12">
            {/* Page header */}
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <Heart size={17} className="text-white fill-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Your Matches</h1>
                {!loading && matches.length > 0 && (
                  <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    {matches.length}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm ml-12">
                Mutual connections — start a conversation!
              </p>
            </div>

            {/* Skeletons */}
            {loading && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl h-72 animate-pulse" />
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
            {!loading && !error && matches.length === 0 && (
              <div className="text-center py-24 bg-white rounded-3xl shadow-sm">
                <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-4">
                  <Heart size={32} className="text-pink-300" />
                </div>
                <h2 className="text-xl font-semibold text-gray-700 mb-1">No matches yet</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Start liking profiles to find your perfect match!
                </p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  Discover Profiles
                </button>
              </div>
            )}

            {/* Match cards */}
            {!loading && !error && matches.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {matches.map((match) => {
                  const u            = match.matchedUser;
                  const age          = calculateAge(u.dob);
                  const isMessaging  = messagingId === match.id;
                  const avatarSrc    =
                    u.profileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${u.firstName} ${u.lastName ?? ""}`
                    )}&background=f9a8d4&color=9d174d&size=256`;

                  return (
                    <div
                      key={match.id}
                      className="group bg-white rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                      {/* Image area */}
                      <div className="relative h-52 overflow-hidden bg-linear-to-br from-pink-100 to-purple-100">
                        <Image
                          src={avatarSrc}
                          alt={u.firstName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

                        {/* Match badge */}
                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 text-pink-600 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          <Heart size={10} className="fill-pink-500 text-pink-500" />
                          Matched
                        </div>

                        {/* Name overlay */}
                        <div className="absolute bottom-3 left-4 text-white">
                          <p className="font-bold text-lg leading-tight">
                            {u.firstName} {u.lastName}
                            {age !== null && <span className="font-normal text-white/80">, {age}</span>}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4 space-y-3">
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          {u.city && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} /> {u.city}
                            </span>
                          )}
                          {u.job && (
                            <span className="flex items-center gap-1">
                              <Briefcase size={11} /> {u.job}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-gray-300">
                            <Clock size={11} />
                            {formatDistanceToNow(match.createdAt, { addSuffix: true })}
                          </span>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => router.push(`/profile/${u.uid}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                          >
                            <User size={14} /> Profile
                          </button>
                          <button
                            onClick={() => handleMessage(match.id, u.uid)}
                            disabled={isMessaging}
                            className="flex-1 btn-primary py-2.5 text-sm rounded-2xl"
                          >
                            {isMessaging ? (
                              <span className="flex items-center justify-center gap-1.5">
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Opening…
                              </span>
                            ) : (
                              <><MessageCircle size={14} /> Message</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
