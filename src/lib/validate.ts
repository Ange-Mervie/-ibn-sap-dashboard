// Validation serveur des tickets — messages d'erreur en français.
// Utilisée par POST /api/tickets, PATCH /api/tickets/[id] et le client.
import { STATUSES, PRIORITIES, MODULES } from "@/lib/issues";

export type TicketWrite = {
  description: string;
  status: string;
  priority: string;
  module: string;
  raisedBy: string;
  email: string;
  assignee: string;
  openDate: string | null;
  closeDate: string | null;
  payment: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function asString(v: unknown): string {
  return v === null || v === undefined ? "" : String(v).replace(/\s+/g, " ").trim();
}

function validDate(v: unknown): boolean {
  return v === "" || v === null || v === undefined || (DATE_RE.test(asString(v)) && !isNaN(Date.parse(asString(v))));
}

// Contrôles communs aux créations et modifications.
function commonErrors(raw: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if ("description" in raw) {
    const d = asString(raw.description);
    if (d.length < 5) errors.push("La description doit contenir au moins 5 caractères.");
  }

  if ("status" in raw && raw.status !== "" && raw.status !== undefined && raw.status !== null) {
    if (!(STATUSES as readonly string[]).includes(asString(raw.status))) {
      errors.push(`Statut invalide : choisissez parmi ${STATUSES.join(", ")}.`);
    }
  }

  if ("priority" in raw && raw.priority !== "" && raw.priority !== undefined && raw.priority !== null) {
    if (!(PRIORITIES as readonly string[]).includes(asString(raw.priority))) {
      errors.push(`Priorité invalide : choisissez parmi ${PRIORITIES.join(", ")}.`);
    }
  }

  if ("module" in raw && raw.module !== "" && raw.module !== undefined && raw.module !== null) {
    if (!(MODULES as readonly string[]).includes(asString(raw.module))) {
      errors.push("Module SAP invalide : choisissez un module de la liste.");
    }
  }

  if ("email" in raw && asString(raw.email) && !EMAIL_RE.test(asString(raw.email))) {
    errors.push("L'adresse e-mail n'est pas valide.");
  }

  if (!validDate(raw.openDate)) errors.push("La date d'ouverture doit être au format AAAA-MM-JJ.");
  if (!validDate(raw.closeDate)) errors.push("La date de clôture doit être au format AAAA-MM-JJ.");

  const open = asString(raw.openDate);
  const close = asString(raw.closeDate);
  if (open && close && close < open) {
    errors.push("La date de clôture ne peut pas précéder la date d'ouverture.");
  }

  return errors;
}

function normalize(raw: Record<string, unknown>): TicketWrite {
  return {
    description: asString(raw.description),
    status: asString(raw.status) || "Not Started",
    priority: asString(raw.priority) || "Medium",
    module: asString(raw.module),
    raisedBy: asString(raw.raisedBy),
    email: asString(raw.email),
    assignee: asString(raw.assignee),
    openDate: asString(raw.openDate) || null,
    closeDate: asString(raw.closeDate) || null,
    payment: asString(raw.payment),
  };
}

// Création : champs obligatoires = description + demandeur.
export function validateTicketInput(raw: unknown): { data: TicketWrite | null; errors: string[] } {
  if (!raw || typeof raw !== "object") {
    return { data: null, errors: ["Corps de requête invalide (JSON attendu)."] };
  }
  const rec = raw as Record<string, unknown>;
  const errors = commonErrors(rec);
  if (!asString(rec.description)) errors.push("La description est obligatoire.");
  if (!asString(rec.raisedBy)) errors.push("Le demandeur est obligatoire.");
  return { data: errors.length ? null : normalize(rec), errors };
}

// Modification : tout champ absent reste inchangé (PATCH partiel).
export function validateTicketPatch(raw: unknown): { data: Partial<TicketWrite> | null; errors: string[] } {
  if (!raw || typeof raw !== "object") {
    return { data: null, errors: ["Corps de requête invalide (JSON attendu)."] };
  }
  const rec = raw as Record<string, unknown>;
  const errors = commonErrors(rec);
  if ("description" in rec && !asString(rec.description)) errors.push("La description est obligatoire.");
  if ("raisedBy" in rec && !asString(rec.raisedBy)) errors.push("Le demandeur est obligatoire.");
  if (!errors.length && Object.keys(rec).length === 0) {
    return { data: null, errors: ["Aucun champ à modifier."] };
  }

  const data: Partial<TicketWrite> = {};
  const map: (keyof TicketWrite)[] = [
    "description",
    "status",
    "priority",
    "module",
    "raisedBy",
    "email",
    "assignee",
    "openDate",
    "closeDate",
    "payment",
  ];
  for (const key of map) {
    if (key in rec) {
      if (key === "openDate" || key === "closeDate") {
        data[key] = asString(rec[key]) || null;
      } else {
        data[key] = asString(rec[key]);
      }
    }
  }
  return { data: errors.length ? null : data, errors };
}
