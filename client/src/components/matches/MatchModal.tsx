"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Heart, X, MessageCircle, Sparkles } from "lucide-react";

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

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

const CONFETTI_COLORS = [
  "#ec4899", "#a855f7", "#f59e0b", "#10b981",
  "#3b82f6", "#f97316", "#e11d48",
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    size: 6 + Math.random() * 8,
  }));
}

function avatarUrl(user: ModalUser | null, bg: string, fg: string) {
  return (
    user?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${user?.firstName || "U"} ${user?.lastName || ""}`
    )}&background=${bg}&color=${fg}&size=160`
  );
}

export default function MatchModal({
  isOpen,
  matchedUser,
  currentUser,
  onClose,
  onMessage,
}: MatchModalProps) {
  const [mounted, setMounted] = useState(false);
  const [particles] = useState(() => generateParticles(24));

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!mounted || !isOpen || !matchedUser) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="It's a Match!"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Confetti particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-sm opacity-0"
            style={{
              left: `${p.x}%`,
              top: "-10px",
              width: `${p.size}px`,
              height: `${p.size * 0.6}px`,
              backgroundColor: p.color,
              animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            }}
          />
        ))}
      </div>

      {/* Floating hearts decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <Heart
            key={i}
            size={16 + i * 4}
            className="absolute text-pink-400/30 fill-pink-400/30 animate-float-heart"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Modal card */}
      <div
        className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Sparkles */}
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-full bg-linear-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <Sparkles size={26} className="text-pink-500" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-extrabold text-gradient-brand">
          It&apos;s a Match!
        </h2>
        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
          You and{" "}
          <span className="font-semibold text-gray-800">{matchedUser.firstName}</span>{" "}
          liked each other ❤️
        </p>

        {/* Avatar pair */}
        <div className="flex items-center justify-center gap-4 my-7">
          {/* Current user */}
          <div className="relative">
            <div className="ring-4 ring-pink-300 ring-offset-2 rounded-full overflow-hidden">
              <Image
                src={avatarUrl(currentUser, "f9a8d4", "9d174d")}
                alt="You"
                width={84}
                height={84}
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

          {/* Animated heart in centre */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-300/50">
              <Heart size={22} className="text-white fill-white animate-heartbeat" />
            </div>
          </div>

          {/* Matched user */}
          <div className="relative">
            <div className="ring-4 ring-purple-300 ring-offset-2 rounded-full overflow-hidden">
              <Image
                src={avatarUrl(matchedUser, "d8b4fe", "7e22ce")}
                alt={matchedUser.firstName}
                width={84}
                height={84}
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onMessage}
            className="btn-primary w-full py-3 text-base"
          >
            <MessageCircle size={18} />
            Start Chatting
          </button>
          <button
            onClick={onClose}
            className="btn-secondary w-full py-3 text-base"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
