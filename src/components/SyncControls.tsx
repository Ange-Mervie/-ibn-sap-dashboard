"use client";

import { useState } from "react";
import Link from "next/link";
import { RefreshCw, Plug } from "lucide-react";
import type { SyncRun, EmailMessage } from "@/db/schema";

export function SyncControls({
  configured,
  lastSync,
  accessToken,
}: {
  configured: boolean;
  lastSync: SyncRun | null;
  accessToken?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function runSync() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      const body = await res.json();
      if (res.status === 503) {
        setMsg(body.detail || "Gmail non configuré : impossible de synchroniser.");
      } else {
        setMsg(`Synchronisation terminée : ${body.fetched ?? 0} message(s) lus, ${body.newMessages ?? 0} candidat(s) ajouté(s).`);
      }
    } catch {
      setMsg("Échec de la synchronisation Gmail.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      data-gmail-status
      className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 className="mb-4 text-lg font-bold">Synchronisation Gmail</h2>
      <div className="flex flex-wrap items-center gap-3">
        {configured ? (
          <a
            href="/api/gmail/auth-url"
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plug size={15} /> Connecter Gmail
          </a>
        ) : (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            Gmail non configuré
          </span>
        )}
        <button
          type="button"
          onClick={runSync}
          disabled={busy || !configured}
          className="flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> {busy ? "Synchronisation…" : "Synchroniser"}
        </button>
        {lastSync && (
          <span className="text-xs text-zinc-500">
            Dernière sync : {lastSync.ranAt ? new Date(lastSync.ranAt).toLocaleString("fr-FR") : "—"} · {lastSync.newMessages} candidat(s) ·{" "}
            {lastSync.outcome}
          </span>
        )}
      </div>
      {msg && <p className="mt-3 text-sm text-zinc-700">{msg}</p>}
      {accessToken && <p className="mt-2 text-xs text-zinc-500">Jeton d&apos;accès présent en base.</p>}
    </section>
  );
}
