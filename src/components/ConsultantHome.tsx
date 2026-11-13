"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock, Hourglass } from "lucide-react";
import { isOpen, ageDays } from "@/lib/issues";
import KpiCard from "./KpiCard";
import SectionHeader from "./SectionHeader";
import type { HomeProps } from "./homeProps";

const OVERDUE_AFTER_DAYS = 30;

export default function ConsultantHome(props: HomeProps) {
  const { user, issues } = props;
  const firstName = (user.name || user.email || "Consultant").split(" ")[0];

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
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Mes tickets assignés" value={issues.length} sub="Tickets ouverts sur mon périmètre" icon={<Clock size={15} />} color="text-blue-600" />
        <KpiCard label="Urgents" value={urgent.length} sub="Critical / High en cours" icon={<AlertTriangle size={15} />} color="text-red-600" />
        <KpiCard label="En cours" value={inProgress.length} sub="Statut In Progress" icon={<Clock size={15} />} color="text-orange-600" />
        <KpiCard label="Terminés" value={closed.length} sub="Statut Closed" icon={<CheckCircle2 size={15} />} color="text-green-600" />
        <KpiCard label="En retard" value={overdue.length} sub={`Ouverts de plus de ${OVERDUE_AFTER_DAYS} jours`} icon={<Hourglass size={15} />} color="text-amber-600" />
      </div>
    </>
  );
}
