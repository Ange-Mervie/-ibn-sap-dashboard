// ============================================================
// SLA simulé par priorité — le fichier Excel n'a AUCUNE colonne
// d'échéance : on calcule échéance = openDate + SLA_DAYS[priorité].
// Modifiez les seuils ci-dessous pour changer la définition du retard.
// ============================================================
import type { Issue } from "./issues";
import { isOpen, todayISO, daysBetween } from "./issues";

export const SLA_DAYS: Record<string, number> = {
  Critical: 3,
  High: 7,
  Medium: 14,
  Low: 30,
};

// « Échéance dans les 48 h » = alerte d'approche
export const WARNING_HOURS = 48;

// Statuts considérés comme bloqués / en attente
const BLOCKED_STATUSES = ["Blocked", "On Hold", "waiting for Customer"];

// Rang de priorité pour le tri des alertes
const PRIORITY_RANK: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Seuil SLA de la priorité (null = non évaluable)
export function slaDays(issue: Issue): number | null {
  return SLA_DAYS[issue.priority] ?? null;
}

// Échéance simulée : null si ticket sans date ou priorité inconnue
export function dueDate(issue: Issue): string | null {
  const days = slaDays(issue);
  if (!issue.openDate || days === null) return null;
  return addDays(issue.openDate, days);
}

// Heures restantes avant échéance (négatif = retard) ; null = non évaluable
export function hoursLeft(issue: Issue): number | null {
  const due = dueDate(issue);
  if (due === null) return null;
  return daysBetween(todayISO(), due) * 24;
}

// Jours de retard arrondis au supérieur (0 si pas de retard)
export function daysLate(issue: Issue): number {
  const h = hoursLeft(issue);
  if (h === null || h >= 0) return 0;
  return Math.ceil(-h / 24);
}

// Ouvert ET échéance dépassée
export function isLate(issue: Issue): boolean {
  const h = hoursLeft(issue);
  return isOpen(issue) && h !== null && h < 0;
}

// Ouvert ET échéance atteinte dans les WARNING_HOURS
export function isDueSoon(issue: Issue): boolean {
  const h = hoursLeft(issue);
  return isOpen(issue) && h !== null && h >= 0 && h <= WARNING_HOURS;
}

// --- agrégation des alertes du jour (sur TOUS les tickets) ---
export type AlertSummary = {
  late: Issue[]; // ouverts hors SLA, du plus en retard au moins en retard
  due: Issue[]; // ouverts à échéance ≤ 48 h, du plus proche au plus lointain
  blocked: Issue[]; // ouverts bloqués / en attente client, du plus ancien au plus récent
  criticalLate: number; // Critical en retard (pilote l'ouverture automatique du panneau)
  unique: number; // tickets distincts présents dans au moins un groupe
};

export function issueAlerts(issues: Issue[]): AlertSummary {
  const late = issues
    .filter(isLate)
    .sort((a, b) => daysLate(b) - daysLate(a) || (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9));
  const due = issues
    .filter(isDueSoon)
    .sort((a, b) => (hoursLeft(a) ?? 0) - (hoursLeft(b) ?? 0));
  const blocked = issues
    .filter((i) => isOpen(i) && BLOCKED_STATUSES.includes(i.status))
    .sort((a, b) => (b.openDate || "").localeCompare(a.openDate || ""));
  const criticalLate = late.filter((i) => i.priority === "Critical").length;
  const unique = new Set([...late, ...due, ...blocked].map((i) => i.id)).size;
  return { late, due, blocked, criticalLate, unique };
}
