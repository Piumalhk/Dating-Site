"use client";

import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
  trend?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  iconBg,
  trend,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${gradient}`}
    >
      {/* Background decoration */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-2 w-16 h-16 rounded-full bg-white/10" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-white/70 text-sm font-medium">{title}</p>
          <p className="text-4xl font-bold mt-1.5 tabular-nums">{value}</p>
          {trend && (
            <p className="text-white/60 text-xs mt-1">{trend}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}
