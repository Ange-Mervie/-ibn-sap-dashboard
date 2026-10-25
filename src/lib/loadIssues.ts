import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { isOpen, clean, todayISO, type Issue, type IssueData } from "./issues";

// ============================================================
// Lecteur du fichier Excel — SERVEUR UNIQUEMENT
// Source de vérité : data/IBN-SAP SUPPORT-Issue-Tracking-SCDP UPDATED.xlsx
// Feuille "PM Issue Tracking" :
//   - lignes 1-10 (index 0-10)  = en-tête + résumés (exclues des calculs)
//   - ligne 14   (index 14)     = en-tête des colonnes
//   - lignes 15+ (index 15+)    = véritables lignes de tickets
// ============================================================

const FILE_NAME = "IBN-SAP SUPPORT-Issue-Tracking-SCDP UPDATED.xlsx";
const SHEET_NAME = "PM Issue Tracking";
const FIRST_DATA_ROW = 15;

function toDate(value: unknown): string {
  if (value instanceof Date && !isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "";
}

export function loadIssueData(): IssueData {
  const filePath = path.join(process.cwd(), "data", FILE_NAME);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Fichier Excel introuvable : data/${FILE_NAME}. ` +
        "Copiez le fichier de suivi SAP dans le dossier data/ du projet."
    );
  }

  const stat = fs.statSync(filePath);
  const workbook = XLSX.read(fs.readFileSync(filePath), { cellDates: true });
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) throw new Error(`Feuille "${SHEET_NAME}" introuvable dans le fichier Excel.`);

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: true });

  // --- résumés Excel (bloc du haut), pour comparaison plus bas ---
  const summary = { status: {} as Record<string, number>, priority: {} as Record<string, number>, total: 0 };
  for (let r = 3; r <= 10; r++) {
    const row = rows[r] || [];
    const sName = clean(row[4]);
    const sVal = Number(row[5]);
    if (sName && sName !== "TOTAL" && !isNaN(sVal)) summary.status[sName.toLowerCase()] = sVal;
    const pName = clean(row[6]);
    const pVal = Number(row[7]);
    if (pName && !isNaN(pVal)) summary.priority[pName.toLowerCase()] = pVal;
    if (sName === "TOTAL") summary.total = sVal;
  }

  // --- lignes de tickets (seulement celles avec un Issue No.) ---
  const issues: Issue[] = [];
  for (let r = FIRST_DATA_ROW; r < rows.length; r++) {
    const row = rows[r] || [];
    const id = clean(row[1]);
    if (!id) continue; // lignes vides / hors données
    issues.push({
      id,
      description: clean(row[2]),
      status: clean(row[3]),
      priority: clean(row[4]),
      module: clean(row[5]),
      raisedBy: clean(row[6]),
      openDate: toDate(row[7]),
      closeDate: toDate(row[8]),
      payment: clean(row[9]),
      comments: clean(row[10]),
    });
  }

  // --- contrôles qualité (signale, ne masque pas) ---
  const controls: IssueData["controls"] = [];

  const ids = issues.map((i) => i.id);
  const duplicates = ids.length - new Set(ids).size;
  controls.push({
    label: "Doublons d'identifiants",
    ok: duplicates === 0,
    detail: duplicates === 0 ? "Aucun doublon" : `${duplicates} doublon(s) détecté(s)`,
  });

  controls.push({
    label: "Total détaillé vs résumé Excel",
    ok: summary.total === issues.length,
    detail: `Détail : ${issues.length} · Résumé : ${summary.total}`,
  });

  // comparaison des statuts (insensible à la casse)
  const detailStatus: Record<string, number> = {};
  for (const i of issues) {
    const k = i.status.toLowerCase();
    detailStatus[k] = (detailStatus[k] || 0) + 1;
  }
  const statusDiff: string[] = [];
  for (const [key, val] of Object.entries(summary.status)) {
    const found = detailStatus[key] ?? 0;
    if (found !== val) statusDiff.push(`${key} (résumé ${val} / détail ${found})`);
  }
  controls.push({
    label: "Statuts : résumé vs détail",
    ok: statusDiff.length === 0,
    detail: statusDiff.length === 0 ? "Concordants" : `Écart : ${statusDiff.join(", ")}`,
  });

  const detailPriority: Record<string, number> = {};
  for (const i of issues) {
    const k = i.priority.toLowerCase();
    detailPriority[k] = (detailPriority[k] || 0) + 1;
  }
  const priorityDiff: string[] = [];
  for (const [key, val] of Object.entries(summary.priority)) {
    const found = detailPriority[key] ?? 0;
    if (found !== val) priorityDiff.push(`${key} (résumé ${val} / détail ${found})`);
  }
  controls.push({
    label: "Priorités : résumé vs détail",
    ok: priorityDiff.length === 0,
    detail: priorityDiff.length === 0 ? "Concordants" : `Écart : ${priorityDiff.join(", ")}`,
  });

  const noModule = issues.filter((i) => !i.module || i.module.toUpperCase() === "BLANK").length;
  controls.push({
    label: "Module SAP renseigné",
    ok: noModule === 0,
    detail: noModule === 0 ? "Tous renseignés" : `${noModule} ticket(s) sans module valide`,
  });

  const closedNoDate = issues.filter((i) => !isOpen(i) && !i.closeDate).length;
  controls.push({
    label: "Clôturés avec date de clôture",
    ok: closedNoDate === 0,
    detail: closedNoDate === 0 ? "Complets" : `${closedNoDate} clôturé(s) sans date`,
  });

  const openNoDate = issues.filter((i) => isOpen(i) && !i.openDate).length;
  controls.push({
    label: "Ouverts avec date d'ouverture",
    ok: openNoDate === 0,
    detail: openNoDate === 0 ? "Complets" : `${openNoDate} ouvert(s) sans date d'ouverture`,
  });

  const noPayment = issues.filter((i) => !i.payment).length;
  controls.push({
    label: "Payment status renseigné",
    ok: noPayment === 0,
    detail: noPayment === 0 ? "Tous renseignés" : `${noPayment} ticket(s) sans statut de paiement`,
  });

  // --- période réelle des données ---
  const dates: string[] = [];
  for (const i of issues) {
    if (i.openDate) dates.push(i.openDate);
    if (i.closeDate) dates.push(i.closeDate);
  }
  dates.sort();
  const period = {
    from: dates[0] || todayISO(),
    to: dates[dates.length - 1] || todayISO(),
  };

  const lastUpdate = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(stat.mtime);

  return { issues, summary, controls, period, lastUpdate, source: FILE_NAME };
}
