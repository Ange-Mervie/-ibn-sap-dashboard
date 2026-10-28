"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, AlertTriangle } from "lucide-react";
import { STATUSES, PRIORITIES, MODULES } from "@/lib/issues";

const PAYMENTS = ["PAID", "INVOICED", "NOT INVOICED"];

const field =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none";
const label = "mb-1 block text-sm font-medium text-zinc-700";

export default function TicketForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    description: "",
    status: "Not Started",
    priority: "Medium",
    module: "",
    raisedBy: "",
    email: "",
    assignee: "",
    openDate: "",
    closeDate: "",
    payment: "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (res.status === 201 && body.ticket?.id) {
        router.push(`/tickets/${encodeURIComponent(body.ticket.id)}`);
        router.refresh();
        return;
      }
      setErrors(
        Array.isArray(body.errors) && body.errors.length
          ? body.errors
          : [body.error || `Erreur ${res.status} : enregistrement impossible.`]
      );
    } catch {
      setErrors(["Impossible de contacter le serveur. Réessayez."]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form data-ticket-form onSubmit={submit} className="mt-5 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      {errors.length > 0 && (
        <div data-create-error className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <ul className="list-inside list-disc space-y-0.5">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label className={label} htmlFor="description">Description *</label>
        <textarea
          id="description"
          rows={4}
          className={field}
          value={form.description}
          onChange={(e) => set("description")(e.target.value)}
          placeholder="Objet et détails de l'incident…"
          required
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="status">Statut</label>
          <select id="status" className={field} value={form.status} onChange={(e) => set("status")(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="priority">Priorité</label>
          <select id="priority" className={field} value={form.priority} onChange={(e) => set("priority")(e.target.value)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="module">Module SAP</label>
          <select id="module" className={field} value={form.module} onChange={(e) => set("module")(e.target.value)}>
            <option value="">— Non renseigné —</option>
            {MODULES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="payment">Statut de paiement</label>
          <select id="payment" className={field} value={form.payment} onChange={(e) => set("payment")(e.target.value)}>
            <option value="">— Non renseigné —</option>
            {PAYMENTS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="raisedBy">Demandeur *</label>
          <input
            id="raisedBy"
            className={field}
            value={form.raisedBy}
            onChange={(e) => set("raisedBy")(e.target.value)}
            placeholder="Nom du demandeur"
            required
          />
        </div>
        <div>
          <label className={label} htmlFor="email">E-mail du demandeur</label>
          <input
            id="email"
            type="email"
            className={field}
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
            placeholder="prenom.nom@exemple.com"
          />
        </div>
        <div>
          <label className={label} htmlFor="assignee">Responsable</label>
          <input
            id="assignee"
            className={field}
            value={form.assignee}
            onChange={(e) => set("assignee")(e.target.value)}
            placeholder="Nom du responsable"
          />
        </div>
        <div>
          <label className={label} htmlFor="openDate">Date d&apos;ouverture</label>
          <input
            id="openDate"
            type="date"
            className={field}
            value={form.openDate}
            onChange={(e) => set("openDate")(e.target.value)}
          />
        </div>
        <div>
          <label className={label} htmlFor="closeDate">Date de clôture</label>
          <input
            id="closeDate"
            type="date"
            className={field}
            value={form.closeDate}
            onChange={(e) => set("closeDate")(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          <Send size={15} /> {saving ? "Enregistrement…" : "Créer le ticket"}
        </button>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          <ArrowLeft size={15} /> Retour au tableau de bord
        </Link>
      </div>
    </form>
  );
}
