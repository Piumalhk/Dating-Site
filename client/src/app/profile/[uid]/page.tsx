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
import toast from "react-hot-toast";
import {
  MapPin, Briefcase, BookOpen, Heart, BadgeCheck,
  ArrowLeft, Edit3, User,
} from "lucide-react";

type LikeState = "none" | "loading" | "liked" | "matched";

function calculateAge(dob?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
}

export default function ProfileViewPage() {
  const params = useParams();
  const uid = params.uid as string;

  const [profile,             setProfile]             = useState<UserProfile | null>(null);
  const [currentUserProfile,  setCurrentUserProfile]  = useState<UserProfile | null>(null);
  const [isOwnProfile,        setIsOwnProfile]        = useState(false);
  const [likeState,           setLikeState]           = useState<LikeState>("none");
  const [loading,             setLoading]             = useState(true);
  const [matchModalOpen,      setMatchModalOpen]      = useState(false);

  useEffect(() => {
    if (!uid) return;
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { setLoading(false); return; }
      setIsOwnProfile(currentUser.uid === uid);
      try {
        const [targetSnap, mySnap] = await Promise.all([
          getDoc(doc(db, "users", uid)),
          getDoc(doc(db, "users", currentUser.uid)),
        ]);
        if (targetSnap.exists()) setProfile({ uid, ...targetSnap.data() } as UserProfile);
        if (mySnap.exists()) setCurrentUserProfile({ uid: currentUser.uid, ...mySnap.data() } as UserProfile);

        if (currentUser.uid !== uid) {
          const [alreadyLiked, matchedIds] = await Promise.all([
            checkExistingLike(currentUser.uid, uid),
            getMatchedUserIds(currentUser.uid),
          ]);
          if (matchedIds.has(uid))   setLikeState("matched");
          else if (alreadyLiked)     setLikeState("liked");
        }
      } catch {}
      finally { setLoading(false); }
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
        toast.success("🎉 It's a Match!");
      } else {
        setLikeState("liked");
        toast.success("❤️ Like sent!");
      }
    } catch {
      toast.error("Failed to send like");
      setLikeState("none");
    }
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <ProtectedRoute>
      <div className="flex bg-gray-50 min-h-screen">
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <div className="h-44 bg-gray-200 rounded-3xl animate-pulse" />
          <div className="h-44 bg-white rounded-3xl animate-pulse" />
          <div className="grid lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-white rounded-3xl animate-pulse" />)}
          </div>
        </div>
      </Shell>
    );
  }

  if (!profile) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-5xl">🔍</p>
          <p className="text-xl font-semibold text-gray-700">Profile not found</p>
          <Link href="/dashboard" className="btn-secondary px-6 py-2.5 text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </Shell>
    );
  }

  const age      = calculateAge(profile.dob);
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <Shell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-12">
        {/* Cover */}
        <div className="relative">
          <div className="h-44 sm:h-56 rounded-3xl overflow-hidden bg-linear-to-br from-pink-500 via-rose-500 to-purple-600 relative">
            <div className="absolute inset-0 opacity-20 select-none">
              <div className="absolute top-4 right-10 text-6xl">❤️</div>
              <div className="absolute bottom-4 left-10 text-4xl">💕</div>
            </div>
          </div>

          {/* Profile hero card */}
          <div className="mx-2 sm:mx-4 -mt-16 relative z-10 bg-white rounded-3xl shadow-xl p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="ring-4 ring-white shadow-xl rounded-full">
                  <Image
                    src={
                      profile.profileImage ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        `${profile.firstName} ${profile.lastName ?? ""}`
                      )}&background=f9a8d4&color=9d174d&size=200`
                    }
                    alt={profile.firstName}
                    width={110}
                    height={110}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                </div>
                {profile.verified && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                    <BadgeCheck size={16} className="text-white" />
                  </div>
                )}
              </div>

              {/* Name + meta */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  {age !== null && (
                    <span className="text-gray-400 font-normal text-xl">{age}</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 text-sm text-gray-500">
                  {location && <span className="flex items-center gap-1"><MapPin size={13} />{location}</span>}
                  {profile.job && <span className="flex items-center gap-1"><Briefcase size={13} />{profile.job}</span>}
                  {profile.religion && <span className="flex items-center gap-1"><BookOpen size={13} />{profile.religion}</span>}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mt-5 justify-center sm:justify-start">
                  {isOwnProfile ? (
                    <Link href="/profile/edit">
                      <button className="btn-primary px-5 py-2.5 text-sm">
                        <Edit3 size={15} /> Edit Profile
                      </button>
                    </Link>
                  ) : (
                    <button
                      onClick={handleLike}
                      disabled={likeState !== "none"}
                      className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:cursor-not-allowed
                        ${likeState === "matched"  ? "bg-purple-100 text-purple-700" :
                          likeState === "liked"    ? "bg-pink-100 text-pink-600" :
                          likeState === "loading"  ? "bg-pink-300 text-white cursor-wait" :
                          "btn-primary"}`}
                    >
                      <Heart
                        size={15}
                        className={
                          likeState === "matched" ? "fill-purple-600" :
                          likeState === "liked"   ? "fill-pink-500"   :
                          likeState === "loading" ? "animate-heartbeat" : ""
                        }
                      />
                      {likeState === "matched" ? "💕 Matched" :
                       likeState === "liked"   ? "❤️ Liked"  :
                       likeState === "loading" ? "Sending…"  : "❤️ Like"}
                    </button>
                  )}
                  <Link href="/dashboard">
                    <button className="btn-secondary px-5 py-2.5 text-sm">
                      <ArrowLeft size={15} /> Back
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* About */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <User size={15} className="text-white" />
                </div>
                <h2 className="font-bold text-gray-900">About Me</h2>
              </div>
              <p className="text-gray-600 leading-7 text-sm">
                {profile.bio || <span className="text-gray-300 italic">No bio added yet.</span>}
              </p>
            </div>
          </div>

          {/* Personal Info */}
          <div className="space-y-5">
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <User size={15} className="text-white" />
                </div>
                <h2 className="font-bold text-gray-900">Personal Info</h2>
              </div>
              <InfoRow label="Gender"     value={profile.gender} />
              <InfoRow label="Religion"   value={profile.religion} />
              <InfoRow label="Ethnicity"  value={profile.ethnicity} />
              <InfoRow label="Occupation" value={profile.job} />
              {!profile.gender && !profile.religion && !profile.job && (
                <p className="text-sm text-gray-300 italic">No details added yet.</p>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <Heart size={15} className="text-white" />
                </div>
                <h2 className="font-bold text-gray-900">Looking For</h2>
              </div>
              {profile.interestedIn ? (
                <span className="inline-block bg-pink-50 text-pink-600 font-semibold text-sm px-4 py-1.5 rounded-full border border-pink-100">
                  {profile.interestedIn}
                </span>
              ) : (
                <p className="text-sm text-gray-300 italic">Not specified</p>
              )}
            </div>
          </div>
        </div>
      </div>

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
