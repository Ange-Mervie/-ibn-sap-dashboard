"use client";

import type { ReactNode } from "react";

const TILE_BG: Record<string, string> = {
  "text-zinc-900": "bg-slate-100 text-slate-700",
  "text-green-600": "bg-green-50 text-green-700",
  "text-blue-600": "bg-blue-50 text-blue-700",
  "text-red-600": "bg-red-50 text-red-700",
  "text-orange-600": "bg-orange-50 text-orange-700",
  "text-amber-600": "bg-amber-50 text-amber-700",
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
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ibn-text-muted)]">
          {label}
        </p>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            TILE_BG[color] ?? "bg-slate-100 text-slate-700"
          }`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2.5 text-[26px] font-semibold leading-none tracking-tight text-[var(--ibn-text-strong)]">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] leading-snug text-[var(--ibn-text-faint)]">{sub}</p>
    </div>
  );
}