import { loadIssueDataFromDb } from "@/lib/loadDb";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isOpen, countBy } from "@/lib/issues";
import KpiCard from "@/components/KpiCard";
import { Layers, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export const instant = false;

export default async function AdminReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=%2Fadmin%2Freports");

  const data = await loadIssueDataFromDb({ role: session.role, email: session.email });
  const issues = data.issues;
  const open = issues.filter((i) => isOpen(i));
  const closed = issues.filter((i) => !isOpen(i));
  const critical = open.filter((i) => i.priority === "Critical" || i.priority === "High");
  const byStatus = countBy(issues, "status");
  const byPriority = countBy(issues, "priority");
  const byModule = countBy(issues, "module");

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-zinc-900">Rapports & analyses</h1>
          <p className="mt-1 text-sm text-zinc-500">Synthèse des incidents SAP à partir des données réelles de la base.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Tickets consultés" value={issues.length} sub="Tickets visibles dans le périmètre" icon={<Layers size={15} />} color="text-blue-600" />
          <KpiCard label="Ouverts" value={open.length} sub="Statuts non clôturés" icon={<Clock size={15} />} color="text-orange-600" />
          <KpiCard label="Critiques / à haut risque" value={critical.length} sub="Critical / High" icon={<AlertTriangle size={15} />} color="text-red-600" />
          <KpiCard label="Clôturés" value={closed.length} sub="Statuts Closed" icon={<CheckCircle2 size={15} />} color="text-green-600" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-700">Répartition par statut</h2>
            <ul className="mt-3 space-y-2">
              {byStatus.map((r) => (
                <li key={r.name} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                  <span className="text-zinc-700">{r.name}</span>
                  <span className="font-semibold text-zinc-900">{r.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-700">Répartition par priorité</h2>
            <ul className="mt-3 space-y-2">
              {byPriority.map((r) => (
                <li key={r.name} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                  <span className="text-zinc-700">{r.name}</span>
                  <span className="font-semibold text-zinc-900">{r.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-700">Répartition par module SAP</h2>
          <ul className="mt-3 space-y-2">
            {byModule.map((r) => (
              <li key={r.name} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                <span className="text-zinc-700">{r.name}</span>
                <span className="font-semibold text-zinc-900">{r.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
