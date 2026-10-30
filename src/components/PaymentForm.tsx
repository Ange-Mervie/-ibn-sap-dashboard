"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentForm({ ticketId, agentId }: { ticketId: string; agentId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("to_pay");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      ticketId,
      agentId,
      nature: String(fd.get("nature") || ""),
      amountPlanned: Number(fd.get("amountPlanned") || 0),
      amountPaid: Number(fd.get("amountPaid") || 0),
      interventionDate: String(fd.get("interventionDate") || ""),
      paymentStatus: String(fd.get("paymentStatus") || "to_pay"),
      paymentDate: String(fd.get("paymentDate") || ""),
      paymentMode: String(fd.get("paymentMode") || ""),
      transactionRef: String(fd.get("transactionRef") || ""),
      proof: String(fd.get("proof") || ""),
      comment: String(fd.get("comment") || ""),
    };
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setPaymentStatus(String(fd.get("paymentStatus") || "to_pay"));
        setDone(true);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erreur lors de l'enregistrement du paiement.");
      }
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" data-payment-success>
        Paiement enregistré (statut : {paymentStatus}).
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-payment-form>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="nature" className="mb-2 block text-sm font-medium">Nature du travail</label>
          <input id="nature" name="nature" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="amountPlanned" className="mb-2 block text-sm font-medium">Montant prévu</label>
          <input id="amountPlanned" name="amountPlanned" type="number" min={0} defaultValue={0} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="amountPaid" className="mb-2 block text-sm font-medium">Montant déjà payé</label>
          <input id="amountPaid" name="amountPaid" type="number" min={0} defaultValue={0} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="paymentStatus" className="mb-2 block text-sm font-medium">Statut du paiement</label>
          <select id="paymentStatus" name="paymentStatus" defaultValue="to_pay" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="not_billable">Non facturable</option>
            <option value="to_pay">À payer</option>
            <option value="pending">En attente de paiement</option>
            <option value="partial">Partiellement payé</option>
            <option value="paid">Payé</option>
          </select>
        </div>
        <div>
          <label htmlFor="interventionDate" className="mb-2 block text-sm font-medium">Date d&apos;intervention</label>
          <input id="interventionDate" name="interventionDate" type="date" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="paymentDate" className="mb-2 block text-sm font-medium">Date de paiement</label>
          <input id="paymentDate" name="paymentDate" type="date" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="paymentMode" className="mb-2 block text-sm font-medium">Mode de paiement</label>
          <input id="paymentMode" name="paymentMode" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="transactionRef" className="mb-2 block text-sm font-medium">Référence de transaction</label>
          <input id="transactionRef" name="transactionRef" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label htmlFor="proof" className="mb-2 block text-sm font-medium">Justificatif</label>
        <textarea id="proof" name="proof" rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm" />
      </div>

      <div>
        <label htmlFor="comment" className="mb-2 block text-sm font-medium">Commentaire</label>
        <textarea id="comment" name="comment" rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm" />
      </div>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50">
        {saving ? "Enregistrement…" : "Enregistrer le paiement"}
      </button>
    </form>
  );
}

