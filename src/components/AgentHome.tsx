"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock, Hourglass } from "lucide-react";
import { isOpen, ageDays } from "@/lib/issues";
import { Panel } from "./Charts";
import KpiCard from "./KpiCard";
import IssueTable from "./IssueTable";
import SectionHeader from "./SectionHeader";
import type { HomeProps } from "./homeProps";

const OVERDUE_AFTER_DAYS = 30;

export default function AgentHome(props: HomeProps) {
  const { user, issues, onReset } = props;
  const firstName = (user.name || user.email || "Agent").split(" ")[0];

  const open = useMemo(() => issues.filter((i) => isOpen(i)), [issues]);
  const urgent = open.filter((i) => i.priority === "Critical" || i.priority === "High");
  const inProgress = open.filter((i) => i.status === "In Progress");
  const closed = issues.filter((i) => !isOpen(i));
  const overdue = open.filter((i) => { const a = ageDays(i); return a !== null && a >= OVERDUE_AFTER_DAYS; });

  return (
    <>
      <SectionHeader
        title={`Bonjour, ${firstName}`}
        subtitle="Votre espace de travail : vos tickets assignés, vos urgences et vos interventions."
        image="/banner/office.jpg"
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Mes tickets assignés" value={issues.length} sub="Tickets ouverts sur mon périmètre" icon={Clock} color="text-blue-600" />
        <KpiCard label="Urgents" value={urgent.length} sub="Critical / High en cours" icon={AlertTriangle} color="text-red-600" />
        <KpiCard label="En cours" value={inProgress.length} sub="Statut In Progress" icon={Clock} color="text-orange-600" />
        <KpiCard label="Terminés" value={closed.length} sub="Statut Closed" icon={CheckCircle2} color="text-green-600" />
        <KpiCard label="En retard" value={overdue.length} sub={`Ouverts de plus de ${OVERDUE_AFTER_DAYS} jours`} icon={Hourglass} color="text-amber-600" />
      </div>
      <Panel title="Mes tickets">
        <IssueTable issues={issues} onReset={onReset} filtersActive={false} />
      </Panel>
    </>
  );
}
