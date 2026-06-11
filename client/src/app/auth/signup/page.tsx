"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { createUserDocument } from "@/services/userService";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword,
    setConfirmPassword] = useState("");

  const handleSignup = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
     const userCredential =
  await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

await createUserDocument(
  userCredential.user.uid,
  userCredential.user.email || ""
);

router.push("/profile/setup");

      // router.push("/dashboard");
    } catch (error: any) {
      alert(error.message);
    }
  };

 const handleGoogleLogin = async () => {
  try {
    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(
      auth,
      provider
    );

    await createUserDocument(
      result.user.uid,
      result.user.email || ""
    );

    router.push("/profile/setup");

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

    {/* Back to Home */}
    <div className="absolute top-6 left-6 z-20">
      <button
        onClick={() => router.push("/")}
        className="text-white border border-white px-4 py-2 rounded-full hover:bg-white hover:text-black transition"
      >
        ← Back to Home
      </button>
    </div>

    {/* Signup Card */}
    <div className="relative z-10 w-full max-w-md p-6 ">
      <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pink-600">
            ❤️ DatingHub
          </h1>

  
        </div>

        {/* Form */}
        <form
          onSubmit={handleSignup}
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
              placeholder="Create a password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl font-semibold transition"
          >
            Create Account
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-3">
          <div className="flex-1 border-t" />
          <span className="px-4 text-gray-400 text-sm">
            OR
          </span>
          <div className="flex-1 border-t" />
        </div>

        {/* Google Signup */}
        <button
          onClick={handleGoogleLogin}
          className="w-full border py-3 rounded-xl font-medium hover:bg-gray-50 transition"
        >
          Continue with Google
        </button>

        {/* Login Link */}
        <div className="text-center mt-6">
          <span className="text-gray-600">
            Already have an account?
          </span>

          <button
            onClick={() =>
              router.push("/auth/login")
            }
            className="ml-2 text-pink-600 font-semibold hover:underline"
          >
            Login
          </button>
        </div>

        {/* Terms */}
        <p className="text-xs text-gray-400 text-center mt-4 p-1">
          By creating an account, you agree to our
          Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  </div>
);
}