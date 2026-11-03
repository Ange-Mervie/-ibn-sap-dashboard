"use client";

import { useEffect, useState } from "react";

type Report = {
  id: number;
  ticketId: string;
  agentId: string;
  status: string;
  interventionDate: string | null;
  nature: string;
  description: string;
  actions: string;
  result: string;
  advancement: string;
  difficulties: string;
  remaining: string;
  timeSpent: number;
  nextAction: string;
  createdAt: string;
};

type Ticket = { id: string; description: string; status: string; priority: string; assignee: string };

export default function ManagerInterventionsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/tickets", { cache: "no-store" });
      const body = await res.json();
      if (cancelled) return;
      setTickets(body?.tickets ?? []);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    async function loadReports() {
      const r = await fetch(`/api/tickets/${encodeURIComponent(selectedId)}/reports`, { cache: "no-store" });
      const d = await r.json();
      if (cancelled) return;
      setReports(d?.reports ?? []);
    }
    void loadReports();
    return () => { cancelled = true; };
  }, [selectedId]);

  async function decide(reportId: number, decision: "validated" | "rejected") {
    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId: selectedId,
        reportId,
        agentId: reports.find((r) => r.id === reportId)?.agentId ?? "",
        quality: 3,
        deadlineRespect: true,
        solutionRelevance: 3,
        autonomy: 3,
        observations: "",
        decision,
      }),
    });
    if (res.ok) {
      const r2 = await fetch(`/api/tickets/${encodeURIComponent(selectedId)}/reports`, { cache: "no-store" });
      const d2 = await r2.json();
      setReports(d2?.reports ?? []);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body?.error ?? "Échec de la décision.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-zinc-900">Suivi des interventions</h1>
          <p className="mt-1 text-sm text-zinc-500">Comptes rendus d&apos;intervention — validation ou rejet par le manager.</p>
        </div>
        {error ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="mb-4 max-w-md">
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm">
            <option value="">— Choisir un ticket —</option>
            {tickets.map((t) => (
              <option key={t.id} value={t.id}>{t.id} — {t.description.slice(0, 60)}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-600">
              <tr>
                <th className="px-3 py-3 font-semibold">Rapport</th>
                <th className="px-3 py-3 font-semibold">Agent</th>
                <th className="px-3 py-3 font-semibold">Nature</th>
                <th className="px-3 py-3 font-semibold">Temps (min)</th>
                <th className="px-3 py-3 font-semibold">Statut</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {selectedId === "" && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-500">Sélectionnez un ticket pour consulter ses comptes rendus.</td></tr>
              )}
              {selectedId && reports.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-500">Aucun compte rendu pour ce ticket.</td></tr>
              )}
              {reports.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2.5 font-mono text-xs">{r.id}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{r.agentId}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{r.nature}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{r.timeSpent}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{r.status}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => decide(r.id, "validated")} className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700">Valider</button>
                      <button type="button" onClick={() => decide(r.id, "rejected")} className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50">Rejeter</button>
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
