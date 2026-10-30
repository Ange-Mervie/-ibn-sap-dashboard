"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReportForm({ ticketId, agentEmail }: { ticketId: string; agentEmail: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      interventionDate: String(fd.get("interventionDate") ?? ""),
      nature: String(fd.get("nature") ?? ""),
      description: String(fd.get("description") ?? ""),
      actions: String(fd.get("actions") ?? ""),
      result: String(fd.get("result") ?? ""),
      advancement: String(fd.get("advancement") ?? ""),
      difficulties: String(fd.get("difficulties") ?? ""),
      remaining: String(fd.get("remaining") ?? ""),
      timeSpent: Number(fd.get("timeSpent") || 0),
      nextAction: String(fd.get("nextAction") ?? ""),
      status: "submitted",
      agentId: agentEmail,
    };
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erreur lors de l'enregistrement du compte rendu.");
      }
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" data-report-success>
        Compte rendu d&apos;intervention enregistré et soumis au manager pour validation.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-report-form>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="interventionDate" className="mb-2 block text-sm font-medium">Date de l&apos;intervention *</label>
          <input id="interventionDate" name="interventionDate" type="date" required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="nature" className="mb-2 block text-sm font-medium">Nature du travail *</label>
          <input id="nature" name="nature" required maxLength={255} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="timeSpent" className="mb-2 block text-sm font-medium">Temps passé (minutes)</label>
          <input id="timeSpent" name="timeSpent" type="number" min={0} defaultValue={0} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="advancement" className="mb-2 block text-sm font-medium">État d&apos;avancement *</label>
          <input id="advancement" name="advancement" required maxLength={100} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium">Description détaillée du travail réalisé *</label>
        <textarea id="description" name="description" required rows={4} maxLength={10000} className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm" />
      </div>

      <div>
        <label htmlFor="actions" className="mb-2 block text-sm font-medium">Actions effectuées *</label>
        <textarea id="actions" name="actions" required rows={3} maxLength={10000} className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm" />
      </div>

      <div>
        <label htmlFor="result" className="mb-2 block text-sm font-medium">Résultat obtenu *</label>
        <textarea id="result" name="result" required rows={3} maxLength={10000} className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm" />
      </div>

      <div>
        <label htmlFor="difficulties" className="mb-2 block text-sm font-medium">Difficultés rencontrées</label>
        <textarea id="difficulties" name="difficulties" rows={2} maxLength={5000} className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm" />
      </div>

      <div>
        <label htmlFor="remaining" className="mb-2 block text-sm font-medium">Travail restant à effectuer *</label>
        <textarea id="remaining" name="remaining" required rows={3} maxLength={10000} className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm" />
      </div>

      <div>
        <label htmlFor="nextAction" className="mb-2 block text-sm font-medium">Prochaine action prévue *</label>
        <input id="nextAction" name="nextAction" required maxLength={255} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      </div>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50">
        {saving ? "Enregistrement…" : "Soumettre le compte rendu"}
      </button>
    </form>
  );
}
