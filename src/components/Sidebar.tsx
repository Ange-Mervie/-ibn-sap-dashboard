"use client";

import type { LucideIcon } from "lucide-react";

export type SidebarItem = {
  id: string;
  label: string;
  href?: string;
  icon?: LucideIcon;
  group?: string;
};

type SidebarUser = { name: string; email: string; role: string };

export default function Sidebar({
  items,
  active,
  onSelect,
  user,
  onLogout,
  open = false,
  onOpenChange,
}: {
  items: SidebarItem[];
  active: string;
  onSelect: (id: string) => void;
  user?: SidebarUser | null;
  onLogout?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const groups: { name: string; items: SidebarItem[] }[] = [];
  const map = new Map<string, SidebarItem[]>();
  for (const it of items) {
    const g = it.group ?? "Général";
    const list = map.get(g) ?? [];
    list.push(it);
    map.set(g, list);
  }
  for (const [name, list] of Array.from(map.entries())) {
    groups.push({ name, items: list });
  }

  function renderItem(it: SidebarItem) {
    const Icon = it.icon;
    const isActive = active === it.id;
    const cls = `flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm ${isActive ? "bg-blue-600 font-medium text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`;
    const content = (
      <>
        {Icon ? <Icon size={16} /> : null}
        <span className="truncate">{it.label}</span>
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
  }

  const navContent = (
    <>
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">IBN</div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white">IBN GROUP</div>
          <div className="truncate text-[11px] text-slate-400">Suivi des incidents SAP</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((g) => (
          <div key={g.name} className="mb-4">
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{g.name}</div>
            <div className="space-y-1">{g.items.map(renderItem)}</div>
          </div>
        ))}
      </nav>
      {user ? (
        <div className="border-t border-white/10 px-4 py-4">
          <div className="text-sm font-semibold text-white">{user.name}</div>
          <div className="truncate text-xs text-slate-400">{user.email}</div>
          {onLogout ? (
            <button type="button" onClick={onLogout} className="mt-2 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10">
              Se deconnecter
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 bg-slate-900 lg:block">
        <div className="flex h-screen flex-col">{navContent}</div>
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange?.(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-slate-900">
            <div className="flex h-full flex-col">{navContent}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
