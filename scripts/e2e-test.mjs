// Test fonctionnel du dashboard (puppeteer + Edge local)
// Usage : npx tsx scripts/e2e-test.mjs  ou  node scripts/e2e-test.mjs
import puppeteer from "puppeteer-core";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const URL = "http://localhost:3000/";
const shots = "C:/Users/LENOVO/AppData/Local/Temp/opencode";

let pass = 0;
let fail = 0;
function check(label, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`  OK   ${label}${detail ? " — " + detail : ""}`);
  } else {
    fail++;
    console.log(`  FAIL ${label}${detail ? " — " + detail : ""}`);
  }
}

const browser = await puppeteer.launch({ executablePath: EDGE, headless: "shell" });
const page = await browser.newPage();

// ---------- utilitaires de test ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function kpiValues() {
  // p uniquement : le h2 de section a aussi text-2xl font-bold
  return page.evaluate(() =>
    [...document.querySelectorAll("p.text-2xl.font-bold")].map((e) => e.textContent?.trim())
  );
}

async function tableRows() {
  return page.evaluate(() => {
    const m = document.body.innerText.match(/(\d+) ticket\(s\) correspondant/);
    return m ? Number(m[1]) : -1;
  });
}

// Clic réel sur un élément de légende d'un graphique (data-chart = wrapper)
async function clickLegend(chartId, label) {
  return page.evaluate((chartId, label) => {
    const wrap = document.querySelector(`[data-chart="${chartId}"]`);
    if (!wrap) return false;
    const items = [...wrap.querySelectorAll(".recharts-legend-item")];
    const target = items.find((li) => (li.textContent || "").includes(label));
    if (!target) return false;
    target.click();
    return true;
  }, chartId, label);
}

// Nombre d'éléments de légende visibles dans un graphique
async function legendCount(chartId) {
  return page.evaluate((chartId) => {
    const wrap = document.querySelector(`[data-chart="${chartId}"]`);
    return wrap ? wrap.querySelectorAll(".recharts-legend-item").length : -1;
  }, chartId);
}

// Clic sur une pastille de catégorie (graphiques en barres)
async function clickCat(chartId, cat) {
  return page.evaluate((chartId, cat) => {
    const wrap = document.querySelector(`[data-chart="${chartId}"]`);
    if (!wrap) return false;
    const btn = [...wrap.querySelectorAll("[data-cat]")].find(
      (b) => b.getAttribute("data-cat") === cat
    );
    if (!btn) return false;
    btn.click();
    return true;
  }, chartId, cat);
}

// Nombre de pastilles de catégories affichées
async function catCount(chartId) {
  return page.evaluate((chartId) => {
    const wrap = document.querySelector(`[data-chart="${chartId}"]`);
    return wrap ? wrap.querySelectorAll("[data-cat]").length : -1;
  }, chartId);
}

async function clickReset() {
  const btns = await page.$$("button");
  for (const b of btns) {
    const t = await b.evaluate((el) => el.textContent?.trim() || "");
    if (t.includes("Réinitialiser")) {
      await b.click();
      break;
    }
  }
  await sleep(400);
}

const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});

await page.setViewport({ width: 1440, height: 900 });
await page.goto(URL, { waitUntil: "networkidle0", timeout: 60000 });

// ---- 1. KPI initiaux ----
const kpiText = await page.evaluate(() =>
  [...document.querySelectorAll(".text-2xl.font-bold")].map((e) => e.textContent?.trim())
);
check("KPI Total = 98", kpiText.includes("98"), JSON.stringify(kpiText));
check("KPI Clôturés = 56", kpiText.includes("56"));
check("KPI Ouverts = 42", kpiText.includes("42"));
check("KPI Critical+High = 70", kpiText.includes("70"));

// ---- 2. Graphiques rendus ----
const svgCount = await page.evaluate(() => document.querySelectorAll("svg.recharts-surface").length);
check("Graphiques recharts rendus", svgCount >= 4, `${svgCount} graphiques`);

// ---- 3. Sidebar visible en desktop ----
const sidebarVisible = await page.evaluate(() => {
  const a = document.querySelector("aside");
  return a ? getComputedStyle(a).display !== "none" : false;
});
check("Barre latérale visible (desktop)", sidebarVisible);

// ---- 4. Filtre statut = Closed ----
await page.select("header select:nth-of-type(1)", "Closed").catch(() => {});
// le 1er select est bien le statut
const selects = await page.$$("header select");
await selects[0].select("Closed");
await new Promise((r) => setTimeout(r, 400));
const afterFilter = await page.evaluate(() =>
  [...document.querySelectorAll(".text-2xl.font-bold")].map((e) => e.textContent?.trim())
);
check("Filtre statut=Closed → Total 56", afterFilter.includes("56"), JSON.stringify(afterFilter));

// le tableau est aussi filtré
const tableCount = await page.evaluate(() => {
  const m = document.body.innerText.match(/(\d+) ticket\(s\) correspondant/);
  return m ? Number(m[1]) : -1;
});
check("Tableau filtré → 56 tickets", tableCount === 56, `affichés: ${tableCount}`);

// ---- 5. Réinitialiser ----
const resetBtns = await page.$$("button");
for (const b of resetBtns) {
  const t = await b.evaluate((el) => el.textContent?.trim() || "");
  if (t.includes("Réinitialiser")) {
    await b.click();
    break;
  }
}
await new Promise((r) => setTimeout(r, 400));
const afterReset = await page.evaluate(() =>
  [...document.querySelectorAll(".text-2xl.font-bold")].map((e) => e.textContent?.trim())
);
check("Réinitialisation → Total 98", afterReset.includes("98"));

// ---- 6. Recherche dans le tableau ----
const input = await page.$('input[placeholder*="ticket"]');
await input.type("MAD SCB");
await new Promise((r) => setTimeout(r, 400));
const searchCount = await page.evaluate(() => {
  const m = document.body.innerText.match(/(\d+) ticket\(s\) correspondant/);
  return m ? Number(m[1]) : -1;
});
// 2 tickets contiennent "MAD SCB" dans leur description
check("Recherche 'MAD SCB' → 2 tickets", searchCount === 2, `résultats: ${searchCount}`);

// effacement via le setter natif (input contrôlé par React)
await page.evaluate(() => {
  const el = document.querySelector('input[placeholder*="ticket"]');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(el, "");
  el.dispatchEvent(new Event("input", { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 400));
const afterClear = await page.evaluate(() => {
  const m = document.body.innerText.match(/(\d+) ticket\(s\) correspondant/);
  return m ? Number(m[1]) : -1;
});
check("Effacement de la recherche → 98 tickets", afterClear === 98, `résultats: ${afterClear}`);

// ---- 7. Pagination ----
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
const nextBtn = await page.evaluateHandle(() => {
  const btns = [...document.querySelectorAll("button")];
  return btns.find((b) => b.textContent?.includes("Suivant")) || null;
});
if (nextBtn && nextBtn.asElement()) {
  await nextBtn.asElement().click();
  await new Promise((r) => setTimeout(r, 400));
  const pageText = await page.evaluate(() => document.body.innerText.match(/Page (\d+) \/ (\d+)/));
  check("Pagination → Page 2", pageText && pageText[1] === "2", pageText ? pageText[0] : "");
  const rows = await page.evaluate(() => {
    const m = document.body.innerText.match(/(\d+) ticket\(s\) correspondant/);
    return m ? Number(m[1]) : -1;
  });
  check("Toujours 98 tickets sur page 2", rows === 98, String(rows));
} else {
  check("Bouton Suivant présent", false);
}

// ---- 8. Tri par priorité (clic sur l'en-tête du tableau de suivi) ----
const sortResult = await page.evaluate(() => {
  const section = document.getElementById("tracking");
  const th = [...section.querySelectorAll("th")].find((t) => t.textContent?.startsWith("Priorité"));
  if (!th) return { ok: false, reason: "en-tête introuvable" };
  th.click();
  return { ok: true };
});
await new Promise((r) => setTimeout(r, 400));
if (sortResult.ok) {
  const firstPriority = await page.evaluate(() => {
    const row = document.querySelectorAll("#tracking tbody tr")[0];
    return row ? row.children[3]?.textContent?.trim() : "";
  });
  check("Tri priorité (asc) → Critical en premier", firstPriority === "Critical", `1ère ligne: ${firstPriority}`);
} else {
  check("Tri priorité", false, sortResult.reason);
}

// ---- 9. Export CSV (vérifie le contenu généré à partir des données filtrées) ----
const csvInfo = await page.evaluate(async () => {
  let captured = null;
  const origCreate = URL.createObjectURL;
  URL.createObjectURL = (blob) => {
    captured = blob;
    return origCreate.call(URL, blob);
  };
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("Export CSV"));
  if (!btn) {
    URL.createObjectURL = origCreate;
    return null;
  }
  btn.click();
  URL.createObjectURL = origCreate;
  if (!captured) return null;
  const text = await captured.text();
  const lines = text.split("\r\n");
  return {
    lines: lines.length,
    header: lines[0].replace(/^\uFEFF/, "").slice(0, 40),
    firstRow: (lines[1] || "").slice(0, 50),
  };
});
check(
  "Export CSV généré (99 lignes = 1 en-tête + 98 tickets)",
  csvInfo !== null && csvInfo.lines === 99,
  csvInfo ? `${csvInfo.lines} lignes | header: ${csvInfo.header}` : "aucun blob"
);

// ---- 10. Sections + états ----
const sections = await page.evaluate(() =>
  ["overview", "tracking", "analysis"].map((id) => Boolean(document.getElementById(id)))
);
check("3 sections présentes", sections.every(Boolean));

// ============================================================
// ---- INTERACTIVITÉ POWER BI (filtrage croisé par les graphiques)
// Données de référence : Critical=16 · Critical+MM_INVENTORY=1
// (ticket 11) · statuts distincts parmi Critical=3 · janvier=7
// ============================================================

// ---- 13. Clic sur « Critical » dans le graphique des priorités ----
const clickedCritical = await clickCat("priority", "Critical");
await sleep(500);
const k13 = await kpiValues();
check("PBI Clic « Critical » (graphe priorités) → Total = 16", clickedCritical && k13[0] === "16", JSON.stringify(k13));

// le tableau suit exactement la même sélection
const t13 = await tableRows();
check("PBI Tableau mis à jour → 16 tickets", t13 === 16, `affichés: ${t13}`);

// le filtre d'en-tête est synchronisé (même état global)
const selPriority = await page.evaluate(() => document.querySelectorAll("header select")[1].value);
check("PBI Filtre en-tête synchronisé (priorité = Critical)", selPriority === "Critical", selPriority);

// une sélection active est visible
const chipCritical = await page.evaluate(() => document.body.innerText.includes("Priorité : Critical"));
check("PBI Sélection active visible (chip « Priorité : Critical »)", chipCritical);

// les autres graphiques se mettent à jour : le graphique des statuts
// reflète les 16 tickets Critical → 3 statuts distincts (pas 6)
const legendStatus = await legendCount("status");
check("PBI Graph statuts actualisé (3 statuts parmi Critical)", legendStatus === 3, `${legendStatus} entrées de légende`);

// ---- 14. Ajout du module MM → combinaison ET (Critical + MM_INVENTORY) ----
const clickedMM = await clickCat("module", "MM_INVENTORY");
await sleep(500);
const k14 = await kpiValues();
check("PBI Critical + MM_INVENTORY combinés = 1 ticket", clickedMM && k14[0] === "1", JSON.stringify(k14));

const t14 = await tableRows();
check("PBI Tableau combiné → 1 ticket (n°11)", t14 === 1, `affichés: ${t14}`);

// le graphique des priorités garde les 2 priorités présentes parmi MM
// (il exclut son propre filtre → « High » reste visible et cliquable)
const catsPriority = await catCount("priority");
check("PBI Graph priorités : propres filtres exclus (2 catégories)", catsPriority === 2, `${catsPriority} pastilles`);

// ---- 15. Réinitialisation → retour aux 98 tickets ----
await clickReset();
const k15 = await kpiValues();
check("PBI Réinitialisation → Total = 98", k15[0] === "98", JSON.stringify(k15));
const t15 = await tableRows();
check("PBI Tableau réinitialisé → 98 tickets", t15 === 98, `affichés: ${t15}`);
const noChip = await page.evaluate(() => !document.body.innerText.includes("Sélection active"));
check("PBI Plus aucune sélection active", noChip);

// ---- 15b. Clic sur « Closed » dans le camembert des statuts ----
const clickedClosed = await clickLegend("status", "Closed");
await sleep(500);
const k15b = await kpiValues();
check("PBI Clic part « Closed » (camembert) → Total = 56", clickedClosed && k15b[0] === "56", JSON.stringify(k15b));
const chipClosed = await page.evaluate(() => document.body.innerText.includes("Statut : Closed"));
check("PBI Filtre statut visible (chip « Statut : Closed »)", chipClosed);
await clickReset();

// ---- 16. Combinaison sans résultat → message clair ----
// Critical (graphe) + Not Started (en-tête) = 0 ticket
await clickCat("priority", "Critical");
await sleep(400);
const pbiSelects = await page.$$("header select");
await pbiSelects[0].select("Not Started");
await sleep(500);
const k16 = await kpiValues();
check("PBI Combinaison vide → Total = 0", k16[0] === "0", JSON.stringify(k16));
const emptyMsg = await page.evaluate(() =>
  document.body.innerText.includes("Aucun ticket ne correspond à la combinaison de filtres actuelle.")
);
check("PBI Message « aucun ticket » affiché", emptyMsg);
const t16 = await tableRows();
check("PBI Tableau vide → 0 ticket", t16 === 0, `affichés: ${t16}`);
await clickReset();

// ---- 17. Clic sur une barre du graphique temporel (janvier = 7) ----
await page.evaluate(() => {
  const el = document.querySelector('[data-chart="timeline"]');
  if (el) el.scrollIntoView({ block: "center" });
});
await sleep(800); // défilement fluide + animation des barres
const barBox = await page.evaluate(() => {
  const wrap = document.querySelector('[data-chart="timeline"]');
  if (!wrap) return null;
  const series = wrap.querySelectorAll("g.recharts-bar-rectangles"); // [0] = Ouverts
  if (!series.length) return null;
  const rects = [...series[0].querySelectorAll("g.recharts-bar-rectangle")];
  if (!rects.length) return null;
  const r = rects[0].getBoundingClientRect(); // 1er mois = janvier
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, months: rects.length };
});
if (barBox && barBox.w > 1) {
  await page.mouse.click(barBox.x, barBox.y);
  await sleep(500);
  const k17 = await kpiValues();
  check("PBI Clic barre janvier → période filtrée, Total = 7", k17[0] === "7", JSON.stringify(k17));
  const chipPeriod = await page.evaluate(() =>
    document.body.innerText.includes("Période : 01/01/2026 → 31/01/2026")
  );
  check("PBI Période visible (chip + dates synchronisées)", chipPeriod);

  // récliquer sur la même barre désactive la période
  await page.mouse.click(barBox.x, barBox.y);
  await sleep(500);
  const k17b = await kpiValues();
  check("PBI Récliquer (désactivation) → Total = 98", k17b[0] === "98", JSON.stringify(k17b));
} else {
  check("PBI Barre de janvier cliquable", false, JSON.stringify(barBox));
}

// ============================================================
// ---- 18. CREATION DE TICKET (persistance MySQL) ----
// ============================================================
const errMark = consoleErrors.length; // les 400/404 ci-dessous sont volontaires
const newBtn = await page.evaluate(() =>
  [...document.querySelectorAll("a")].some((a) => a.textContent.includes("Nouveau ticket"))
);
check("Bouton « Nouveau ticket » présent dans l'en-tête", newBtn);

await page.goto("http://localhost:3000/tickets/nouveau", { waitUntil: "networkidle0" });
const formOk = await page.evaluate(() => Boolean(document.querySelector("[data-ticket-form]")));
check("Page /tickets/nouveau : formulaire rendu", formOk);

const created = await page.evaluate(async () => {
  const res = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: "Ticket créé par le test e2e — formulaire",
      status: "Not Started",
      priority: "High",
      module: "MM_INVENTORY",
      raisedBy: "E2E TEST",
      email: "e2e.test@ibngroup.com",
    }),
  });
  const body = await res.json();
  return { status: res.status, id: body.ticket?.id ?? null, error: body.error ?? null };
});
check(
  "POST /api/tickets → 201 avec id généré",
  created.status === 201 && /^SAP-\d{4}-\d{4}$/.test(created.id),
  JSON.stringify(created)
);

const rejected = await page.evaluate(async () => {
  const res = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description: "x", email: "pas-un-email" }),
  });
  const body = await res.json();
  return { status: res.status, errors: body.errors ?? [] };
});
check(
  "POST invalide → 400 + erreurs FR",
  rejected.status === 400 && rejected.errors.length >= 2,
  JSON.stringify(rejected)
);

// Persistance : le ticket existe en base après rechargement de la page
if (created.id) {
  const persisted = await page.evaluate(async (id) => {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}`);
    if (res.status !== 200) return { status: res.status };
    const body = await res.json();
    return { status: 200, description: body.ticket?.description ?? "", source: body.ticket?.source ?? "" };
  }, created.id);
  check(
    "Ticket créé persistant en base (GET détail)",
    persisted.status === 200 && persisted.description.includes("test e2e"),
    JSON.stringify(persisted)
  );
}

// Nettoyage : la suite e2e attend 98 tickets au départ de chaque exécution
if (created.id) {
  const cleaned = await page.evaluate(async (id) => {
    await fetch(`/api/tickets/${encodeURIComponent(id)}`, { method: "DELETE" });
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}`);
    return res.status;
  }, created.id);
  check("Nettoyage du ticket de test (DELETE)", cleaned === 404, `status=${cleaned}`);
}

// On conserve les vraies erreurs JS, on retire les "Failed to load resource"
// des réponses 400/404 volontaires de ce bloc.
const removedHttp = consoleErrors.splice(errMark);
for (const e of removedHttp) {
  if (!e.includes("Failed to load resource")) consoleErrors.push(e);
}

// ============================================================
// ---- 19. PAGE DETAIL, MODIFICATION, HISTORIQUE, COMMENTAIRES ----
// ============================================================
const errMark3 = consoleErrors.length; // 400/404 volontaires du bloc suivant
await page.goto("http://localhost:3000/tickets/11", { waitUntil: "networkidle0" });
const detailRender = await page.evaluate(() => ({
  root: Boolean(document.querySelector("[data-ticket-detail]")),
  history: Boolean(document.querySelector("[data-history-list]")),
  comments: Boolean(document.querySelector("[data-comment-form]")),
  body: document.body.innerText,
}));
check(
  "Page /tickets/11 : détail, historique et commentaires rendus",
  detailRender.root && detailRender.history && detailRender.comments &&
    detailRender.body.includes("NGONKA") &&
    detailRender.body.includes("MM_INVENTORY"),
  JSON.stringify({ root: detailRender.root, history: detailRender.history, comments: detailRender.comments })
);

// Cycle complet sur un ticket de test (aucune donnée Excel modifiée)
const cyc = await page.evaluate(async () => {
  const out = {};
  const create = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: "Cycle détail/historique/commentaires — test e2e",
      status: "Not Started",
      priority: "Medium",
      module: "FI_AR",
      raisedBy: "E2E DETAIL",
      email: "detail.test@ibngroup.com",
    }),
  });
  const createdBody = await create.json();
  out.create = create.status;
  out.id = createdBody.ticket?.id ?? null;
  if (!out.id) return out;

  const patch = await fetch(`/api/tickets/${encodeURIComponent(out.id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "In Progress", priority: "High", assignee: "AGENT SAP" }),
  });
  out.patch = patch.status;
  const patched = await patch.json();
  out.status = patched.ticket?.status ?? "";
  out.priority = patched.ticket?.priority ?? "";
  out.assignee = patched.ticket?.assignee ?? "";

  const hist = await fetch(`/api/tickets/${encodeURIComponent(out.id)}/history`);
  out.histStatus = hist.status;
  out.histRows = ((await hist.json()).events ?? []).length;

  const comment = await fetch(`/api/tickets/${encodeURIComponent(out.id)}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author: "E2E DETAIL", body: "Commentaire ajouté par le test e2e." }),
  });
  out.comment = comment.status;
  const after = await fetch(`/api/tickets/${encodeURIComponent(out.id)}`);
  const afterBody = await after.json();
  out.comments = (afterBody.comments ?? []).length;
  out.commentText = (afterBody.comments ?? []).map((c) => c.body).join(" | ");
  out.events = (afterBody.events ?? []).length;
  return out;
});

check("PATCH modification appliquée (statut, priorité, responsable)",
  cyc.patch === 200 && cyc.status === "In Progress" && cyc.priority === "High" && cyc.assignee === "AGENT SAP",
  JSON.stringify(cyc));
check("Historique : création + 2 changements enregistrés",
  cyc.histStatus === 200 && cyc.histRows >= 3 && cyc.events >= 3,
  `hist=${cyc.histRows} events=${cyc.events}`);
check("POST commentaire → 201 et visible dans le détail",
  cyc.comment === 201 && cyc.comments === 1 && cyc.commentText.includes("test e2e"),
  `comment=${cyc.comment} count=${cyc.comments}`);

const patchBad = await page.evaluate(async (id) => {
  const res = await fetch(`/api/tickets/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Statut Inexistant", description: "x" }),
  });
  const body = await res.json();
  return { status: res.status, errors: body.errors ?? [] };
}, cyc.id);
check("PATCH invalide → 400 + erreurs FR", patchBad.status === 400 && patchBad.errors.length >= 2,
  JSON.stringify(patchBad));

// Nettoyage : supprime le ticket de test + ses événements/commentaires
if (cyc.id) {
  const gone = await page.evaluate(async (id) => {
    await fetch(`/api/tickets/${encodeURIComponent(id)}`, { method: "DELETE" });
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}`);
    const hist = await fetch(`/api/tickets/${encodeURIComponent(id)}/history`);
    return { detail: res.status, history: hist.status };
  }, cyc.id);
  check("Nettoyage du ticket de test (détail + historique supprimés)",
    gone.detail === 404 && gone.history === 404, JSON.stringify(gone));
}

const removedHttp3 = consoleErrors.splice(errMark3);
for (const e of removedHttp3) {
  if (!e.includes("Failed to load resource")) consoleErrors.push(e);
}

await page.goto("http://localhost:3000/", { waitUntil: "networkidle0" });

// ---- 11. Screenshots desktop + tablette ----
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: `${shots}/desktop.png`, fullPage: false });
await page.setViewport({ width: 820, height: 1180 });
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: `${shots}/tablet.png`, fullPage: false });
const mobileNav = await page.evaluate(() => {
  const navs = [...document.querySelectorAll("nav")];
  return navs.some((n) => getComputedStyle(n).display !== "none");
});
check("Navigation mobile visible en tablette", mobileNav);

// ---- 12. Erreurs console ----
const realErrors = consoleErrors.filter(
  (e) => !e.includes("favicon") && !e.includes("Download the React DevTools")
);
check("Aucune erreur JS", realErrors.length === 0, realErrors.slice(0, 3).join(" | "));

await browser.close();
console.log(`\nRÉSULTAT: ${pass} succès, ${fail} échec(s)`);
process.exit(fail > 0 ? 1 : 0);
