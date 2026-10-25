// Vérification de la logique SLA : npx tsx scripts/check-sla.ts
import { loadIssueData } from "../src/lib/loadIssues";
import { PRIORITIES, daysBetween, isOpen } from "../src/lib/issues";
import {
  SLA_DAYS, dueDate, hoursLeft, daysLate, isLate, isDueSoon, slaDays, issueAlerts,
} from "../src/lib/sla";

function assert(cond: boolean, label: string): void {
  if (!cond) {
    console.error(`ECHEC: ${label}`);
    process.exit(1);
  }
}

const d = loadIssueData();
const issues = d.issues;

// --- échéance simulée : openDate + SLA_DAYS[priorité] ---
const crit = issues.find((i) => i.priority === "Critical" && i.openDate)!;
const due = dueDate(crit)!;
assert(due !== null, "dueDate non null pour un Critical avec date");
assert(daysBetween(crit.openDate, due) === 3, `Critical = openDate + 3 j (obtenu ${due})`);
assert(slaDays(crit) === 3 && slaDays({ ...crit, priority: "Low" }) === 30, "slaDays par priorité");
assert(dueDate({ ...crit, openDate: "" }) === null, "sans openDate → non évaluable");
assert(dueDate({ ...crit, priority: "Inconnue" }) === null, "priorité inconnue → non évaluable");

// --- agrégats sur le fichier actuel ---
const a = issueAlerts(issues);
console.log(
  `late=${a.late.length} due=${a.due.length} blocked=${a.blocked.length}` +
    ` criticalLate=${a.criticalLate} unique=${a.unique}`
);
assert(a.late.length === 42, `42 en retard (obtenu ${a.late.length})`);
assert(a.due.length === 0, `0 à échéance ≤ 48 h (obtenu ${a.due.length})`);
assert(a.blocked.length === 15, `15 bloqués/en attente (obtenu ${a.blocked.length})`);
assert(a.criticalLate === 3, `3 Critical en retard (obtenu ${a.criticalLate})`);
assert(a.unique === 42, `42 tickets uniques dans les alertes (obtenu ${a.unique})`);

// tri : retard décroissant
const lates = a.late.map((i) => daysLate(i));
assert(lates.every((v, i) => i === 0 || lates[i - 1] >= v), "late trié par retard desc");

// ouverts non encore en retard / évaluation individuelle
const notLate = issues.filter((i) => isOpen(i) && !isLate(i));
assert(notLate.every((i) => hoursLeft(i) === null || hoursLeft(i)! >= 0), "non-late = heures ≥ 0");
assert(a.late.every((i) => isLate(i) && !isDueSoon(i)), "late ∩ due = vide");

console.log("check-sla: OK");
