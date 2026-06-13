"use client";

import {
  Heart,
  Search,
  Shield,
  Users,
  MessageCircle,
  Icon,
} from "lucide-react";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, limit, query, } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged, User } from "firebase/auth";


interface Profile {
  uid: string;
  firstName: string;
  lastName: string;
  age: number;
  religion: string;
  job: string;
  gender: string;
  profileImage: string;
  dob: string;
}

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [user, setUser] = useState<User | null>(null);

 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });

  return () => unsubscribe();
}, []);

  const calculateAge = (dob?: string) => {
    if (!dob) return "N/A";

    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  useEffect(() => {
  const fetchProfiles = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));

      const currentUser = auth.currentUser;

      const users = snapshot.docs
        .map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        }))
        .filter((user: any) => user.uid !== currentUser?.uid); // 👈 remove self

      setProfiles(users as Profile[]);
    } catch (error) {
      console.error("Error loading profiles:", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  fetchProfiles();
}, []);
  return (
    <main className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-500" />
            <span className="font-bold text-xl">DatingHub</span>
          </div>

          {/* Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#about">About Us</a>
            <a href="#products">Products</a>
            <a href="#contact">Contact Us</a>
          </div>

         {user ? (
  <Link href="/dashboard">
    <button className="bg-pink-500 text-white px-5 py-2 rounded-full hover:bg-pink-600 transition">
      Dashboard
    </button>
  </Link>
) : (
  <Link href="/auth/signup">
    <button className="bg-pink-500 text-white px-5 py-2 rounded-full hover:bg-pink-600 transition">
      Sign Up
    </button>
  </Link>
)}
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1600"
          alt="dating"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 text-center px-6 text-white max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Find Your Perfect Match
          </h1>

          <p className="text-xl mb-10">
            Meet genuine people, build meaningful relationships, and start your
            journey today.
          </p>

          <div className="bg-white rounded-full p-2 flex items-center max-w-xl mx-auto">
            <Search className="text-gray-500 ml-4" />

            <input
              type="text"
              placeholder="Search by city, interests..."
              className="flex-1 px-4 py-3 outline-none text-black rounded-full"
            />

            <button className="bg-pink-500 text-white px-6 py-3 rounded-full">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* LIVE PROFILES */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Top Live Profiles
          </h2>

          {loadingProfiles ? (
            <div className="text-center">Loading profiles...</div>
          ) : (
            <div className="grid md:grid-cols-4 gap-8">
              {profiles.map((profile) => (
                <div
                  key={profile.uid}
                  className="bg-white rounded-3xl shadow-lg overflow-hidden hover:scale-105 transition duration-300"
                >
                  <div className="p-6 text-center">
                    <img
                      src={
                        profile.gender === "Male" ? "/male.jpg" : "/female.jpg"
                      }
                      alt={profile.firstName}
                      className="h-24 w-24 object-cover rounded-full mx-auto border-4 border-pink-100"
                    />

                    <div className="mt-4">
                      <h3 className="font-bold text-xl">
                        {profile.firstName} {profile.lastName}
                      </h3>

                      <p className="text-gray-600">
                        {calculateAge(profile.dob) || "N/A"} Years
                      </p>

                      <p className="text-gray-600">
                        {profile.religion || "Not Specified"}
                      </p>

                      <p className="text-gray-600">
                        {profile.job || "Not Specified"}
                      </p>

                      <button className="mt-4 w-full bg-pink-500 text-white py-2 rounded-xl hover:bg-pink-600">
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BENEFITS */}
      <section id="products" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Why Choose Us
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center p-8 border rounded-2xl">
              <Shield className="mx-auto h-14 w-14 text-pink-500 mb-4" />

              <h3 className="font-bold text-xl mb-3">Verified Profiles</h3>

              <p className="text-gray-600">
                Every profile is reviewed to ensure authenticity and safety.
              </p>
            </div>

            <div className="text-center p-8 border rounded-2xl">
              <Users className="mx-auto h-14 w-14 text-pink-500 mb-4" />

              <h3 className="font-bold text-xl mb-3">Millions of Members</h3>

              <p className="text-gray-600">
                Connect with people from around the world.
              </p>
            </div>

            <div className="text-center p-8 border rounded-2xl">
              <MessageCircle className="mx-auto h-14 w-14 text-pink-500 mb-4" />

              <h3 className="font-bold text-xl mb-3">Instant Messaging</h3>

              <p className="text-gray-600">
                Chat in real-time with your matches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT US */}
      <section id="about" className="py-20 bg-gray-50 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">About Us</h2>

          <p className="text-lg text-gray-600 leading-8">
            DatingHub is a modern matchmaking platform designed to help people
            find meaningful relationships in a safe and trusted environment. Our
            mission is to connect individuals based on shared values, interests,
            and compatibility.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10">
          <div>
            <h3 className="font-bold text-xl mb-4">DatingHub</h3>

            <p className="text-gray-400">Connecting hearts worldwide.</p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Company</h4>

            <ul className="space-y-2 text-gray-400">
              <li>About Us</li>
              <li>Contact</li>
              <li>Careers</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Support</h4>

            <ul className="space-y-2 text-gray-400">
              <li>Help Center</li>
              <li>Privacy Policy</li>
              <li>Terms</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Contact</h4>

            <p className="text-gray-400">support@datinghub.com</p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500">
          © 2026 DatingHub. All Rights Reserved.
        </div>
      </footer>
    </main>
  );
}
