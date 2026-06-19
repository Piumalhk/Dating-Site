"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Heart, X } from "lucide-react";

interface ModalUser {
  firstName: string;
  lastName?: string;
  profileImage?: string;
}

interface MatchModalProps {
  isOpen: boolean;
  matchedUser: ModalUser | null;
  currentUser: ModalUser | null;
  onClose: () => void;
  onMessage: () => void;
}

export default function MatchModal({
  isOpen,
  matchedUser,
  currentUser,
  onClose,
  onMessage,
}: MatchModalProps) {
  // Avoid SSR mismatch — only render portal after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen || !matchedUser) return null;

  const avatarUrl = (user: ModalUser | null, bg: string, color: string) =>
    user?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${user?.firstName || "U"} ${user?.lastName || ""}`
    )}&background=${bg}&color=${color}&size=128`;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="It's a Match!"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Emoji */}
        <div className="text-5xl mb-3 select-none">💕</div>

        {/* Heading */}
        <h2 className="text-3xl font-extrabold bg-linear-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          It&apos;s a Match!
        </h2>
        <p className="text-gray-500 mt-2 text-sm">
          You and{" "}
          <span className="font-semibold text-gray-700">
            {matchedUser.firstName}
          </span>{" "}
          liked each other.
        </p>

        {/* Avatar pair */}
        <div className="flex items-center justify-center gap-5 my-7">
          <div className="ring-4 ring-pink-300 rounded-full overflow-hidden shrink-0">
            <Image
              src={avatarUrl(currentUser, "f9a8d4", "9d174d")}
              alt="You"
              width={80}
              height={80}
              className="object-cover"
              unoptimized
            />
          </div>

          <Heart
            size={28}
            className="text-pink-500 fill-pink-500 shrink-0"
          />

          <div className="ring-4 ring-purple-300 rounded-full overflow-hidden shrink-0">
            <Image
              src={avatarUrl(matchedUser, "d8b4fe", "7e22ce")}
              alt={matchedUser.firstName}
              width={80}
              height={80}
              className="object-cover"
              unoptimized
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onMessage}
            className="w-full bg-linear-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Send Message 💬
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            Keep Browsing
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
