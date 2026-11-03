import { loadIssueDataFromDb } from "@/lib/loadDb";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { issueAlerts, daysLate, dueDate } from "@/lib/sla";

export const instant = false;

export default async function ManagerRetardsPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=%2Fmanager%2Fretards");

  const data = await loadIssueDataFromDb({ role: session.role, email: session.email });
  const alerts = issueAlerts(data.issues);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-zinc-900">Retards et alertes</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Tickets ouverts hors SLA — {alerts.late.length} retardataire(s) · {alerts.criticalLate} critique(s) en retard.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-600">
              <tr>
                <th className="px-3 py-3 font-semibold">Référence</th>
                <th className="px-3 py-3 font-semibold">Objet</th>
                <th className="px-3 py-3 font-semibold">Agent responsable</th>
                <th className="px-3 py-3 font-semibold">Date d&apos;ouverture</th>
                <th className="px-3 py-3 font-semibold">Jours de retard</th>
                <th className="px-3 py-3 font-semibold">Échéance SLA</th>
                <th className="px-3 py-3 font-semibold">Priorité</th>
                <th className="px-3 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {alerts.late.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-zinc-500">Aucun ticket en retard.</td>
                </tr>
              )}
              {alerts.late.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-3 py-2.5 font-mono text-xs">{t.id}</td>
                  <td className="max-w-[260px] truncate px-3 py-2.5" title={t.description}>{t.description}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{t.assignee || "Non affecté"}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{t.openDate || "—"}</td>
                  <td className="px-3 py-2.5 font-semibold text-red-700">{daysLate(t)}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{dueDate(t) || "—"}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{t.priority}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
