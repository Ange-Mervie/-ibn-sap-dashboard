"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { Issue, IssueData, Filters, DimKey } from "@/lib/issues";
import { isOpen, ageDays, resolutionDays, countBy, PRIORITIES } from "@/lib/issues";
import { Panel, ChartBox, CountBars, HorizontalBars, PAYMENT_COLORS, PRIORITY_COLORS } from "./Charts";
import SectionHeader from "./SectionHeader";

// Distribution des délais de résolution (en jours)
const DELAY_BUCKETS = [
  { label: "0-3 j", min: 0, max: 3 },
  { label: "4-7 j", min: 4, max: 7 },
  { label: "8-14 j", min: 8, max: 14 },
  { label: "15-30 j", min: 15, max: 30 },
  { label: "> 30 j", min: 31, max: Infinity },
];

export default function Analysis({
  issues,
  controls,
  source,
  charts,
  filters,
  onToggle,
}: {
  issues: Issue[];
  controls: IssueData["controls"];
  source: string;
  // Données par graphique (chaque dimension exclue de son propre filtre)
  charts: { priority: Issue[]; module: Issue[]; payment: Issue[] };
  filters: Filters;
  onToggle: (dim: DimKey, value: string) => void;
}) {
  const open = useMemo(() => issues.filter(isOpen), [issues]);
  const closed = useMemo(() => issues.filter((i) => !isOpen(i)), [issues]);

  // Délais de résolution (uniquement calculables)
  const delays = useMemo(
    () => issues.map(resolutionDays).filter((x): x is number => x !== null),
    [issues]
  );
  const avg = delays.length ? delays.reduce((a, b) => a + b, 0) / delays.length : null;
  const max = delays.length ? Math.max(...delays) : null;

  const delayBuckets = useMemo(
    () =>
      DELAY_BUCKETS.map((b) => ({
        name: b.label,
        value: delays.filter((d) => d >= b.min && d <= b.max).length,
      })),
    [delays]
  );

  // Tickets les plus anciens encore ouverts
  const oldestOpen = useMemo(
    () =>
      [...open]
        .filter((i) => ageDays(i) !== null)
        .sort((a, b) => (ageDays(b) ?? 0) - (ageDays(a) ?? 0))
        .slice(0, 8),
    [open]
  );

  // Bloqués / en attente
  const blocked = useMemo(
    () => open.filter((i) => ["Blocked", "On Hold", "waiting for Customer"].includes(i.status)),
    [open]
  );

  // Paiement (NE PAS confondre avec le statut de résolution)
  const paymentData = useMemo(() => {
    const withPay = countBy(charts.payment, "payment");
    return withPay.map((p) => ({
      name: p.name === "(non renseigné)" ? "Non renseigné" : p.name,
      value: p.value,
    }));
  }, [charts.payment]);

  // ================= POINTS D'ATTENTION =================
  const alerts = useMemo(() => {
    const criticalOpen = issues.filter((i) => isOpen(i) && i.priority === "Critical");
    const blockedStatus = issues.filter((i) => isOpen(i) && i.status === "Blocked");
    const waitingLong = issues.filter((i) => {
      const a = ageDays(i);
      return isOpen(i) && i.status === "waiting for Customer" && a !== null && a > 30;
    });
    const veryOld = open.filter((i) => {
      const a = ageDays(i);
      return a !== null && a > 90;
    });
    const longDelay = issues.filter((i) => {
      const d = resolutionDays(i);
      return d !== null && d > 30;
    });
    const closedNoPay = closed.filter((i) => !i.payment);
    const noModule = issues.filter((i) => !i.module || i.module.toUpperCase() === "BLANK");

    return [
      {
        severity: "critique" as const,
        title: "Tickets Critical encore ouverts",
        rule: "Règle : Priority = Critical ET statut ≠ Closed",
        items: criticalOpen,
      },
      {
        severity: "critique" as const,
        title: "Tickets bloqués",
        rule: "Règle : statut = Blocked",
        items: blockedStatus,
      },
      {
        severity: "attention" as const,
        title: "En attente client depuis plus de 30 jours",
        rule: "Règle : statut = waiting for Customer ET ancienneté > 30 jours",
        items: waitingLong,
      },
      {
        severity: "attention" as const,
        title: "Ouverts depuis plus de 90 jours",
        rule: "Règle : statut ≠ Closed ET (date du jour − open Date) > 90 jours",
        items: veryOld,
      },
      {
        severity: "attention" as const,
        title: "Délai de résolution supérieur à 30 jours",
        rule: "Règle : Close Date − Open Date > 30 jours (sur tickets clôturés)",
        items: longDelay,
      },
      {
        severity: "info" as const,
        title: "Clôturés sans statut de paiement",
        rule: "Règle : statut = Closed ET Payment status vide (≠ payé, à suivre)",
        items: closedNoPay,
      },
      {
        severity: "info" as const,
        title: "Tickets sans module SAP valide",
        rule: "Règle : SAP module vide ou valeur « BLANK »",
        items: noModule,
      },
    ];
  }, [issues, open, closed]);

  const severityStyle = {
    critique: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
    attention: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  };

  return (
    <div>
      <SectionHeader
        title="Analyse et performance"
        subtitle="Délais, ancienneté, paiement et points d'attention justifiés par des règles explicites"
        image="/banner/data.jpg"
      />

      {/* KPI secondaires */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Panel>
          <p className="text-xs text-zinc-500">Délai moyen de résolution</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{avg !== null ? `${avg.toFixed(1)} jours` : "Non calculable"}</p>
          <p className="mt-1 text-[11px] text-zinc-400">{delays.length}/{issues.length} tickets avec dates valides</p>
        </Panel>
        <Panel>
          <p className="text-xs text-zinc-500">Délai maximal observé</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{max !== null ? `${max} jours` : "—"}</p>
          <p className="mt-1 text-[11px] text-zinc-400">Parmi les tickets clôturés</p>
        </Panel>
        <Panel>
          <p className="text-xs text-zinc-500">Ouverts les plus anciens</p>
          <p className="mt-1 text-xl font-bold text-red-600">{oldestOpen.length ? `${ageDays(oldestOpen[0])} jours` : "—"}</p>
          <p className="mt-1 text-[11px] text-zinc-400">Ticket n° {oldestOpen[0]?.id || "—"}</p>
        </Panel>
        <Panel>
          <p className="text-xs text-zinc-500">Bloqués / en attente</p>
          <p className="mt-1 text-xl font-bold text-orange-600">{blocked.length}</p>
          <p className="mt-1 text-[11px] text-zinc-400">Blocked, On Hold, waiting for Customer</p>
        </Panel>
      </div>

      {/* Graphiques */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Délais de résolution (uniquement tickets avec dates valides)">
          {delays.length ? (
            <CountBars data={delayBuckets} color="#2563eb" />
          ) : (
            <p className="py-10 text-center text-sm text-zinc-400">
              Aucun délai calculable : dates de clôture manquantes ou invalides.
            </p>
          )}
        </Panel>

        <Panel title="Statuts de paiement (cliquez pour filtrer)">
          <ChartBox id="a-payment" data={paymentData}>
            <CountBars
              data={paymentData}
              color={(n) => PAYMENT_COLORS[n] || "#cbd5e1"}
              order={["PAID", "INVOICED", "NOT INVOICED", "Non renseigné"]}
              dim="payment"
              active={filters.payment}
              onSelect={onToggle}
            />
          </ChartBox>
          <p className="mt-2 text-xs text-zinc-400">
            INVOICED ≠ PAID : facturé ne signifie pas payé.
          </p>
        </Panel>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Tickets les plus anciens encore ouverts">
          {oldestOpen.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">Aucun ticket ouvert pour ces filtres.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {oldestOpen.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-800" title={i.description}>
                      n° {i.id} — {i.description}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {i.status} · {i.priority} · {i.module || "module non renseigné"} · ouvert le {i.openDate}
                    </p>
                  </div>
                  <span className="shrink-0 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                    {ageDays(i)} j
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Tickets bloqués ou en attente">
          {blocked.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">Aucun ticket bloqué ou en attente.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {blocked.slice(0, 8).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-800" title={i.description}>
                      n° {i.id} — {i.description}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {i.status} · {i.priority} · ouvert le {i.openDate}
                    </p>
                  </div>
                  <span className="shrink-0 rounded bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">
                    {ageDays(i) !== null ? `${ageDays(i)} j` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Repartition par priorite / module — cliquables et synchronisés */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Répartition des priorités (cliquez pour filtrer)">
          <ChartBox id="a-priority" data={countBy(charts.priority, "priority")}>
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
        <Panel title="Incidents par module SAP (cliquez pour filtrer)">
          <ChartBox id="a-module" data={countBy(charts.module, "module")}>
            <HorizontalBars
              data={countBy(charts.module, "module")}
              color="#2563eb"
              dim="module"
              active={filters.module}
              onSelect={onToggle}
            />
          </ChartBox>
        </Panel>
      </div>

      {/* ============ POINTS D'ATTENTION ============ */}
      <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-zinc-900">
        <AlertTriangle size={18} className="text-amber-500" /> Points d&apos;attention
      </h3>
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {alerts.map((a) => {
          const style = severityStyle[a.severity];
          const ids = a.items.slice(0, 6).map((i) => i.id);
          return (
            <div key={a.title} className={`rounded-lg border ${style.border} ${style.bg} p-4`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                  <p className={`text-sm font-semibold ${style.text}`}>{a.title}</p>
                </div>
                <span className={`text-lg font-bold ${style.text}`}>{a.items.length}</span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-600">{a.rule}</p>
              {a.items.length > 0 && (
                <p className="mt-2 font-mono text-xs text-zinc-500">
                  Tickets : {ids.join(", ")}
                  {a.items.length > 6 ? ` +${a.items.length - 6} autres` : ""}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ============ CONTRÔLES DES DONNÉES ============ */}
      <Panel title={`Contrôles qualité des données — source : ${source}`}>
        <ul className="space-y-2">
          {controls.map((c) => (
            <li key={c.label} className="flex items-start gap-2 text-sm">
              {c.ok ? (
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-600" />
              ) : (
                <XCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
              )}
              <span className="text-zinc-700">{c.label}</span>
              <span className="ml-auto text-right text-xs text-zinc-500">{c.detail}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
          Les écarts sont signalés, jamais masqués. Les lignes de résumé du classeur sont exclues des
          calculs détaillés et servent uniquement à la vérification.
        </p>
      </Panel>
    </div>
  );
}
