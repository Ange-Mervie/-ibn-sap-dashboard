"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DECISIONS = [
  { value: "validated", label: "Travail validé" },
  { value: "to_correct", label: "Travail à corriger" },
  { value: "rejected", label: "Travail rejeté" },
];

export default function EvaluationForm({ ticketId, reportId, agentId }: { ticketId: string; reportId: string; agentId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [decision, setDecision] = useState("validated");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      ticketId,
      reportId,
      agentId,
      quality: Number(fd.get("quality") || 3),
      deadlineRespect: fd.get("deadlineRespect") === "true",
      solutionRelevance: Number(fd.get("solutionRelevance") || 3),
      autonomy: Number(fd.get("autonomy") || 3),
      observations: String(fd.get("observations") || ""),
      decision: String(fd.get("decision") || "validated"),
    };
    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setDecision(String(fd.get("decision") || "validated"));
        setDone(true);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erreur lors de l'enregistrement de l'évaluation.");
      }
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" data-evaluation-success>
        Évaluation enregistrée — décision : {decision}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-evaluation-form>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="quality" className="mb-2 block text-sm font-medium">Qualité du travail (1-5)</label>
          <select id="quality" name="quality" defaultValue={3} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="deadlineRespect" className="mb-2 block text-sm font-medium">Respect des délais</label>
          <select id="deadlineRespect" name="deadlineRespect" defaultValue="true" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="true">Respecté</option>
            <option value="false">Non respecté</option>
          </select>
        </div>
        <div>
          <label htmlFor="solutionRelevance" className="mb-2 block text-sm font-medium">Pertinence de la solution (1-5)</label>
          <select id="solutionRelevance" name="solutionRelevance" defaultValue={3} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="autonomy" className="mb-2 block text-sm font-medium">Niveau d&apos;autonomie (1-5)</label>
          <select id="autonomy" name="autonomy" defaultValue={3} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="observations" className="mb-2 block text-sm font-medium">Observations</label>
        <textarea id="observations" name="observations" rows={3} maxLength={5000} className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm" />
      </div>

      <div>
        <label htmlFor="decision" className="mb-2 block text-sm font-medium">Décision</label>
        <select id="decision" name="decision" defaultValue="validated" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          {DECISIONS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50">
        {saving ? "Enregistrement…" : "Enregistrer l&apos;évaluation"}
      </button>
    </form>
  );
}

