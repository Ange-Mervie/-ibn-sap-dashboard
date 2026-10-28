// Loader MySQL via Drizzle — même shape IssueData que le lecteur Excel.
// Utilisé par la page d'accueil ; l'Excel reste pour l'import (scripts/db:import).
import fs from "fs";
import path from "path";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { isOpen, todayISO, STATUSES, type Issue, type IssueData } from "./issues";
import { readExcelIssues } from "./loadIssues";

// Date MySQL "YYYY-MM-DD" ou Timestamp → "YYYY-MM-DD" ("" si absent)
function iso(d: Date | string | null): string {
  if (!d) return "";
  const x = new Date(d);
  if (isNaN(x.getTime())) return "";
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

export async function loadIssueDataFromDb(): Promise<IssueData> {
  const rows = await db.select().from(tickets).orderBy(tickets.id);

  const issues: Issue[] = rows.map((t) => ({
    id: t.id,
    description: t.description,
    status: t.status,
    priority: t.priority,
    module: t.module,
    raisedBy: t.raisedBy,
    email: t.email,
    openDate: iso(t.openDate),
    closeDate: iso(t.closeDate),
    assignee: t.assignee,
    payment: t.payment,
    comments: t.comments ?? "",
    source: t.source,
  }));

  const summary = {
    status: {} as Record<string, number>,
    priority: {} as Record<string, number>,
    total: issues.length,
  };
  for (const i of issues) {
    const ks = i.status.toLowerCase();
    const kp = i.priority.toLowerCase();
    summary.status[ks] = (summary.status[ks] || 0) + 1;
    summary.priority[kp] = (summary.priority[kp] || 0) + 1;
  }

  // --- contrôles qualité (signalent, ne masquent jamais) ---
  const controls: IssueData["controls"] = [];

  const ids = issues.map((i) => i.id);
  const dup = ids.length - new Set(ids).size;
  controls.push({
    label: "Doublons d'identifiants",
    ok: dup === 0,
    detail: dup === 0 ? "Aucun doublon" : `${dup} doublon(s)`,
  });

  const statutsConnus = new Set(STATUSES.map((s) => s.toLowerCase()));
  const badStatus = issues.filter((i) => !statutsConnus.has(i.status.toLowerCase())).length;
  controls.push({
    label: "Statuts connus",
    ok: badStatus === 0,
    detail: badStatus === 0 ? "Tous valides" : `${badStatus} inconnu(s)`,
  });

  const noModule = issues.filter((i) => !i.module || i.module.toUpperCase() === "BLANK").length;
  controls.push({
    label: "Module SAP renseigné",
    ok: noModule === 0,
    detail: noModule === 0 ? "Tous renseignés" : `${noModule} sans module`,
  });

  const noRaised = issues.filter((i) => !i.raisedBy).length;
  controls.push({
    label: "Demandeur renseigné",
    ok: noRaised === 0,
    detail: noRaised === 0 ? "Tous renseignés" : `${noRaised} sans demandeur`,
  });

  const closedNoDate = issues.filter((i) => !isOpen(i) && !i.closeDate).length;
  controls.push({
    label: "Clôturés avec date de clôture",
    ok: closedNoDate === 0,
    detail: closedNoDate === 0 ? "Complets" : `${closedNoDate} incomplet(s)`,
  });

  const openNoDate = issues.filter((i) => isOpen(i) && !i.openDate).length;
  controls.push({
    label: "Ouverts avec date d'ouverture",
    ok: openNoDate === 0,
    detail: openNoDate === 0 ? "Complets" : `${openNoDate} incomplet(s)`,
  });

  const noPayment = issues.filter((i) => !i.payment).length;
  controls.push({
    label: "Payment status renseigné",
    ok: noPayment === 0,
    detail: noPayment === 0 ? "Tous renseignés" : `${noPayment} sans paiement`,
  });

  const invDates = issues.filter((i) => i.openDate && i.closeDate && i.closeDate < i.openDate).length;
  controls.push({
    label: "Dates cohérentes (clôture ≥ ouverture)",
    ok: invDates === 0,
    detail: invDates === 0 ? "Conformes" : `${invDates} incohérent(s)`,
  });

  // Fidélité de l'import : tout le classeur est-il repris en base ?
  const excelPath = path.join(process.cwd(), "data", "IBN-SAP SUPPORT-Issue-Tracking-SCDP UPDATED.xlsx");
  if (fs.existsSync(excelPath)) {
    const excelIds = readExcelIssues().issues.map((i) => i.id);
    const baseIds = new Set(ids);
    const missing = excelIds.filter((id) => !baseIds.has(id)).length;
    controls.push({
      label: "Import Excel fidèle",
      ok: missing === 0,
      detail:
        missing === 0
          ? `Base ${issues.length} tickets`
          : `${missing} ticket(s) Excel absent(s) — relancer npm run db:import`,
    });
  }

  const dates: string[] = [];
  for (const i of issues) {
    if (i.openDate) dates.push(i.openDate);
    if (i.closeDate) dates.push(i.closeDate);
  }
  dates.sort();

  const lastRow = await db
    .select({ m: tickets.updatedAt })
    .from(tickets)
    .orderBy(tickets.updatedAt)
    .limit(1);
  const lastUpdate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(
    lastRow[0]?.m ?? new Date()
  );

  return {
    issues,
    summary,
    controls,
    period: { from: dates[0] || todayISO(), to: dates[dates.length - 1] || todayISO() },
    lastUpdate,
    source: "MySQL (base ibn_dashboard)",
  };
}
