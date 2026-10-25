// Vérification rapide des données : npx tsx scripts/check-data.ts
import { loadIssueData } from "../src/lib/loadIssues";
import { isOpen, ageDays, resolutionDays } from "../src/lib/issues";

const d = loadIssueData();
console.log("Tickets:", d.issues.length);
console.log("Periode:", d.period.from, "->", d.period.to);
console.log("MAJ:", d.lastUpdate);
console.log("Resume:", JSON.stringify(d.summary));
d.controls.forEach((c) => console.log(" ", c.ok ? "OK " : "!! ", c.label, "->", c.detail));
const open = d.issues.filter(isOpen);
console.log("Ouverts:", open.length, "| Clotures:", d.issues.length - open.length);
console.log("Critical+High:", d.issues.filter((i) => i.priority === "Critical" || i.priority === "High").length);
const delays = d.issues.map(resolutionDays).filter((x): x is number => x !== null);
console.log("Delais:", delays.length, "moyen:", (delays.reduce((a, b) => a + b, 0) / delays.length).toFixed(1), "max:", Math.max(...delays));
const ages = open.map((i) => ageDays(i)).filter((x): x is number => x !== null);
console.log("Ages ouverts: min", Math.min(...ages), "max", Math.max(...ages));
