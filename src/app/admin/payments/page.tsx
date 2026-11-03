import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { workPayments, tickets } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { canReadPayments } from "@/lib/access";
import { redirect } from "next/navigation";
import { PAYMENT_STATUSES } from "@/db/schema";

export const instant = false;

function labelPaiement(p: string): string {
  switch (p) {
    case "paid":
      return "Payé";
    case "partial":
      return "Partiellement payé";
    case "pending":
      return "En attente";
    case "to_pay":
      return "À payer";
    case "not_billable":
      return "Non facturable";
    default:
      return p;
  }
}

export default async function AdminPaymentsPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=%2Fadmin%2Fpayments");
  if (!canReadPayments(session.role, "", session.email)) redirect("/login?from=%2Fadmin%2Fpayments");

  const payments = await db.select().from(workPayments).orderBy(desc(workPayments.createdAt));

  const ticketIds = Array.from(new Set(payments.map((p) => p.ticketId)));
  const ticketRows =
    ticketIds.length > 0
      ? await db.select().from(tickets).where(inArray(tickets.id, ticketIds))
      : [];
  const ticketById = new Map<string, (typeof tickets.$inferSelect)>();
  for (const t of ticketRows) ticketById.set(t.id, t);

  const validated = payments.filter((p) => p.validationStatus === "validated");
  const totalDue = payments.reduce((s, p) => s + (p.amountPlanned || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + (p.amountPaid || 0), 0);
  const totalRemaining = payments.reduce((s, p) => s + (p.balance || 0), 0);
  const paidCount = payments.filter((p) => p.paymentStatus === "paid").length;
  const partialCount = payments.filter((p) => p.paymentStatus === "partial").length;
  const pendingCount = payments.filter((p) => p.paymentStatus === "to_pay" || p.paymentStatus === "pending").length;
  const notValidatedCount = payments.filter((p) => p.validationStatus !== "validated").length;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-zinc-900">Paiements</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Suivi global des rémunérations des interventions validées — {payments.length} enregistrement(s).
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Interventions validées</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{validated.length}</p>
            <p className="mt-1 text-xs text-zinc-400">{notValidatedCount} en attente de validation</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Montant total dû</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{totalDue}</p>
            <p className="mt-1 text-xs text-zinc-400">Unité : heure / intervention</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Montant total payé</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{totalPaid}</p>
            <p className="mt-1 text-xs text-zinc-400">{paidCount} intervention(s) payée(s)</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Montant restant à payer</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{totalRemaining}</p>
            <p className="mt-1 text-xs text-zinc-400">{partialCount} partiellement payée(s)</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-600">
              <tr>
                <th className="px-3 py-3 font-semibold">Ticket</th>
                <th className="px-3 py-3 font-semibold">Agent</th>
                <th className="px-3 py-3 font-semibold">Nature / intervention</th>
                <th className="px-3 py-3 font-semibold">Montant dû</th>
                <th className="px-3 py-3 font-semibold">Montant payé</th>
                <th className="px-3 py-3 font-semibold">Solde</th>
                <th className="px-3 py-3 font-semibold">Statut paiement</th>
                <th className="px-3 py-3 font-semibold">Date paiement</th>
                <th className="px-3 py-3 font-semibold">État</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {payments.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-zinc-500">
                    Aucune intervention enregistrée pour le moment — les paiements apparaîtront après validation.
                  </td>
                </tr>
              )}
              {payments.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2.5 font-mono text-xs">{p.ticketId}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{p.agentId}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{p.nature || "—"}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{p.amountPlanned ?? 0}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{p.amountPaid ?? 0}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{p.balance ?? 0}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{labelPaiement(String(p.paymentStatus))}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{p.paymentDate ? new Date(p.paymentDate).toISOString().slice(0, 10) : "—"}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{p.validationStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-zinc-400">
          Statuts de paiement : {PAYMENT_STATUSES.join(", ")} · Les montants non renseignés affichent « À configurer ».
        </p>
      </div>
    </div>
  );
}
