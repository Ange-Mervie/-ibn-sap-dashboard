"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { t, type Locale } from "@/lib/i18n";

type SessionUser = { name: string; email: string; role: string };

export default function SessionControls({ user, locale = "fr" }: { user: SessionUser; locale?: Locale }) {
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
      setError(cause instanceof Error ? cause.message : (locale === "fr" ? "Impossible de se déconnecter." : "Unable to sign out."));
    } finally {
      setBusy(false);
    }
  }

  const roleLabel = t(locale, (`role_${user.role}` as "role_admin"));

  return (
    <div className="flex flex-wrap items-center gap-3">
      <LanguageSwitcher locale={locale} />
      <div className="text-right">
        <p className="text-sm font-semibold text-zinc-800">{user.name}</p>
        <p className="text-xs text-zinc-500">{roleLabel} · {user.email}</p>
      </div>
      <button type="button" onClick={logout} disabled={busy} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">
        {busy ? t(locale, "loggingOut") : t(locale, "logout")}
      </button>
      {error && <span role="alert" className="w-full text-right text-xs text-red-600">{error}</span>}
    </div>
  );
}
