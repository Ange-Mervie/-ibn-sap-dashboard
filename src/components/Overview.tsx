"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock, Layers, Hourglass, Timer } from "lucide-react";
import type { Issue, Filters, DimKey } from "@/lib/issues";
import { isOpen, ageDays, resolutionDays, countBy, STATUSES, PRIORITIES } from "@/lib/issues";
import { Panel, ChartBox, StatusPie, CountBars, HorizontalBars, TimelineBars, PRIORITY_COLORS } from "./Charts";
import SectionHeader from "./SectionHeader";

// ---------- carte KPI ----------
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        <Icon size={16} className={color} />
      </div>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-[11px] text-zinc-400">{sub}</p>
    </div>
  );
}

// ---------- regroupement par mois (avec bornes ISO pour le filtre de période) ----------
function monthlyTimeline(issues: Issue[]) {
  const months = new Map<
    string,
    { month: string; ouverts: number; clotures: number; from: string; to: string }
  >();
  const label = (key: string) => {
    const [y, m] = key.split("-");
    return `${m}/${y.slice(2)}`;
  };
  const get = (iso: string) => {
    const key = iso.slice(0, 7); // "YYYY-MM"
    if (!months.has(key)) {
      const [y, m] = key.split("-");
      const lastDay = new Date(Date.UTC(Number(y), Number(m), 0)).toISOString().slice(0, 10);
      months.set(key, { month: label(key), ouverts: 0, clotures: 0, from: `${key}-01`, to: lastDay });
    }
    return months.get(key)!;
  };
  for (const i of issues) {
    if (i.openDate) get(i.openDate).ouverts++;
    if (i.closeDate) get(i.closeDate).clotures++;
  }
  return [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
}

export default function Overview({
  issues,
  total,
  charts,
  filters,
  onToggle,
  onToggleMonth,
}: {
  issues: Issue[];
  total: number;
  // Données par graphique (chaque dimension exclue de son propre filtre)
  charts: { status: Issue[]; priority: Issue[]; module: Issue[]; period: Issue[] };
  filters: Filters;
  onToggle: (dim: DimKey, value: string) => void;
  onToggleMonth: (from: string, to: string) => void;
}) {
  const stats = useMemo(() => {
    const closed = issues.filter((i) => !isOpen(i));
    const open = issues.filter(isOpen);
    const urgent = issues.filter((i) => i.priority === "Critical" || i.priority === "High");
    const waiting = issues.filter(
      (i) => isOpen(i) && ["Blocked", "On Hold", "waiting for Customer"].includes(i.status)
    );
    const delays = issues.map(resolutionDays).filter((x): x is number => x !== null);
    const avg = delays.length ? delays.reduce((a, b) => a + b, 0) / delays.length : null;
    return { closed, open, urgent, waiting, delays, avg };
  }, [issues]);

  // Tickets prioritaires à traiter : ouverts, Critical/High, les plus anciens d'abord
  const priorityList = useMemo(() => {
    const rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return issues
      .filter((i) => isOpen(i) && (i.priority === "Critical" || i.priority === "High"))
      .sort((a, b) => {
        const r = rank[a.priority as keyof typeof rank] - rank[b.priority as keyof typeof rank];
        if (r !== 0) return r;
        return (ageDays(b) ?? 0) - (ageDays(a) ?? 0);
      })
      .slice(0, 10);
  }, [issues]);

  // La période sélectionnée n'est PAS appliquée ici (sinon le mois
  // cliqué disparaîtrait du graphe) : toutes les barres restent visibles,
  // le mois actif est simplement mis en évidence.
  const timeline = useMemo(() => monthlyTimeline(charts.period), [charts.period]);

  return (
    <div>
      <SectionHeader
        title="Vue générale"
        subtitle={`Indicateurs clés calculés à partir des ${total} tickets chargés`}
        image="/banner/office.jpg"
      />

      {/* KPI */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total tickets" value={issues.length} sub={issues.length === total ? "Tous les tickets" : `sur ${total} au total`} icon={Layers} color="text-zinc-900" />
        <KpiCard label="Clôturés" value={stats.closed.length} sub="Statut Closed" icon={CheckCircle2} color="text-green-600" />
        <KpiCard label="Ouverts" value={stats.open.length} sub="Tous statuts non clôturés" icon={Clock} color="text-blue-600" />
        <KpiCard label="Critical + High" value={stats.urgent.length} sub="Priorités les plus urgentes" icon={AlertTriangle} color="text-red-600" />
        <KpiCard label="Bloqués / en attente" value={stats.waiting.length} sub="Blocked, On Hold, attente client" icon={Hourglass} color="text-orange-600" />
        <KpiCard
          label="Délai moyen"
          value={stats.avg !== null ? `${stats.avg.toFixed(1)} j` : "—"}
          sub={`${stats.delays.length}/${issues.length} tickets avec dates valides`}
          icon={Timer}
          color="text-zinc-900"
        />
      </div>

      {/* Graphiques interactifs : un clic filtre toute la page */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Répartition par statut (cliquez pour filtrer)">
          <ChartBox id="status" data={countBy(charts.status, "status")}>
            <StatusPie
              data={countBy(charts.status, "status")}
              active={filters.status}
              onSelect={onToggle}
            />
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
            <HorizontalBars
              data={countBy(charts.module, "module")}
              color="#2563eb"
              dim="module"
              active={filters.module}
              onSelect={onToggle}
            />
          </ChartBox>
        </Panel>

        <Panel title="Évolution mensuelle : ouverts vs clôturés (cliquez un mois pour filtrer)">
          <ChartBox id="timeline" data={timeline.map((t) => ({ name: t.month, value: t.ouverts }))} emptyMsg="Aucune donnée de date pour ces filtres.">
            <TimelineBars
              data={timeline}
              active={{ from: filters.from, to: filters.to }}
              onSelectMonth={onToggleMonth}
            />
          </ChartBox>
        </Panel>
      </div>

      {/* Tickets prioritaires à traiter */}
      <Panel title={`Tickets prioritaires à traiter — ${priorityList.length} Critical/High encore ouverts`}>
        {priorityList.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">
            Aucun ticket Critical/High ouvert pour ces filtres.
          </p>
        ) : (
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
                  <th className="px-3 py-2 font-medium">Ancienneté</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {priorityList.map((i) => (
                  <tr key={i.id} className="hover:bg-zinc-50">
                    <td className="px-3 py-2 font-mono text-xs">{i.id}</td>
                    <td className="max-w-xs truncate px-3 py-2" title={i.description}>{i.description}</td>
                    <td className="px-3 py-2">
                      <span className="font-medium" style={{ color: PRIORITY_COLORS[i.priority] }}>
                        {i.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-600">{i.status}</td>
                    <td className="px-3 py-2 text-zinc-600">{i.module || "—"}</td>
                    <td className="px-3 py-2 text-zinc-600">{i.openDate || "Information absente"}</td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        {ageDays(i) !== null ? `${ageDays(i)} j` : "Date absente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Note sur les statuts utilisés (cohérence) */}
      <p className="mt-3 text-xs text-zinc-400">
        Statuts distingués (non fusionnés) : {STATUSES.join(" · ")}.
      </p>
    </div>
  );
}
