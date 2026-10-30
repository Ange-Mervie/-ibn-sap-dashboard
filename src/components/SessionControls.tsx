"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SessionUser = { name: string; email: string; role: string };

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  manager: "Manager",
  agent: "Agent",
  viewer: "Observateur",
};

export default function SessionControls({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("La déconnexion n’a pas abouti. Réessayez.");
      router.replace("/login");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de se déconnecter.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-semibold text-zinc-800">{user.name}</p>
        <p className="text-xs text-zinc-500">{ROLE_LABELS[user.role] ?? user.role} · {user.email}</p>
      </div>
      <button type="button" onClick={logout} disabled={busy} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">
        {busy ? "Déconnexion…" : "Se déconnecter"}
      </button>
      {error && <span role="alert" className="w-full text-right text-xs text-red-600">{error}</span>}
    </div>
  );
}
