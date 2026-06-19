"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

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

function calculateAge(dob?: string): number | "N/A" {
  if (!dob) return "N/A";
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

  const likeLabel = isLiking
    ? "..."
    : likeState === "matched"
    ? "Matched 💕"
    : likeState === "liked"
    ? "Liked"
    : "Like";

  const likeClass =
    likeState === "matched"
      ? "bg-purple-100 text-purple-700 cursor-default"
      : likeState === "liked"
      ? "bg-pink-100 text-pink-500 cursor-default"
      : "bg-pink-600 hover:bg-pink-700 text-white";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      {/* Profile Image */}
      <div className="relative h-64 bg-gray-100">
        <Image
          src={
            profile.profileImage ||
            `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&background=f9a8d4&color=9d174d&size=256`
          }
          alt={profile.firstName}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-lg leading-tight">
          {profile.firstName} {profile.lastName}
          {age !== "N/A" && (
            <span className="font-normal text-gray-400 text-base">, {age}</span>
          )}
        </h3>

        <div className="mt-1.5 space-y-0.5 text-sm text-gray-500 flex-1">
          {profile.city && <p>📍 {profile.city}</p>}
          {profile.religion && <p>🙏 {profile.religion}</p>}
          {profile.job && <p>💼 {profile.job}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Link href={`/profile/${profile.uid}`} className="flex-1">
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium transition">
              View Profile
            </button>
          </Link>

          <button
            onClick={() => onLike(profile.uid)}
            disabled={likeState !== "none" || isLiking}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition disabled:cursor-not-allowed ${likeClass}`}
          >
            <Heart
              size={14}
              className={
                likeState === "matched"
                  ? "fill-purple-600"
                  : likeState === "liked"
                  ? "fill-pink-500"
                  : ""
              }
            />
            {likeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
