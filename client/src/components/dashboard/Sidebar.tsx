"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Heart,
  ThumbsUp as Like,
  MessageCircle,
  User,
  Settings,
} from "lucide-react";

const menus = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Matches",
    href: "/matches",
    icon: Heart,
  },
   {
    label: "Likes",
    href: "/likes",
    icon: Like,
  },
  {
    label: "Messages",
    href: "/messages",
    icon: MessageCircle,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    label: "Settings",
    href: "/profile/edit",
    icon: Settings,
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r min-h-screen">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-pink-600">
          DatingHub
        </h2>
      </div>

      <nav className="px-4">
        {menus.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-pink-50 mb-2"
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}