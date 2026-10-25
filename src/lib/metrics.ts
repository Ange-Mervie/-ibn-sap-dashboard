// ============================================================
// Métriques de performance dans le temps (pures, sans Date du jour)
// Utilisées par la section « Performance et planning ».
// ============================================================
import type { Issue } from "./issues";
import { isOpen, resolutionDays } from "./issues";
import { slaDays } from "./sla";

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Lundi de la semaine contenant `iso`
function mondayOf(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const weekday = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - weekday);
  return fmt(d);
}

// Clôturés par semaine (lundi), label dd/MM, tri chronologique
export function closedByWeek(issues: Issue[]): { name: string; value: number; from: string }[] {
  const weeks = new Map<string, number>();
  for (const i of issues) {
    if (!i.closeDate) continue;
    const from = mondayOf(i.closeDate);
    weeks.set(from, (weeks.get(from) || 0) + 1);
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([from, value]) => ({
      from,
      value,
      name: from.slice(8, 10) + "/" + from.slice(5, 7),
    }));
}

// Délai moyen de résolution par mois de clôture (mm/yy), tri chronologique
export function avgResolutionByMonth(issues: Issue[]): { name: string; value: number }[] {
  const months = new Map<string, { sum: number; n: number }>();
  for (const i of issues) {
    const d = resolutionDays(i);
    if (d === null || !i.closeDate) continue;
    const key = i.closeDate.slice(0, 7); // "YYYY-MM"
    const e = months.get(key) || { sum: 0, n: 0 };
    e.sum += d;
    e.n += 1;
    months.set(key, e);
  }
  return [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, e]) => ({
      name: key.slice(5, 7) + "/" + key.slice(2, 4), // mm/yy
      value: Math.round((e.sum / e.n) * 10) / 10,
    }));
}

// Taux de respect du SLA : clôturés avec les 2 dates et un SLA connu
export function slaRate(issues: Issue[]): { rate: number; onTime: number; base: number } {
  let onTime = 0;
  let base = 0;
  for (const i of issues) {
    if (isOpen(i)) continue;
    const d = resolutionDays(i);
    const s = slaDays(i);
    if (d === null || s === null) continue;
    base += 1;
    if (d <= s) onTime += 1;
  }
  return { rate: base ? Math.round((onTime / base) * 100) : 0, onTime, base };
}

// Taux de respect du SLA par groupe (responsable, module ou priorité)
export function slaRateBy(
  issues: Issue[],
  key: "raisedBy" | "module" | "priority"
): { name: string; rate: number; base: number }[] {
  const groups = new Map<string, Issue[]>();
  for (const i of issues) {
    const name = i[key] || "(non renseigné)";
    const g = groups.get(name) || [];
    g.push(i);
    groups.set(name, g);
  }
  return [...groups.entries()]
    .map(([name, list]) => ({ name, ...slaRate(list) }))
    .filter((g) => g.base > 0)
    .sort((a, b) => b.base - a.base || a.name.localeCompare(b.name));
}
