// Vérification des métriques : npx tsx scripts/check-metrics.ts
import { loadIssueData } from "../src/lib/loadIssues";
import { closedByWeek, avgResolutionByMonth, slaRate, slaRateBy } from "../src/lib/metrics";

function assert(cond: boolean, label: string): void {
  if (!cond) {
    console.error(`ECHEC: ${label}`);
    process.exit(1);
  }
}

const issues = loadIssueData().issues;

// semaines : total des clôturés = 56, tri chronologique
const weeks = closedByWeek(issues);
const total = weeks.reduce((s, w) => s + w.value, 0);
assert(total === 56, `clôturés par semaine = 56 (obtenu ${total})`);
assert(weeks.every((w, i) => i === 0 || weeks[i - 1].from <= w.from), "semaines triées chrono");
assert(weeks.every((w) => /^\d{2}\/\d{2}$/.test(w.name)), "label semaine = dd/MM");

// mois : entre 8 et 12 mois de clôture, valeurs plausibles
const months = avgResolutionByMonth(issues);
assert(months.length >= 8 && months.length <= 12, `nb mois de clôture (obtenu ${months.length})`);
assert(months.every((m) => m.value >= 0 && m.value <= 90), "délai moyen mensuel plausiblement borné");

// taux SLA global = 75 % (42 sur 56)
const r = slaRate(issues);
console.log(`slaRate: ${r.rate}% (${r.onTime}/${r.base})`);
assert(r.base === 56, `base = 56 clôturés évaluables (obtenu ${r.base})`);
assert(r.onTime === 42, `onTime = 42 (obtenu ${r.onTime})`);
assert(r.rate === 75, `rate = 75 (obtenu ${r.rate})`);

// par nature : les bases somment à 56
const byPrio = slaRateBy(issues, "priority");
assert(byPrio.reduce((s, g) => s + g.base, 0) === 56, "bases par priorité = 56");
const byOwner = slaRateBy(issues, "raisedBy");
assert(byOwner.length >= 5, `au moins 5 responsables (obtenu ${byOwner.length})`);
assert(byOwner.every((g, i) => i === 0 || byOwner[i - 1].base > g.base || (byOwner[i - 1].base === g.base && byOwner[i - 1].name <= g.name)), "tri base desc");

console.log("check-metrics: OK");
