"use client";

import { useMemo } from "react";
import { AlertTriangle, Hourglass, Layers, Users } from "lucide-react";
import type { Issue } from "@/lib/issues";
import { isOpen, ageDays } from "@/lib/issues";
import { Panel } from "./Charts";
import KpiCard from "./KpiCard";
import SectionHeader from "./SectionHeader";
import type { HomeProps } from "./homeProps";

const OVERDUE_AFTER_DAYS = 30;

export default function ManagerHome(props: HomeProps) {
  const { issues, user } = props;

  const open = useMemo(() => issues.filter((i) => isOpen(i)), [issues]);
  const toAssign = useMemo(() => open.filter((i) => !i.assignee), [open]);
  const critical = useMemo(
    () => open.filter((i) => i.priority === "Critical" || i.priority === "High"),
    [open]
  );
  const overdue = useMemo(
    () => open.filter((i) => { const a = ageDays(i); return a !== null && a >= OVERDUE_AFTER_DAYS; }),
    [open]
  );
  const workload = useMemo(() => {
    const m = new Map<string, { name: string; count: number }>();
    for (const i of open) {
      const key = i.assignee || "Non assigné";
      const cur = m.get(key) ?? { name: key, count: 0 };
      cur.count += 1;
      m.set(key, cur);
    }
    return [...m.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [open]);

  const topWorkload = workload[0]?.count ?? 0;

  return (
    <>
      <SectionHeader
        title="Supervision — Manager"
        subtitle={`Vue de supervision de l'équipe ${user.name} : charge, urgences, affectations et retards.`}
        image="/banner/office.jpg"
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Tickets à affecter" value={toAssign.length} sub="Ouverts sans assignation" icon={Layers} color="text-orange-600" />
        <KpiCard label="Critiques / à haut risque" value={critical.length} sub="Ouverts avec priorité élevée" icon={AlertTriangle} color="text-red-600" />
        <KpiCard label="En retard" value={overdue.length} sub={`Ouverts de plus de ${OVERDUE_AFTER_DAYS} jours`} icon={Hourglass} color="text-amber-600" />
        <KpiCard label="Charge max. (agent)" value={topWorkload} sub="Tickets ouverts en cours" icon={Users} color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Tickets à affecter">
          <ul className="space-y-2">
            {toAssign.slice(0, 10).map((i) => (
              <li key={i.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                <span className="font-semibold text-zinc-900">{i.id}</span>
                <span className="min-w-0 flex-1 text-zinc-600">{i.description}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${i.priority === "Critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                  {i.priority}
                </span>
              </li>
            ))}
            {toAssign.length === 0 && <p className="py-6 text-center text-sm text-zinc-400">Aucun ticket à affecter.</p>}
          </ul>
        </Panel>
        <Panel title="Charge de travail par agent">
          <ul className="space-y-2">
            {workload.map((w) => (
              <li key={w.name} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                <span className="font-medium text-zinc-800">{w.name}</span>
                <span className="text-zinc-600">{w.count} ticket(s) ouvert(s)</span>
              </li>
            ))}
            {workload.length === 0 && <p className="py-6 text-center text-sm text-zinc-400">Aucun agent avec des tickets.</p>}
          </ul>
        </Panel>
      </div>

      <Panel title="Performance de l'équipe">
        <AgentPerformance issues={open} />
      </Panel>
    </>
  );
}

function AgentPerformance({ issues }: { issues: Issue[] }) {
  const rows = useMemo(() => {
    const map = new Map<string, { assignee: string; open: number; critical: number; closed: number }>();
    for (const i of issues) {
      const key = i.assignee || "Non assigné";
      const cur = map.get(key) ?? { assignee: key, open: 0, critical: 0, closed: 0 };
      if (isOpen(i)) {
        cur.open += 1;
        if (i.priority === "Critical" || i.priority === "High") cur.critical += 1;
      } else {
        cur.closed += 1;
      }
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.open - a.open);
  }, [issues]);

  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-zinc-400">Aucune donnée d&apos;activité par agent.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 text-left text-xs text-zinc-500">
          <tr>
            <th className="px-3 py-2 font-medium">Agent</th>
            <th className="px-3 py-2 font-medium">En cours</th>
            <th className="px-3 py-2 font-medium">Critiques / à haut risque</th>
            <th className="px-3 py-2 font-medium">Clôturés</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((r) => (
            <tr key={r.assignee} className="hover:bg-zinc-50">
              <td className="px-3 py-2 font-medium text-zinc-900">{r.assignee}</td>
              <td className="px-3 py-2 text-zinc-600">{r.open}</td>
              <td className="px-3 py-2 text-zinc-600">{r.critical}</td>
              <td className="px-3 py-2 text-zinc-600">{r.closed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
