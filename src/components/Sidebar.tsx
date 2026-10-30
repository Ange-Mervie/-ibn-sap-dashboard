"use client";

import type { LucideIcon } from "lucide-react";

export type SidebarItem = {
  id: string;
  label: string;
  href?: string;
  icon?: LucideIcon;
};

export default function Sidebar({
  items,
  active,
  onSelect,
}: {
  items: SidebarItem[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <nav className="sticky top-6 space-y-1 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
        <div className="mb-2 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          Navigation
        </div>
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          const cls = `flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm ${
            isActive
              ? "bg-blue-600 font-medium text-white"
              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
          }`;
          const content = (
            <>
              {Icon ? <Icon size={16} /> : null}
              {it.label}
            </>
          );
          if (it.href) {
            return (
              <a key={it.id} href={it.href} onClick={() => onSelect(it.id)} className={cls}>
                {content}
              </a>
            );
          }
          return (
            <button key={it.id} type="button" onClick={() => onSelect(it.id)} className={cls}>
              {content}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
