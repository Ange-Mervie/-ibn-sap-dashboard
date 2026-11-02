"use client";

import { useState } from "react";
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
  const [collapsed, setCollapsed] = useState(false);
  const groups: { name: string; items: SidebarItem[] }[] = [];
  const map = new Map<string, SidebarItem[]>();
  for (const it of items) {
    const g = it.group ?? "General";
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
    const base = "flex items-center gap-2 rounded-md text-[13px]";
    const cls = collapsed
      ? `${base} justify-center px-0 py-2 ${isActive ? "bg-blue-600 font-medium text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`
      : `${base} px-2.5 py-1.5 ${isActive ? "bg-blue-600 font-medium text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`;
    const content = (
      <>
        {Icon ? <Icon size={15} /> : null}
        {!collapsed ? <span className="truncate">{it.label}</span> : null}
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

  const groupsBlock = (
    <nav className={`flex-1 overflow-y-auto px-3 pb-4 ${collapsed ? "px-2" : ""}`}>
      {groups.map((g) => (
        <div key={g.name} className="mb-3">
          {!collapsed ? (
            <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{g.name}</div>
          ) : null}
          <div className={collapsed ? "space-y-1" : "space-y-0.5"}>
            {g.items.map(renderItem)}
          </div>
        </div>
      ))}
    </nav>
  );

  const profileBlock = user ? (
    <div className={`border-t border-white/10 px-3.5 py-3 ${collapsed ? "px-2" : ""}`}>
      {collapsed ? (
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-bold text-white">IBN</div>
          {onLogout ? (
            <button type="button" onClick={onLogout} aria-label="Se déconnecter" className="rounded-md px-2 py-1.5 text-slate-300 hover:bg-white/10">
              ⏻
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="text-sm font-semibold text-white">{user.name}</div>
          <div className="truncate text-xs text-slate-400">{user.email}</div>
          {onLogout ? (
            <button type="button" onClick={onLogout} className="mt-2 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10">
              Se déconnecter
            </button>
          ) : null}
        </>
      )}
    </div>
  ) : null;

  const sidebarBody = (
    <>
      <div className={`flex items-center ${collapsed ? "justify-center px-0 pb-4" : "gap-2 px-5 pb-4 pt-5"}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-bold text-white">IBN</div>
        {!collapsed ? (
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">IBN GROUP</div>
            <div className="truncate text-[11px] text-slate-400">Suivi des incidents SAP</div>
          </div>
        ) : null}
        {!collapsed ? (
          <button type="button" onClick={() => setCollapsed(true)} aria-label="Réduire la sidebar" className="ml-auto rounded-md px-2 py-1.5 text-slate-300 hover:bg-white/10">
            ◂
          </button>
        ) : null}
      </div>
      {groupsBlock}
      {profileBlock}
    </>
  );

  return (
    <>
      <aside className={`fixed left-0 top-0 z-40 hidden h-screen bg-slate-900 lg:block ${collapsed ? "w-16" : "w-52"}`}>
        <div className="flex h-screen flex-col">{sidebarBody}</div>
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange?.(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-slate-900">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-3 pt-6 pb-5">
                <div className="flex items-center gap-2.5 px-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-bold text-white">IBN</div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white">IBN GROUP</div>
                    <div className="text-[11px] text-slate-400">Suivi des incidents SAP</div>
                  </div>
                </div>
                <button type="button" onClick={() => onOpenChange?.(false)} aria-label="Fermer le menu" className="rounded-md px-2 py-2 text-slate-300 hover:bg-white/10">
                  Fermer
                </button>
              </div>
              {groupsBlock}
              {profileBlock}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
