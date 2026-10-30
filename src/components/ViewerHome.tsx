"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock, Layers } from "lucide-react";
import { isOpen, countBy } from "@/lib/issues";
import { Panel } from "./Charts";
import KpiCard from "./KpiCard";
import SectionHeader from "./SectionHeader";
import type { HomeProps } from "./homeProps";

export default function ViewerHome(props: HomeProps) {
  const { issues, user } = props;

  const open = useMemo(() => issues.filter((i) => isOpen(i)), [issues]);
  const closed = useMemo(() => issues.filter((i) => !isOpen(i)), [issues]);
  const critical = useMemo(
    () => open.filter((i) => i.priority === "Critical" || i.priority === "High"),
    [open]
  );
  const byStatus = useMemo(() => countBy(issues, "status"), [issues]);
  const byPriority = useMemo(() => countBy(issues, "priority"), [issues]);

  const monthly = useMemo(() => {
    const m = new Map<string, { month: string; ouverts: number; clotures: number }>();
    const key = (iso: string) => iso.slice(0, 7);
    for (const i of issues) {
      if (i.openDate) {
        const k = key(i.openDate);
        const cur = m.get(k) ?? { month: k, ouverts: 0, clotures: 0 };
        cur.ouverts += 1;
        m.set(k, cur);
      }
      if (i.closeDate) {
        const k = key(i.closeDate);
        const cur = m.get(k) ?? { month: k, ouverts: 0, clotures: 0 };
        cur.clotures += 1;
        m.set(k, cur);
      }
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ month: k, ouverts: v.ouverts, clotures: v.clotures }));
  }, [issues]);

  return (
    <>
      <SectionHeader
        title="Consultation — Vue globale des incidents"
        subtitle={`Consultation des incidents autorisés pour le rôle ${user.role}. Aucune action de modification.`}
        image="/banner/office.jpg"
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Incidents consultés" value={issues.length} sub="Tickets visibles dans le périmètre" icon={Layers} color="text-blue-600" />
        <KpiCard label="Ouverts" value={open.length} sub="Statuts non clôturés" icon={Clock} color="text-orange-600" />
        <KpiCard label="Critiques" value={critical.length} sub="Critical / High" icon={AlertTriangle} color="text-red-600" />
        <KpiCard label="Résolus" value={closed.length} sub="Statut Closed" icon={CheckCircle2} color="text-green-600" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Répartition par statut">
          <ul className="space-y-2">
            {byStatus.map((r) => (
              <li key={r.name} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                <span className="text-zinc-700">{r.name}</span>
                <span className="font-semibold text-zinc-900">{r.value}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Répartition par priorité">
          <ul className="space-y-2">
            {byPriority.map((r) => (
              <li key={r.name} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                <span className="text-zinc-700">{r.name}</span>
                <span className="font-semibold text-zinc-900">{r.value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Évolution mensuelle (ouverts vs clôturés)">
        {monthly.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">Aucune donnée de période.</p>
        ) : (
          <ul className="space-y-2">
            {monthly.map((m) => (
              <li key={m.month} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                <span className="font-medium text-zinc-800">{m.month}</span>
                <span className="text-zinc-600">{m.ouverts} ouvert(s) · {m.clotures} clôturé(s)</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
