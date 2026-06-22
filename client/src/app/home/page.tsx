"use client";

import {
  Heart,
  Search,
  Shield,
  Users,
  MessageCircle,
  Star,
  ArrowRight,
  Check,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged, User } from "firebase/auth";

interface Profile {
  uid: string;
  firstName: string;
  lastName: string;
  dob?: string;
  religion?: string;
  job?: string;
  gender?: string;
  profileImage?: string;
  city?: string;
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

const BENEFITS = [
  {
    icon: Shield,
    title: "100% Verified Profiles",
    desc: "Every profile is reviewed by our team to ensure authenticity and safety.",
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-50",
  },
  {
    icon: Users,
    title: "Millions of Members",
    desc: "Join a vibrant community of singles looking for genuine connections worldwide.",
    color: "from-purple-500 to-indigo-500",
    bg: "bg-purple-50",
  },
  {
    icon: MessageCircle,
    title: "Instant Messaging",
    desc: "Chat in real-time with your matches — no waiting, no games.",
    color: "from-amber-400 to-orange-500",
    bg: "bg-amber-50",
  },
  {
    icon: Heart,
    title: "Smart Matching",
    desc: "Our algorithm finds compatible partners based on values, interests, and lifestyle.",
    color: "from-teal-400 to-cyan-500",
    bg: "bg-teal-50",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya & Rajan",
    text: "We matched on DatingHub and knew instantly. Married 6 months later!",
    avatar: "https://ui-avatars.com/api/?name=Priya+R&background=f9a8d4&color=9d174d&size=80",
    stars: 5,
  },
  {
    name: "Sarah & Michael",
    text: "The best dating platform I've used. Genuine profiles, real conversations.",
    avatar: "https://ui-avatars.com/api/?name=Sarah+M&background=d8b4fe&color=7e22ce&size=80",
    stars: 5,
  },
  {
    name: "Amara & David",
    text: "DatingHub helped me find someone who truly shares my values. Highly recommend.",
    avatar: "https://ui-avatars.com/api/?name=Amara+D&background=fed7aa&color=c2410c&size=80",
    stars: 5,
  },
];

export default function HomePage() {
  const [profiles, setProfiles]           = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db, "users"), limit(8)));
        const currentUser = auth.currentUser;
        const list = snap.docs
          .map((d) => ({ uid: d.id, ...d.data() } as Profile))
          .filter((u) => u.uid !== currentUser?.uid)
          .slice(0, 8);
        setProfiles(list);
      } catch {}
      finally { setLoadingProfiles(false); }
    };
    fetch();
  }, []);

  return (
    <main className="min-h-screen bg-white font-sans">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow group-hover:shadow-md transition-shadow">
              <Heart size={16} className="text-white fill-white" />
            </div>
            <span className="font-bold text-xl text-gradient-brand">DatingHub</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#about"    className="hover:text-pink-600 transition">About</a>
            <a href="#features" className="hover:text-pink-600 transition">Features</a>
            <a href="#profiles" className="hover:text-pink-600 transition">Members</a>
            <a href="#contact"  className="hover:text-pink-600 transition">Contact</a>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <button className="btn-primary px-5 py-2 text-sm">
                  Go to Dashboard <ArrowRight size={15} />
                </button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-pink-600 transition">
                  Sign In
                </Link>
                <Link href="/auth/signup">
                  <button className="btn-primary px-5 py-2 text-sm">
                    Get Started <ArrowRight size={15} />
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1600&q=80"
            alt="couple"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-br from-black/70 via-black/50 to-purple-900/60" />
        </div>

        {/* Floating hearts */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <Heart
              key={i}
              size={12 + i * 6}
              className="absolute text-pink-400/20 fill-pink-400/20 animate-float-heart"
              style={{
                left: `${10 + i * 18}%`,
                top:  `${15 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.8}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-5 max-w-4xl mx-auto animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white/90 text-sm font-medium px-4 py-2 rounded-full border border-white/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping-slow" />
            10,000+ active members today
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-tight mb-6">
            Find Your
            <span className="block text-transparent bg-clip-text bg-linear-to-r from-pink-400 to-purple-400">
              Perfect Match
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Meet genuine people, build meaningful relationships, and start your journey to love today.
          </p>

          {/* Search bar */}
          <div className="bg-white rounded-2xl p-2 flex items-center gap-2 max-w-xl mx-auto shadow-2xl mb-8">
            <div className="flex items-center gap-2 flex-1 pl-3">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by city, religion, interests..."
                className="flex-1 py-2.5 outline-none text-gray-700 placeholder:text-gray-400 text-sm bg-transparent"
              />
            </div>
            <button className="btn-primary px-6 py-2.5 text-sm shrink-0">
              Search
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-white/70 text-sm">
            {["Free to join", "Verified profiles", "Real matches"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check size={14} className="text-green-400" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Profiles ─────────────────────────────────────────────────── */}
      <section id="profiles" className="py-20 px-5 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-pink-600 bg-pink-50 px-4 py-1.5 rounded-full">Our Members</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4">Meet Real People</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Thousands of verified singles looking for genuine connections, just like you.
            </p>
          </div>

          {loadingProfiles ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl h-72 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {profiles.map((profile) => {
                const age = calculateAge(profile.dob);
                return (
                  <div
                    key={profile.uid}
                    className="group bg-white rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    <div className="relative h-52 overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100">
                      <Image
                        src={
                          
                          profile.gender === "Male" ? "/male.jpg" : "/female.jpg" 
                        }
                        alt={profile.firstName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3 text-white">
                        <p className="font-bold">
                          {profile.firstName}
                          {age !== null && <span className="font-normal text-white/80">, {age}</span>}
                        </p>
                        {profile.city && <p className="text-xs text-white/70">{profile.city}</p>}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {profile.religion && (
                          <span className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full font-medium">
                            {profile.religion}
                          </span>
                        )}
                        {profile.job && (
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                            {profile.job}
                          </span>
                        )}
                      </div>
                      <Link href={user ? `/profile/${profile.uid}` : "/auth/signup"}>
                        <button className="btn-primary w-full py-2 text-sm">
                          View Profile
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-10">
            <Link href={user ? "/dashboard" : "/auth/signup"}>
              <button className="btn-secondary px-8 py-3 text-sm">
                See All Members <ArrowRight size={15} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-pink-600 bg-pink-50 px-4 py-1.5 rounded-full">Why DatingHub</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4">Built for Real Connections</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              We built DatingHub with one goal: helping you find someone truly worth meeting.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className={`${b.bg} rounded-3xl p-7 hover:shadow-md transition-shadow duration-300`}>
                  <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${b.color} flex items-center justify-center mb-4 shadow-md`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-linear-to-br from-pink-50 to-purple-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Love Stories</h2>
            <p className="text-gray-500 mt-3">Real couples who found each other on DatingHub</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                    unoptimized
                  />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-pink-500">Matched on DatingHub</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ─────────────────────────────────────────────────────────── */}
      <section id="about" className="py-20 px-5 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">About DatingHub</h2>
          <p className="text-gray-600 leading-8 text-lg">
            DatingHub is a premium matchmaking platform designed to help people find meaningful
            relationships in a safe, trusted environment. Our mission is to connect individuals
            based on shared values, interests, and genuine compatibility — because great
            relationships start with a great foundation.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/auth/signup">
              <button className="btn-primary px-8 py-3 text-base">
                Start For Free <ArrowRight size={16} />
              </button>
            </Link>
            <a href="#features">
              <button className="btn-secondary px-8 py-3 text-base">Learn More</button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <Heart size={16} className="text-white fill-white" />
                </div>
                <span className="font-bold text-xl">DatingHub</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                Connecting hearts worldwide since 2024. Find love, build connections, create memories.
              </p>
              <div className="flex gap-3">
                {["f", "ig", "in"].map((label, i) => (
                  <button
                    key={i}
                    className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-pink-600 flex items-center justify-center transition-colors text-gray-300 text-xs font-bold"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
              <ul className="space-y-2.5 text-gray-400 text-sm">
                {["Home", "Discover", "Matches", "Messages", "Profile"].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-pink-400 transition">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-2.5 text-gray-400 text-sm">
                {["Help Center", "Contact Us", "Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-pink-400 transition">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Stay Connected</h4>
              <p className="text-gray-400 text-sm mb-4">Get dating tips and success stories.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500 transition"
                />
                <button className="bg-linear-to-r from-pink-500 to-purple-600 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition">
                  →
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-3">support@datinghub.com</p>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
            <p>© 2026 DatingHub. All Rights Reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-pink-400 transition">Privacy</a>
              <a href="#" className="hover:text-pink-400 transition">Terms</a>
              <a href="#" className="hover:text-pink-400 transition">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
