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
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { getOrCreateChat } from "@/services/chatService";
import type { MatchDocument, UserProfile } from "@/types/users";

interface EnrichedMatch {
  id: string;          // match document ID — used as matchId for chat creation
  matchedUser: UserProfile;
  createdAt: Date;
}

function calculateAge(dob?: string): number | "N/A" {
  if (!dob) return "N/A";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function MatchesPage() {
  const router = useRouter();

  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track which match's Message button is loading
  const [messagingId, setMessagingId] = useState<string | null>(null);

  useEffect(() => {
    let unsubMatches: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setCurrentUid(currentUser?.uid ?? null);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      unsubMatches = onSnapshot(
        query(
          collection(db, "matches"),
          where("users", "array-contains", currentUser.uid)
        ),
        async (snap) => {
          try {
            const enriched = await Promise.all(
              snap.docs.map(async (matchDoc) => {
                const data = matchDoc.data() as Omit<MatchDocument, "id">;
                const partnerId = (data.users as string[]).find(
                  (uid) => uid !== currentUser.uid
                )!;

                const partnerSnap = await getDoc(doc(db, "users", partnerId));
                const partnerData = partnerSnap.exists()
                  ? ({ uid: partnerId, ...partnerSnap.data() } as UserProfile)
                  : ({ uid: partnerId, firstName: "Unknown" } as UserProfile);

                return {
                  id: matchDoc.id,
                  matchedUser: partnerData,
                  createdAt: data.createdAt?.toDate?.() ?? new Date(),
                };
              })
            );

            enriched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setMatches(enriched);
          } catch (err) {
            console.error("Error enriching matches:", err);
            setError("Failed to load match details.");
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error("Match listener error:", err);
          setError("Failed to load matches.");
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      unsubMatches?.();
    };
  }, []);

  /** Open existing chat or create one, then navigate to it. */
  const handleMessage = async (matchId: string, partnerId: string) => {
    if (!currentUid || messagingId) return;

    setMessagingId(matchId);
    try {
      const chatId = await getOrCreateChat(matchId, [currentUid, partnerId]);
      router.push(`/chat/${chatId}`);
    } catch (err) {
      console.error("Failed to open chat:", err);
    } finally {
      setMessagingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <Topbar />

          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Your Matches</h1>
              <p className="text-gray-500 mt-1 text-sm">
                People who liked you back — start a conversation!
              </p>
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl h-72 animate-pulse" />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="text-center py-16 bg-white rounded-3xl shadow">
                <p className="text-5xl mb-4">⚠️</p>
                <p className="text-red-500 font-medium">{error}</p>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && matches.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl shadow">
                <p className="text-6xl mb-4">💕</p>
                <h2 className="text-xl font-semibold text-gray-700">No matches yet</h2>
                <p className="text-gray-400 text-sm mt-2">
                  Start liking profiles to find your match!
                </p>
              </div>
            )}

            {/* Match cards */}
            {!loading && !error && matches.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {matches.map((match) => {
                  const user = match.matchedUser;
                  const age = calculateAge(user.dob);
                  const isMessaging = messagingId === match.id;

                  return (
                    <div
                      key={match.id}
                      className="bg-white rounded-3xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                    >
                      {/* Avatar */}
                      <div className="h-40 bg-linear-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                        <Image
                          src={
                            user.profileImage ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              `${user.firstName} ${user.lastName ?? ""}`
                            )}&background=f9a8d4&color=9d174d&size=128`
                          }
                          alt={user.firstName}
                          width={96}
                          height={96}
                          className="rounded-full object-cover border-4 border-white shadow"
                          unoptimized
                        />
                      </div>

                      {/* Details */}
                      <div className="p-5 text-center">
                        <h3 className="font-bold text-xl text-gray-900">
                          {user.firstName}{" "}
                          {user.lastName && <span>{user.lastName}</span>}
                          {age !== "N/A" && (
                            <span className="font-normal text-gray-400 text-lg">
                              , {age}
                            </span>
                          )}
                        </h3>

                        <div className="mt-1.5 space-y-0.5 text-sm text-gray-500">
                          {user.city && <p>📍 {user.city}</p>}
                          {user.job && <p>💼 {user.job}</p>}
                          {user.religion && <p>🙏 {user.religion}</p>}
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                          Matched{" "}
                          {formatDistanceToNow(match.createdAt, {
                            addSuffix: true,
                          })}
                        </p>

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() =>
                              router.push(`/profile/${user.uid}`)
                            }
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition"
                          >
                            View Profile
                          </button>

                          <button
                            onClick={() =>
                              handleMessage(match.id, user.uid)
                            }
                            disabled={isMessaging}
                            className="flex-1 bg-linear-to-r from-pink-500 to-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
                          >
                            {isMessaging ? "Opening…" : "Message 💬"}
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
