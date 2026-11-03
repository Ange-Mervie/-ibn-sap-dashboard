"use client";

import { useEffect, useState } from "react";

type Agent = { id: number; name: string; email: string; role: string; active: boolean };
type Ticket = {
  id: string;
  description: string;
  status: string;
  priority: string;
  module: string;
  raisedBy: string;
  openDate: string;
  closeDate: string;
  assignee: string;
};

export default function ManagerAssignationPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const [aRes, tRes] = await Promise.all([
          fetch("/api/agents", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/tickets", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (cancelled) return;
        setAgents(aRes?.agents ?? []);
        setTickets(tRes?.tickets ?? []);
      } catch {
        if (!cancelled) setError("Impossible de charger les données de l'assignation.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  async function assign(ticketId: string) {
    const agentId = selectedAgent[ticketId];
    if (!agentId) return;
    setSaving(ticketId);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee: agentId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Échec de l'affectation.");
      }
      const aRes = await fetch("/api/agents", { cache: "no-store" });
      const tRes = await fetch("/api/tickets", { cache: "no-store" });
      setAgents((await aRes.json())?.agents ?? []);
      setTickets((await tRes.json())?.tickets ?? []);
    } catch {
      setError("Échec de l'affectation.");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="mx-auto max-w-[1500px] px-4 py-6">
          <p className="py-10 text-center text-sm text-zinc-400">Chargement des tickets…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-zinc-900">Affectation des tickets</h1>
          <p className="mt-1 text-sm text-zinc-500">Tickets en attente ou déjà affectés — sélectionnez un agent pour affecter.</p>
        </div>
        {error ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-600">
              <tr>
                <th className="px-3 py-3 font-semibold">Référence</th>
                <th className="px-3 py-3 font-semibold">Objet</th>
                <th className="px-3 py-3 font-semibold">Priorité</th>
                <th className="px-3 py-3 font-semibold">Statut</th>
                <th className="px-3 py-3 font-semibold">Date d&apos;ouverture</th>
                <th className="px-3 py-3 font-semibold">Agent affecté</th>
                <th className="px-3 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {tickets.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-500">Aucun ticket.</td></tr>
              )}
              {tickets.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-3 py-2.5 font-mono text-xs">{t.id}</td>
                  <td className="max-w-[260px] truncate px-3 py-2.5" title={t.description}>{t.description}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{t.priority}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{t.status}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{t.openDate || "—"}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{t.assignee || "Non affecté"}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedAgent[t.id] ?? t.assignee ?? ""}
                        onChange={(e) => setSelectedAgent((s) => ({ ...s, [t.id]: e.target.value }))}
                        className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                      >
                        <option value="">{t.assignee ? "Changer d&apos;agent…" : "Choisir un agent…"}</option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.email}>{a.name} ({a.email})</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => assign(t.id)}
                        disabled={!selectedAgent[t.id] || saving === t.id}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {saving === t.id ? "Affectation…" : "Affecter"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
