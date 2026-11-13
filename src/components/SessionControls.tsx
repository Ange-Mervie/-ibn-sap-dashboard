"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { t, type Locale } from "@/lib/i18n";

type SessionUser = { name: string; email: string; role: string };

export default function SessionControls({
  user,
  locale = "fr",
}: {
  user: SessionUser;
  locale?: Locale;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error(locale === "fr" ? "La déconnexion n’a pas abouti. Réessayez." : "Sign out failed. Please try again.");
      router.replace("/login");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : locale === "fr" ? "Impossible de se déconnecter." : "Unable to sign out.");
    } finally {
      setBusy(false);
    }
  }

  const roleLabel = t(locale, (`role_${user.role}` as "role_admin"));
  const initials = (user.name || user.email || "?")
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex items-center gap-1.5">
      <div className="hidden sm:block">
        <LanguageSwitcher locale={locale} />
      </div>
      <div className="mx-1 hidden h-6 w-px bg-[var(--ibn-border)] sm:block" />
      <div className="hidden items-center gap-2 rounded-lg py-1 pl-1 pr-2 sm:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ibn-navy-900)] text-[10px] font-bold text-white">
          {initials || "?"}
        </span>
        <span className="hidden leading-tight lg:block">
          <span className="block max-w-[140px] truncate text-[12px] font-semibold text-[var(--ibn-text-strong)]">{user.name}</span>
          <span className="block text-[10.5px] text-[var(--ibn-text-muted)]">{roleLabel}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        aria-label={t(locale, "logout")}
        title={t(locale, "logout")}
        className="ibn-btn ibn-btn-ghost px-2"
      >
        <LogOut size={15} />
      </button>
      {error && (
        <span role="alert" className="w-full text-right text-[11px] text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}