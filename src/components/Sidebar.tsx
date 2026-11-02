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
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 bg-slate-900 lg:block">
      <nav className="sticky top-6 space-y-1">
        <div className="mb-2 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Navigation
        </div>
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          const cls = `flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm ${
            isActive
              ? "bg-blue-600 font-medium text-white"
              : "text-slate-200 hover:bg-white/10 hover:text-white"
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
