// ============================================================
// Types et utilitaires PURS (utilisés côté client ET serveur)
// Aucun accès système de fichiers ici → compatible navigateur.
// Le lecteur Excel est dans loadIssues.ts (côté serveur uniquement).
// ============================================================

// Ordre d'affichage des statuts / priorités (normalisés)
export const STATUSES = [
  "Not Started",
  "In Progress",
  "On Hold",
  "Blocked",
  "waiting for Customer",
  "Closed",
] as const;

export const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;

// Modules SAP de référence (feuille "Key - Do Not Delete" du classeur)
export const MODULES = [
  "Bank",
  "Bank Treso",
  "FI_AA",
  "FI_AP",
  "FI_AR",
  "FI_FM",
  "HCM",
  "MM_CONTRACT",
  "MM_INVENTORY",
  "MM_PROCUREMENT",
  "BLANK",
  "CLOTURE",
  "BASIS",
] as const;

export type Issue = {
  id: string; // Issue No.
  description: string;
  status: string; // normalisé (espaces réduits)
  priority: string;
  module: string; // "" si non renseigné
  raisedBy: string;
  openDate: string; // "YYYY-MM-DD" ou ""
  closeDate: string;
  payment: string; // "PAID" | "INVOICED" | "NOT INVOICED" | "" (non renseigné)
  comments: string;
  // champs de l'application (optionnels : absents de l'Excel historique)
  email?: string;
  assignee?: string;
  source?: string; // "excel" | "form" | "email"
};

export type IssueData = {
  issues: Issue[];
  summary: { status: Record<string, number>; priority: Record<string, number>; total: number };
  controls: { label: string; ok: boolean; detail: string }[];
  period: { from: string; to: string };
  lastUpdate: string;
  source: string;
};

// ---------- utilitaires ----------

export function clean(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

export function isOpen(issue: Issue): boolean {
  return issue.status.toLowerCase() !== "closed";
}

// Nombre de jours entre deux dates "YYYY-MM-DD" (a vers b)
export function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Ancienneté d'un ticket ouvert (jours depuis l'ouverture)
export function ageDays(issue: Issue): number | null {
  if (!issue.openDate) return null;
  return daysBetween(issue.openDate, todayISO());
}

// Délai de résolution en jours (uniquement si les 2 dates existent)
export function resolutionDays(issue: Issue): number | null {
  if (!issue.openDate || !issue.closeDate) return null;
  const days = daysBetween(issue.openDate, issue.closeDate);
  return days >= 0 ? days : null;
}

export function countBy(issues: Issue[], field: keyof Issue): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  for (const i of issues) {
    const key = clean(i[field]) || "(non renseigné)";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

// ---------- filtres globaux (type Power BI) ----------

// Dimensions cliquables dans les graphiques
export type DimKey = "status" | "priority" | "module" | "payment";

// État global unique des filtres : alimente KPI, graphiques, tableau et chips.
// "from" / "to" filtrent sur la date d'ouverture (YYYY-MM-DD, "" = sans limite)
export type Filters = {
  status: string;
  priority: string;
  module: string;
  payment: string;
  from: string;
  to: string;
};

export const EMPTY_FILTERS: Filters = { status: "", priority: "", module: "", payment: "", from: "", to: "" };

// Valeurs utilisées dans les graphiques / listes pour les champs vides
export const NO_VALUE = "(non renseigné)";
export const NO_VALUE_DISPLAY = "Non renseigné";

// Applique les filtres combinables (logique ET).
// `exclude` = dimension à IGNORER : chaque graphique affiche ainsi les autres
// catégories (toujours cliquables) tout en restant synchronisé avec les filtres.
export function applyFilters(issues: Issue[], f: Filters, exclude?: DimKey | "period"): Issue[] {
  return issues.filter((i) => {
    if (exclude !== "status" && f.status && i.status !== f.status) return false;
    if (exclude !== "priority" && f.priority && i.priority !== f.priority) return false;
    if (exclude !== "module" && f.module) {
      if (f.module === NO_VALUE) {
        if (i.module) return false;
      } else if (i.module !== f.module) return false;
    }
    if (exclude !== "payment" && f.payment) {
      if (f.payment === NO_VALUE || f.payment === NO_VALUE_DISPLAY) {
        if (i.payment) return false;
      } else if (i.payment !== f.payment) return false;
    }
    if (exclude !== "period" && (f.from || f.to)) {
      if (!i.openDate) return false;
      if (f.from && i.openDate < f.from) return false;
      if (f.to && i.openDate > f.to) return false;
    }
    return true;
  });
}

// Liste des filtres actifs, à afficher sous forme de "chips" supprimables
export function filterChips(f: Filters): { key: string; label: string }[] {
  const fr = (iso: string) => iso.split("-").reverse().join("/");
  const chips: { key: string; label: string }[] = [];
  if (f.status) chips.push({ key: "status", label: `Statut : ${f.status}` });
  if (f.priority) chips.push({ key: "priority", label: `Priorité : ${f.priority}` });
  if (f.module) chips.push({ key: "module", label: `Module : ${f.module}` });
  if (f.payment) chips.push({ key: "payment", label: `Paiement : ${f.payment}` });
  if (f.from || f.to) {
    chips.push({ key: "period", label: `Période : ${f.from ? fr(f.from) : "…"} → ${f.to ? fr(f.to) : "…"}` });
  }
  return chips;
}

// ---------- export CSV ----------

export function issuesToCSV(issues: Issue[]): string {
  const headers = [
    "Issue No.",
    "Issue Description",
    "Status",
    "Priority",
    "SAP module",
    "Raised By",
    "Open Date",
    "Close Date",
    "Payment status",
    "Comments",
  ];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(";")];
  for (const i of issues) {
    lines.push(
      [i.id, i.description, i.status, i.priority, i.module, i.raisedBy, i.openDate, i.closeDate, i.payment, i.comments]
        .map(escape)
        .join(";")
    );
  }
  return lines.join("\r\n");
}
