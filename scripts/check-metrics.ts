// Vérification des métriques : npx tsx scripts/check-metrics.ts
import { loadIssueData } from "../src/lib/loadIssues";
import { isOpen, resolutionDays } from "../src/lib/issues";
import { slaDays } from "../src/lib/sla";
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

// --- contrat des labels et de l'ordre (renfort) ---
assert(weeks.every((w) => w.name === w.from.slice(8, 10) + "/" + w.from.slice(5, 7)), "label semaine = dd/MM du lundi from");
assert(weeks.every((w) => new Date(w.from + "T00:00:00").getDay() === 1), "from = un lundi");
assert(months.every((m) => /^\d{2}\/\d{2}$/.test(m.name)), "label mois = mm/yy");
assert(months.every((m) => Number(m.name.slice(0, 2)) >= 1 && Number(m.name.slice(0, 2)) <= 12), "mois entre 01 et 12 (attrape un swap yy/mm)");
const mOrder = months.map((m) => (2000 + Number(m.name.slice(3, 5))) * 100 + Number(m.name.slice(0, 2)));
assert(mOrder.every((v, i) => i === 0 || mOrder[i - 1] <= v), "mois triés chronologiquement (mm/yy avec année)");

// --- clé "module" exercée ---
const byModule = slaRateBy(issues, "module");
assert(byModule.length >= 2, `au moins 2 modules (obtenu ${byModule.length})`);
assert(byModule.reduce((s, g) => s + g.base, 0) === 56, "bases par module = 56");

// --- rate de groupe recalculé indépendamment (priorité Critical) ---
const critClosed = issues.filter((i) => !isOpen(i) && i.priority === "Critical" && i.openDate && i.closeDate);
const critGroup = byPrio.find((g) => g.name === "Critical");
assert(critClosed.length > 0, `au moins 1 Critical clôturé (obtenu ${critClosed.length})`);
assert(Boolean(critGroup), "groupe Critical présent dans slaRateBy");
if (critClosed.length > 0 && critGroup) {
  const onTime = critClosed.filter((i) => (resolutionDays(i) ?? Infinity) <= (slaDays(i) ?? -1)).length;
  const expected = Math.round((onTime / critClosed.length) * 100);
  assert(critGroup.base === critClosed.length, `base Critical = ${critClosed.length} (obtenu ${critGroup.base})`);
  assert(critGroup.rate === expected, `rate Critical = ${expected} % (obtenu ${critGroup.rate})`);
}
assert(byModule.every((g) => g.rate >= 0 && g.rate <= 100), "rates de groupe bornés 0-100");

// --- cas à bord ---
const empty = slaRate([]);
assert(empty.base === 0 && empty.onTime === 0 && empty.rate === 0, "slaRate([]) → 0/0/0");
const unknownPrio = slaRate([{ ...critClosed[0], priority: "Inconnue" } as (typeof issues)[number]]);
assert(unknownPrio.base === 0 && unknownPrio.rate === 0, "priorité inconnue exclue de la base");
const noDate = slaRate([{ ...critClosed[0], openDate: "" } as (typeof issues)[number]]);
assert(noDate.base === 0 && noDate.rate === 0, "ticket sans date exclu de la base");

console.log("check-metrics: OK");
