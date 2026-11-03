"use client";

import type { ReactNode } from "react";

const TILE_BG: Record<string, string> = {
  "text-zinc-900": "bg-zinc-100",
  "text-green-600": "bg-green-50",
  "text-blue-600": "bg-blue-50",
  "text-red-600": "bg-red-50",
  "text-orange-600": "bg-orange-50",
  "text-amber-600": "bg-amber-50",
};

export default function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div className="ibn-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TILE_BG[color] ?? "bg-slate-100"} ${color}`}>{icon}</span>
      </div>
      <p className={`mt-3 text-2xl font-bold tracking-tight text-slate-900 ${color}`}>{value}</p>
      <p className="mt-1 text-[11px] leading-snug text-slate-400">{sub}</p>
    </div>
  );
}
