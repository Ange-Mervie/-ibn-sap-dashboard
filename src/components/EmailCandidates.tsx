"use client";

import { useState } from "react";
import Link from "next/link";
import { Ban, Link2, PlusCircle } from "lucide-react";
import type { EmailMessage } from "@/db/schema";

export function EmailCandidates({
  messages,
  onCreated,
  canCreateTicket = true,
}: {
  messages: EmailMessage[];
  onCreated?: (ticketId: string) => void;
  canCreateTicket?: boolean;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function createTicket(m: EmailMessage) {
    setBusyId(m.gmailMessageId);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: m.subject || "Incident signalé par e-mail",
          status: "Not Started",
          priority: "Medium",
          module: "",
          raisedBy: m.sender || "Inconnu",
          email: m.sender || "",
          openDate: m.receivedAt instanceof Date ? m.receivedAt.toISOString().slice(0, 10) : String(m.receivedAt ?? "").slice(0, 10),
          source: "email",
        }),
      });
      const body = await res.json();
      if (res.status === 201 && body.ticket?.id) {
        setBusyId(null);
        onCreated?.(body.ticket.id);
      } else {
        setBusyId(null);
      }
    } catch {
      setBusyId(null);
    }
  }

  async function ignore(m: EmailMessage) {
    setBusyId(m.gmailMessageId);
    await fetch("/api/gmail/staging", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gmailMessageId: m.gmailMessageId, action: "ignored" }),
    });
    setBusyId(null);
  }

  if (messages.length === 0) {
    return (
      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-bold">Candidats à traiter</h2>
        <p className="text-sm text-zinc-500">
          Aucun candidat en attente. Lancez une synchronisation Gmail pour récolter les messages.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-lg font-bold">Candidats à traiter</h2>
      <div className="space-y-3">
        {messages.map((m) => (
          <article key={m.gmailMessageId} className="rounded-lg border border-zinc-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{m.subject || "(sans objet)"}</p>
                <p className="text-sm text-zinc-500">{m.sender}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{m.gmailMessageId}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-600">{m.bodySnippet}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {canCreateTicket && <button
                type="button"
                disabled={busyId === m.gmailMessageId}
                onClick={() => createTicket(m)}
                className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                <PlusCircle size={13} /> Créer le ticket
              </button>}
              <button
                type="button"
                disabled={busyId === m.gmailMessageId}
                onClick={() => ignore(m)}
                className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
              >
                <Ban size={13} /> Ignorer
              </button>
              <Link
                href={`/tickets/${encodeURIComponent(m.gmailThreadId)}`}
                className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              >
                <Link2 size={13} /> Ouvrir le thread
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
