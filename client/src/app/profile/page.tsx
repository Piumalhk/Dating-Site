"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import {
  MapPin, Briefcase, Heart, BookOpen, User,
  Edit3, BadgeCheck, ChevronRight,
} from "lucide-react";

interface UserProfile {
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  bio?: string;
  gender?: string;
  interestedIn?: string;
  religion?: string;
  ethnicity?: string;
  caste?: string;
  occupation?: string;
  fatherName?: string;
  additionalInfo?: string;
  profileImage?: string;
  dob?: string;
  verified?: boolean;
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

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center">
          <Icon size={15} className="text-white" />
        </div>
        <h2 className="font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const [user,    setUser]    = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) setUser(snap.data() as UserProfile);
      } catch {}
      finally { setLoading(false); }
    });
    return () => unsub();
  }, []);

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <ProtectedRoute>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0">
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
          <div className="h-40 bg-gray-200 rounded-3xl animate-pulse" />
          <div className="h-40 bg-white rounded-3xl animate-pulse" />
          <div className="grid lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 bg-white rounded-3xl animate-pulse" />
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-5xl">👤</p>
          <p className="text-gray-500 font-medium">Profile not found.</p>
          <Link href="/profile/setup" className="btn-primary px-6 py-2.5 text-sm">
            Set Up Profile
          </Link>
        </div>
      </Shell>
    );
  }

  const age = calculateAge(user.dob);
  const location = [user.city, user.country].filter(Boolean).join(", ");

  const interests = ["Hiking", "Reading", "Travel", "Coffee", "Music", "Art"];

  return (
    <Shell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-12">
        {/* Cover + Profile card */}
        <div className="relative">
          {/* Cover */}
          <div className="h-44 sm:h-56 rounded-3xl overflow-hidden bg-linear-to-br from-pink-500 via-rose-500 to-purple-600 animate-gradient-x relative">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 right-10 text-6xl select-none">❤️</div>
              <div className="absolute bottom-4 left-10 text-4xl select-none">💕</div>
            </div>
          </div>

          {/* Profile info card overlapping cover */}
          <div className="mx-2 sm:mx-4 -mt-16 relative z-10 bg-white rounded-3xl shadow-xl p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="ring-4 ring-white shadow-xl rounded-full">
                  <Image
                    src={
                      user.profileImage ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        `${user.firstName || "U"} ${user.lastName || ""}`
                      )}&background=f9a8d4&color=9d174d&size=200`
                    }
                    alt="Profile"
                    width={110}
                    height={110}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                </div>
                {user.verified && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                    <BadgeCheck size={16} className="text-white" />
                  </div>
                )}
              </div>

              {/* Name + info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h1>
                  {age !== null && (
                    <span className="text-gray-400 font-normal text-xl">{age}</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 text-sm text-gray-500">
                  {location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {location}
                    </span>
                  )}
                  {user.occupation && (
                    <span className="flex items-center gap-1">
                      <Briefcase size={13} /> {user.occupation}
                    </span>
                  )}
                  {user.religion && (
                    <span className="flex items-center gap-1">
                      <BookOpen size={13} /> {user.religion}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 mt-4 justify-center sm:justify-start">
                  <Link href="/profile/edit">
                    <button className="btn-primary px-5 py-2.5 text-sm">
                      <Edit3 size={15} /> Edit Profile
                    </button>
                  </Link>
                  <Link href="/dashboard">
                    <button className="btn-secondary px-5 py-2.5 text-sm">
                      ← Dashboard
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* About Me — 2 cols */}
          <div className="lg:col-span-2 space-y-5">
            <Section title="About Me" icon={User}>
              <p className="text-gray-600 leading-7 text-sm">
                {user.bio || (
                  <span className="text-gray-300 italic">
                    No bio added yet. Tell people about yourself!
                  </span>
                )}
              </p>
            </Section>

            <Section title="Personal Information" icon={User}>
              <InfoRow label="Gender"     value={user.gender} />
              <InfoRow label="Religion"   value={user.religion} />
              <InfoRow label="Ethnicity"  value={user.ethnicity} />
              <InfoRow label="Caste"      value={user.caste} />
              <InfoRow label="Occupation" value={user.occupation} />
              <InfoRow label="City"       value={user.city} />
              <InfoRow label="Country"    value={user.country} />
            </Section>

            {(user.fatherName || user.additionalInfo) && (
              <Section title="Family Information" icon={Heart}>
                <InfoRow label="Father's Name" value={user.fatherName} />
                {user.additionalInfo && (
                  <p className="text-sm text-gray-600 leading-6 mt-2">
                    {user.additionalInfo}
                  </p>
                )}
              </Section>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Looking For */}
            <Section title="Looking For" icon={Heart}>
              {user.interestedIn ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Interested in</span>
                  <span className="font-semibold text-pink-600 bg-pink-50 px-3 py-1 rounded-full text-sm">
                    {user.interestedIn}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-300 italic">Not specified</p>
              )}
            </Section>

            {/* Interests */}
            <Section title="Interests" icon={BookOpen}>
              <div className="flex flex-wrap gap-2">
                {interests.map((tag) => (
                  <span
                    key={tag}
                    className="bg-linear-to-r from-pink-50 to-purple-50 text-pink-700 border border-pink-100 text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                <Link href="/profile/edit">
                  <span className="bg-gray-50 border border-dashed border-gray-200 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer hover:border-pink-300 transition flex items-center gap-1">
                    + Add more
                  </span>
                </Link>
              </div>
            </Section>

            {/* Quick edit CTA */}
            <Link href="/profile/edit">
              <div className="bg-linear-to-br from-pink-500 to-purple-600 rounded-3xl p-5 text-white hover:opacity-95 transition group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Complete Your Profile</p>
                    <p className="text-white/70 text-xs mt-0.5">
                      Better profiles get more matches
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-white/70 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="mt-3 bg-white/20 rounded-full h-2">
                  <div className="bg-white rounded-full h-2 w-4/5" />
                </div>
                <p className="text-white/60 text-xs mt-1">80% complete</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
