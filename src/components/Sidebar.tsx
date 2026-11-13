"use client";

import { LogOut, ShieldCheck, X } from "lucide-react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  group: string;
};

type SidebarUser = { name: string; email: string; role: string };

export default function Sidebar({
  items,
  active,
  onSelect,
  user,
  onLogout,
  open,
  onOpenChange,
  locale = "fr",
}: {
  items: NavItem[];
  active: string;
  onSelect: (id: string, href: string) => void;
  user: SidebarUser;
  onLogout: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale?: Locale;
}) {
  const groups = [...new Set(items.map((i) => i.group))];
  const initials = (user.name || user.email || "?")
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const roleLabel = t(locale, (`role_${user.role}` as "role_admin"));

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label={t(locale, "closeMenu")}
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[var(--ibn-navy-900)] transition-transform duration-200 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
            <Image src="/IBN Logo.png" alt="IBN Group" width={40} height={40} className="object-contain" priority />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight text-white">IBN Group</p>
            <p className="truncate text-[11px] text-blue-200/60">SAP Incident Tracking</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t(locale, "closeMenu")}
            className="rounded-md p-1.5 text-blue-100/60 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-2 ring-1 ring-inset ring-white/10">
          <ShieldCheck size={14} className="shrink-0 text-blue-300" />
          <span className="truncate text-[11.5px] font-medium text-blue-100/90">{roleLabel}</span>
          <span className="ml-auto shrink-0 rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-200">
            {user.role}
          </span>
        </div>

        <nav className="mt-1 flex-1 overflow-y-auto pb-4">
          {groups.map((g) => (
            <div key={g}>
              <p className="ibn-nav-group">{g}</p>
              {items
                .filter((i) => i.group === g)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelect(item.id, item.href)}
                      data-active={active === item.id}
                      aria-current={active === item.id ? "page" : undefined}
                      className="ibn-nav-link w-full text-left"
                    >
                      <Icon size={16} className="shrink-0 opacity-80" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[11px] font-bold text-blue-100 ring-1 ring-inset ring-white/15">
              {initials || "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-medium text-white">{user.name}</p>
              <p className="truncate text-[10.5px] text-blue-200/50">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label={t(locale, "logout")}
              className="rounded-md p-1.5 text-blue-100/50 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}