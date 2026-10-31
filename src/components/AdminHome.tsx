"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock, Hourglass, Layers } from "lucide-react";
import type { Issue, Filters, DimKey, IssueData } from "@/lib/issues";
import { isOpen, ageDays, resolutionDays, countBy, STATUSES, PRIORITIES } from "@/lib/issues";
import { Panel, ChartBox, StatusPie, CountBars, HorizontalBars, TimelineBars, PRIORITY_COLORS } from "./Charts";
import KpiCard from "./KpiCard";
import IssueTable from "./IssueTable";
import { monthlyTimeline } from "./Overview";
import type { HomeProps } from "./homeProps";

export default function AdminHome(props: HomeProps) {
  const { issues, total, charts, filters, onToggle, onToggleMonth, onReset } = props;

  const stats = useMemo(() => {
    const closed = issues.filter((i) => !isOpen(i));
    const open = issues.filter((i) => isOpen(i));
    const urgent = open.filter((i) => i.priority === "Critical" || i.priority === "High");
    const waiting = open.filter(
      (i) => isOpen(i) && ["Blocked", "On Hold", "waiting for Customer"].includes(i.status)
    );
    const delays = issues.map(resolutionDays).filter((x): x is number => x !== null);
    const avg = delays.length ? delays.reduce((a, b) => a + b, 0) / delays.length : null;
    const overdue = open.filter((i) => {
      const a = ageDays(i);
      return a !== null && a >= 30;
    });
    return { closed, open, urgent, waiting, delays, avg, overdue };
  }, [issues]);

  const timeline = useMemo(() => monthlyTimeline(issues), [issues]);

  const recent = useMemo(() => {
    const list = [...issues];
    const key = (i: Issue) => i.closeDate || i.openDate || "";
    list.sort((a, b) => key(b).localeCompare(key(a)));
    return list.slice(0, 8);
  }, [issues]);

  const recentTable = useMemo(() => {
    const list = [...issues];
    list.sort((a, b) => (b.openDate || "").localeCompare(a.openDate || ""));
    return list.slice(0, 10);
  }, [issues]);

  return (
    <>
      {/* KPI — une seule ligne */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Total tickets" value={issues.length} sub={issues.length === total ? "Tous les tickets" : `sur ${total} au total`} icon={Layers} color="text-zinc-900" />
        <KpiCard label="Clôturés" value={stats.closed.length} sub="Statut Closed" icon={CheckCircle2} color="text-green-600" />
        <KpiCard label="Ouverts" value={stats.open.length} sub="Tous statuts non clôturés" icon={Clock} color="text-blue-600" />
        <KpiCard label="Critical + High" value={issues.filter((i) => i.priority === "Critical" || i.priority === "High").length} sub="Priorités critiques et haute criticité" icon={AlertTriangle} color="text-red-600" />
      </div>

      {/* Graphiques — grille cohérente */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Répartition par statut (cliquez pour filtrer)">
          <ChartBox id="status" data={countBy(charts.status, "status")}>
            <StatusPie data={countBy(charts.status, "status")} active={filters.status} onSelect={onToggle} />
          </ChartBox>
        </Panel>
        <Panel title="Tickets par priorité (cliquez pour filtrer)">
          <ChartBox id="priority" data={countBy(charts.priority, "priority")}>
            <CountBars
              data={countBy(charts.priority, "priority")}
              color={(n) => PRIORITY_COLORS[n] || "#94a3b8"}
              order={[...PRIORITIES]}
              dim="priority"
              active={filters.priority}
              onSelect={onToggle}
            />
          </ChartBox>
        </Panel>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Incidents par module SAP (cliquez pour filtrer)">
          <ChartBox id="module" data={countBy(charts.module, "module")}>
            <HorizontalBars data={countBy(charts.module, "module")} color="#2563eb" dim="module" active={filters.module} onSelect={onToggle} />
          </ChartBox>
        </Panel>
        <Panel title="Évolution mensuelle : ouverts vs clôturés (cliquez un mois pour filtrer)">
          <ChartBox id="timeline" data={timeline.map((t) => ({ name: t.month, value: t.ouverts }))} emptyMsg="Aucune donnée de date pour ces filtres.">
            <TimelineBars data={timeline} active={{ from: filters.from, to: filters.to }} onSelectMonth={onToggleMonth} />
          </ChartBox>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Tableau des incidents récents */}
        <Panel title="Incidents récents">
          <div className="table-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">N°</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Priorité</th>
                  <th className="px-3 py-2 font-medium">Statut</th>
                  <th className="px-3 py-2 font-medium">Module</th>
                  <th className="px-3 py-2 font-medium">Ouvert le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentTable.map((i) => (
                  <tr key={i.id} className="hover:bg-zinc-50">
                    <td className="px-3 py-2 font-mono text-xs">{i.id}</td>
                    <td className="max-w-xs truncate px-3 py-2" title={i.description}>{i.description}</td>
                    <td className="px-3 py-2">
                      <span className="font-medium" style={{ color: PRIORITY_COLORS[i.priority] }}>{i.priority}</span>
                    </td>
                    <td className="px-3 py-2 text-zinc-600">{i.status}</td>
                    <td className="px-3 py-2 text-zinc-600">{i.module || "—"}</td>
                    <td className="px-3 py-2 text-zinc-600">{i.openDate || "Information absente"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Activités récentes */}
        <Panel title="Dernières activités">
          <ul className="space-y-2">
            {recent.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                <span className="font-semibold text-zinc-900">{i.id}</span>
                <span className="min-w-0 flex-1 text-zinc-600">{i.description}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${i.priority === "Critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                  {i.priority}
                </span>
                <span className="text-xs text-zinc-500">{i.status}</span>
                <span className="text-xs text-zinc-500">{i.module || "—"}</span>
              </li>
            ))}
            {recent.length === 0 && <p className="py-6 text-center text-sm text-zinc-400">Aucune activité récente.</p>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
