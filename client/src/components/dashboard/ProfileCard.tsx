"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, MapPin } from "lucide-react";

export type LikeState = "none" | "liked" | "matched";

interface ProfileCardProps {
  profile: {
    uid: string;
    firstName: string;
    lastName: string;
    dob?: string;
    city?: string;
    religion?: string;
    job?: string;
    profileImage?: string;
  };
  likeState: LikeState;
  isLiking: boolean;
  onLike: (uid: string) => void;
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

export default function ProfileCard({
  profile,
  likeState,
  isLiking,
  onLike,
}: ProfileCardProps) {
  const age = calculateAge(profile.dob);

  return (
    <div className="group relative rounded-3xl overflow-hidden bg-white shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      {/* Profile image */}
      <div className="relative h-72 overflow-hidden bg-gray-100">
        <Image
          src={
            profile.profileImage ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              `${profile.firstName} ${profile.lastName}`
            )}&background=f9a8d4&color=9d174d&size=400`
          }
          alt={profile.firstName}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

        {/* Matched badge */}
        {likeState === "matched" && (
          <div className="absolute top-3 left-3 bg-white/95 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
            <Heart size={10} className="fill-purple-600 text-purple-600" />
            Matched
          </div>
        )}
        {likeState === "liked" && (
          <div className="absolute top-3 left-3 bg-white/95 text-pink-600 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
            <Heart size={10} className="fill-pink-500 text-pink-500" />
            Liked
          </div>
        )}

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg leading-tight">
            {profile.firstName} {profile.lastName}
            {age !== null && (
              <span className="font-normal text-white/80">, {age}</span>
            )}
          </h3>
          {profile.city && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-white/70 shrink-0" />
              <p className="text-white/70 text-sm truncate">{profile.city}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons — revealed on hover */}
      <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out p-3 bg-white/95 backdrop-blur-sm flex gap-2">
        <Link href={`/profile/${profile.uid}`} className="flex-1">
          <button className="w-full flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-2xl text-sm font-medium transition-colors">
            <Eye size={15} />
            View
          </button>
        </Link>

        <button
          onClick={() => onLike(profile.uid)}
          disabled={likeState !== "none" || isLiking}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed
            ${
              likeState === "matched"
                ? "bg-purple-100 text-purple-700"
                : likeState === "liked"
                ? "bg-pink-100 text-pink-600"
                : "bg-linear-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 shadow-md shadow-pink-200"
            }`}
        >
          <Heart
            size={15}
            className={
              likeState === "matched"
                ? "fill-purple-600 text-purple-600"
                : likeState === "liked"
                ? "fill-pink-500 text-pink-500"
                : isLiking
                ? "animate-heartbeat"
                : ""
            }
          />
          {isLiking ? "…" : likeState === "matched" ? "Matched" : likeState === "liked" ? "Liked" : "Like"}
        </button>
      </div>
    </div>
  );
}
