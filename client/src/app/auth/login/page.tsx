"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const login = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      router.push("/dashboard");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const googleLogin = async () => {
    try {
      const provider =
        new GoogleAuthProvider();

      await signInWithPopup(
        auth,
        provider
      );

      router.push("/dashboard");
    } catch (error: any) {
      alert(error.message);
    }
  };

 return (
  <div className="min-h-screen relative flex items-center justify-center">
    {/* Background Image */}
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1600')",
      }}
    />

    {/* Dark Overlay */}
    <div className="absolute inset-0 bg-black/60" />

    {/* Back To Home */}
    <div className="absolute top-6 left-6 z-20">
      <button
        onClick={() => router.push("/")}
        className="text-white border border-white px-4 py-2 rounded-full hover:bg-white hover:text-black transition"
      >
        ← Back to Home
      </button>
    </div>

    {/* Login Card */}
    <div className="relative z-10 w-full max-w-md px-6">
      <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8">
        {/* Logo */}
        <div className="text-center mb-5">
          <h1 className="text-4xl font-bold text-pink-600">
            ❤️ DatingHub
          </h1>

        
        </div>

        {/* Login Form */}
        <form
          onSubmit={login}
          className="space-y-4"
        >
          <div>
            <label className="block mb-2 text-sm font-medium">
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              className="text-sm text-pink-600 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl font-semibold transition"
          >
            Sign In
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t" />
          <span className="px-4 text-gray-400 text-sm">
            OR
          </span>
          <div className="flex-1 border-t" />
        </div>

        {/* Google Login */}
        <button
          onClick={googleLogin}
          className="w-full border py-3 rounded-xl font-medium hover:bg-gray-50 transition"
        >
          Continue with Google
        </button>

        {/* Signup Link */}
        <div className="text-center mt-6">
          <span className="text-gray-600">
            Don't have an account?
          </span>

          <button
            onClick={() =>
              router.push("/auth/signup")
            }
            className="ml-2 text-pink-600 font-semibold hover:underline"
          >
            Sign Up
          </button>
        </div>

        {/* Terms */}
        <p className="text-xs text-gray-400 text-center mt-6">
          By signing in, you agree to our Terms of
          Service and Privacy Policy.
        </p>
      </div>
    </div>
  </div>
);
}