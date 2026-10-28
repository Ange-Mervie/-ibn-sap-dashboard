# PHASE 1 — Dashboard SAP IBN → Application de gestion de tickets (MySQL + Drizzle + Gmail)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans pour implémenter ce plan task par task. Cases à cocher (`- [ ]`) pour le suivi.

**Goal:** Faire évoluer le dashboard SAP (lecture seule, filtrage croisé Power BI) en application de gestion de tickets autonome : persistance **MySQL** via **Drizzle ORM**, formulaire de création, page détail, historique des changements, commentaires, et préparation complète (sans connexion simulée) d'une intégration Gmail future.

**Architecture:** **Application Next.js autonome** (Option B validée). MySQL 8.3 local (port **3306**) = source de vérité, accédé via **Drizzle ORM** (`drizzle-orm/mysql2`) + migrations `drizzle-kit`. Le fichier Excel reste l'archive d'import (script idempotent, ids conservés). Odoo est **inaccessible** : aucune intégration n'est codée, la colonne `tickets.source` prépare un futur pont. Gmail est livré en **préparation propre** (OAuth serveur, staging, validation humaine) : sans Client ID/Secret réels, tout affiche « non configuré », aucune synchronisation n'est simulée ni automatique (conformément à la brève §F).

**Tech Stack:** Next.js 16.4 (App Router, `cacheComponents`, route handlers), React 19, TypeScript, Tailwind 4, **MySQL 8.3**, **Drizzle ORM** (`drizzle-orm` + `mysql2` + `drizzle-kit`), Recharts 3, xlsx (import), Puppeteer-core + Edge (e2e), `npx tsx` (scripts). Gmail via **fetch REST** (pas de `googleapis`).

## Global Constraints (cahier des charges — valables pour TOUTE l'exécution)

- **Ne rien modifier/retirer** : `public/banner/*`, `Banner.tsx`, `SectionHeader.tsx`.
- **Filtrage croisé existant intact** ; les **37 tests e2e actuels restent intacts** (ajouts uniquement).
- `export const instant = false` + `await connection()` dans `src/app/page.tsx` **inchangés**.
- **Nouvelles dépendances autorisées : `drizzle-orm`, `mysql2`, `drizzle-kit` (dev) uniquement.**
- Commentaires et textes UI **en français** ; constantes en haut des fichiers ; code simple.
- **Aucun secret dans le dépôt** : `.env.local` ignoré ; jamais de mot de passe MySQL/Gmail dans le code ou git ; `.env.example` sans valeurs secrètes.
- Push uniquement sur `origin = https://github.com/Ange-Mervie/-ibn-sap-dashboard` ; dépôt `cv` jamais touché ; aucun force-push.
- **Odoo : ne coder AUCUNE intégration** (instance inaccessible). Colonne `source` + note DOC uniquement.
- **N'inventer ni identifiants, ni synchronisation réussie.** Sans credentials Gmail, l'UI affiche « non configuré ».
- **Pas de synchronisation automatique complexe tant que la persistance n'est pas terminée** (brève §F) : le polling est **hors périmètre** de cette phase ; seule la synchro **manuelle** est préparée.
- IDs des 98 tickets Excel **conservés tels quels** en base ; nouveaux tickets = `SAP-YYYY-NNNN` (numéro lisible, sans collision via table compteur).
- MySQL : `localhost:3306` (MySQL Server 8.3, service `MySQL83` actif), base `ibn_dashboard` à créer (voir Prérequis).
- Le pied de page (texte modifié par l'utilisateur dans `447fedb`) sera **ajusté** pour mentionner la création/modification.
- **Ne supprimer ni modifier le fichier Excel original.** **Ne pas créer de tickets fictifs.**

## Audit (Phase A — déjà réalisé, rappel des faits)

- **Architecture** : Next.js 16.4 App Router, une seule route `/`, aucun backend, aucune base, aucun ORM, aucune route API, aucun `.env`.
- **Données** : 98 tickets lus à chaque requête dans `data/IBN-SAP SUPPORT-Issue-Tracking-SCDP UPDATED.xlsx` (feuille `PM Issue Tracking`, lignes 15+) par `src/lib/loadIssues.ts` — en mémoire le temps de la requête, **aucune persistance**.
- **Tests** : `check-data`/`check-sla`/`check-metrics` (tsx) + e2e Puppeteer 37/37 ; `tsc` 0 erreur ; lint 0 erreur.
- **Environnement cible** : MySQL Server **8.3** actif sur **3306** (service `MySQL83` + Wamp cohabite), Workbench 8.0 présent, CLI hors PATH (chemin complet `C:/Program Files/MySQL/MySQL Server 8.3/bin/mysql.exe`). Mot de passe root requis (non vide) — **à fournir par l'utilisateur**.
- **Aucun ORM/drivers DB présents** → la brève impose de proposer Prisma ou Drizzle : **Drizzle retenu** (légèreté, TS natif, adapté à la simplicité du projet).

## Conception (Phase B — modèle de données MySQL/Drizzle)

Tables (noms imposés par la brève §B) :

| Table | Rôle |
|---|---|
| `tickets` | entité centrale — identifiant lisible, objet, description, statut, priorité, module, demandeur, responsable, dates, source, référence Gmail |
| `ticket_comments` | commentaires ajoutés dans l'application (auteur + date) |
| `ticket_events` | historique des changements (statut, priorité, responsable, etc.) |
| `email_messages` | e-mails candidats Gmail (messageId, threadId, expéditeur, objet, date, ticket associé, état) |
| `sync_runs` | journal des synchronisations (résultat, compteurs, erreur) |
| `gmail_tokens` | jetons OAuth (ligne unique) — secrets client restent en `.env.local` |
| `ticket_counters` | compteur atomique par année pour les numéros `SAP-YYYY-NNNN` |

Contraintes : PK sur chaque table ; `email_messages.gmail_message_id` UNIQUE ; `tickets.gmail_message_id` UNIQUE (anti-doublon) ; FK `ticket_comments.ticket_id`/`ticket_events.ticket_id`/`email_messages.ticket_id` → `tickets.id` ; index sur statut/priorité. InnoDB + `utf8mb4`. Champs `comments` (legacy Excel) conservés sur `tickets` **et** table `ticket_comments` pour les commentaires d'application — le détail affiche les deux.

Justification MySQL vs modèle Postgres antérieur : `ON CONFLICT` → `ON DUPLICATE KEY`/ Drizzle upsert ; pas de `TIMESTAMPTZ` (utiliser `timestamp`) ; pas de séquence SQL (compteur applicatif) ; charset `utf8mb4` pour les accents français.

## Prérequis (avant Task 1) — bloquant

1. **Mot de passe MySQL root** fourni par l'utilisateur (option retenue). L'agent crée :

```sql
CREATE DATABASE ibn_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ibn_app'@'localhost' IDENTIFIED BY '<MOT_DE_PASSE_APPLICATIF>';
GRANT ALL PRIVILEGES ON ibn_dashboard.* TO 'ibn_app'@'localhost';
FLUSH PRIVILEGES;
```

2. **`C:\Users\LENOVO\Desktop\ibn-sap-dashboard\.env.local`** (fichier local, jamais committé) :

```
DATABASE_URL=mysql://ibn_app:<MOT_DE_PASSE_APPLICATIF>@localhost:3306/ibn_dashboard
```

3. Serveur dev : `netstat -ano | grep ":3000.*LISTENING"` → `taskkill //PID <PID> //F` si besoin, puis `nohup npm run dev > /tmp/next-dev.log 2>&1 &` et attendre HTTP 200.

> L'agent d'implémentation ne doit **jamais inventer** le mot de passe : s'il manque, demander à l'utilisateur (status NEEDS_CONTEXT).

## Structure des fichiers (vue d'ensemble)

```
drizzle.config.ts                → config drizzle-kit (schéma, dialect mysql, URL)
drizzle/                         → migrations SQL générées par drizzle-kit
src/db/schema.ts                 → schéma Drizzle (toutes les tables)
src/db/index.ts                  → pool mysql2 + instance db Drizzle
src/lib/db.ts                    → helpers requête + requireWriteToken
src/lib/validate.ts              → validation serveur des tickets (FR)
src/lib/loadDb.ts                → loadIssueDataFromDb() : même shape IssueData que l'Excel
src/lib/gmail/config.ts          → lecture env Gmail + isGmailConfigured()
src/lib/gmail/oauth.ts           → URL d'autorisation, échange code, refresh token
src/lib/gmail/client.ts          → liste/détail messages (fetch injecté pour tests)
src/lib/gmail/sync.ts            → orchestration : règles, staging, sync_runs, dédoublonnage
src/app/api/tickets/route.ts              → POST création
src/app/api/tickets/[id]/route.ts         → GET détail, PATCH modification (+events)
src/app/api/tickets/[id]/history/route.ts → GET events (JSON)
src/app/api/tickets/[id]/comments/route.ts→ GET/POST commentaires
src/app/api/gmail/status/route.ts         → GET état config + dernière synchro
src/app/api/gmail/auth-url/route.ts       → GET { url }
src/app/api/gmail/callback/route.ts       → GET échange code → stocke tokens → redirect
src/app/api/gmail/sync/route.ts           → POST synchronisation manuelle
src/app/api/gmail/staging/route.ts        → PATCH rattachement/ignoré d'un candidat
src/app/tickets/nouveau/page.tsx          → page formulaire
src/components/TicketForm.tsx             → formulaire client (création)
src/app/tickets/[id]/page.tsx             → page détail (serveur)
src/components/TicketEditForm.tsx          → formulaire client (modification)
src/app/emails/page.tsx                   → candidats Gmail + journal sync_runs
src/components/EmailCandidates.tsx         → panneau candidats (créer/rattacher/ignorer)
src/components/SyncControls.tsx            → boutons Connecter / Synchroniser
.env.example                              → modèle de variables d'environnement
```

Modifiés : `src/app/page.tsx` (loader DB async), `src/lib/issues.ts` (+`MODULES`, champs optionnels `email`/`assignee`/`source`), `src/lib/loadIssues.ts` (+`readExcelIssues` exporté), `src/components/Dashboard.tsx` (bouton Nouveau ticket, bandeau sync, footer), `src/components/IssueTable.tsx` (id → lien détail), `DOC.md`, `.gitignore` (`!.env.example`), `scripts/e2e-test.mjs` (ajouts de blocs), `package.json` (scripts db).

---

### Task 1 : Socle MySQL + Drizzle — schéma, migrations, import Excel, bascule du loader

**Files:**
- Create: `drizzle.config.ts`, `src/db/schema.ts`, `src/db/index.ts`, `src/lib/db.ts`, `src/lib/loadDb.ts`, `scripts/env.mjs`, `scripts/import-excel.ts`, `scripts/check-db.ts`, `.env.example`
- Modify: `src/lib/issues.ts`, `src/lib/loadIssues.ts`, `src/app/page.tsx`, `package.json`, `.gitignore`

**Interfaces:**
- Produits (utilisées par Tasks 2-6) :
  - `db` (instance Drizzle) + `pool` (mysql2) depuis `src/db/index.ts`
  - `requireWriteToken(req): boolean` depuis `src/lib/db.ts`
  - `loadIssueDataFromDb(): Promise<IssueData>` depuis `src/lib/loadDb.ts`
  - `readExcelIssues()` depuis `src/lib/loadIssues.ts`
  - Tables Drizzle : `tickets`, `ticketComments`, `ticketEvents`, `emailMessages`, `syncRuns`, `gmailTokens`, `ticketCounters` (exports de `src/db/schema.ts`)

- [ ] **Step 0 : Prérequis** — base créée + `DATABASE_URL` dans `.env.local`. Si absente → **NEEDS_CONTEXT** (demander le mot de passe ; ne rien inventer).

- [ ] **Step 1 : Dépendances + `.env.example` + `.gitignore`**

```bash
npm install drizzle-orm mysql2
npm install -D drizzle-kit
```

`.gitignore` — ajouter juste après la ligne `.env*` :

```
!.env.example
```

`.env.example` :

```
# Base de données — MySQL 8.3 local, PORT 3306
DATABASE_URL=mysql://ibn_app:MOT_DE_PASSE@localhost:3306/ibn_dashboard

# Sécurité API (optionnel) : si renseigné, les écritures exigent
# Authorization: Bearer <valeur> sur POST/PATCH
API_WRITE_TOKEN=

# Gmail — OAuth 2.0 (Google Cloud Console → Identifiants OAuth)
# Redirection à enregistrer : http://localhost:3000/api/gmail/callback
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=http://localhost:3000/api/gmail/callback
# Règles de filtrage (la création de ticket reste humaine, via /emails)
GMAIL_SYNC_LABEL=SAP
GMAIL_SENDER_DOMAINS=
GMAIL_SUBJECT_KEYWORDS=
```

- [ ] **Step 2 : `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

// Configuration drizzle-kit — dialect MySQL, schéma partagé.
// DATABASE_URL provient de .env.local (drizzle-kit lit .env automatiquement).
export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

- [ ] **Step 3 : `src/db/schema.ts` (schéma Drizzle complet)**

```ts
// ============================================================
// Schéma Drizzle ORM — MySQL 8.3 (InnoDB, utf8mb4)
// Tables : tickets, ticket_comments, ticket_events,
//          email_messages, sync_runs, gmail_tokens, ticket_counters
// ============================================================
import {
  mysqlTable, mysqlEnum, varchar, text, int, timestamp, date,
  uniqueIndex, index, primaryKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// --- listes de référence (alignées sur le classeur + issues.ts) ---
export const STATUTS = ["Not Started", "In Progress", "On Hold", "Blocked", "Closed", "waiting for Customer"] as const;
export const PRIORITES = ["Critical", "High", "Medium", "Low"] as const;

// --- tickets ---
export const tickets = mysqlTable(
  "tickets",
  {
    id: varchar("id", { length: 32 }).primaryKey(), // "11" (Excel) ou "SAP-2026-0001"
    description: text("description").notNull(),
    status: mysqlEnum("status", STATUTS).notNull().default("Not Started"),
    priority: mysqlEnum("priority", PRIORITES).notNull().default("Medium"),
    module: varchar("module", { length: 50 }).notNull().default(""),
    raisedBy: varchar("raised_by", { length: 100 }).notNull(),
    email: varchar("email", { length: 150 }).notNull().default(""),
    assignee: varchar("assignee", { length: 100 }).notNull().default(""),
    openDate: date("open_date"),
    closeDate: date("close_date"),
    payment: varchar("payment", { length: 50 }).notNull().default(""),
    comments: text("comments"), // legacy Excel (lecture seule)
    source: mysqlEnum("source", ["excel", "form", "email"]).notNull().default("form"),
    gmailMessageId: varchar("gmail_message_id", { length: 100 }), // UNIQUE si présent
    gmailThreadId: varchar("gmail_thread_id", { length: 100 }).notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [
    uniqueIndex("tickets_gmail_msg_uid").on(t.gmailMessageId),
    index("tickets_status").on(t.status),
    index("tickets_priority").on(t.priority),
  ]
);

// --- commentaires ajoutés dans l'application ---
export const ticketComments = mysqlTable("ticket_comments", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: varchar("ticket_id", { length: 32 })
    .notNull()
    .references(() => tickets.id),
  author: varchar("author", { length: 100 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- historique des changements ---
export const ticketEvents = mysqlTable("ticket_events", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: varchar("ticket_id", { length: 32 })
    .notNull()
    .references(() => tickets.id),
  field: varchar("field", { length: 50 }).notNull(),
  oldValue: text("old_value").notNull().default(""),
  newValue: text("new_value").notNull().default(""),
  changedBy: varchar("changed_by", { length: 100 }).notNull().default("application"),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
});

// --- e-mails candidats Gmail (staging) ---
export const emailMessages = mysqlTable(
  "email_messages",
  {
    gmailMessageId: varchar("gmail_message_id", { length: 100 }).primaryKey(),
    gmailThreadId: varchar("gmail_thread_id", { length: 100 }).notNull().default(""),
    subject: text("subject").notNull().default(""),
    sender: varchar("sender", { length: 200 }).notNull().default(""),
    receivedAt: timestamp("received_at"),
    bodySnippet: text("body_snippet").notNull().default(""),
    matchedRule: varchar("matched_rule", { length: 200 }).notNull().default(""),
    status: mysqlEnum("status", ["pending", "converted", "linked", "ignored"]).notNull().default("pending"),
    ticketId: varchar("ticket_id", { length: 32 }).references(() => tickets.id),
    syncedAt: timestamp("synced_at").notNull().defaultNow(),
  }
);

// --- journal des synchronisations ---
export const syncRuns = mysqlTable("sync_runs", {
  id: int("id").autoincrement().primaryKey(),
  ranAt: timestamp("ran_at").notNull().defaultNow(),
  outcome: mysqlEnum("outcome", ["ok", "error", "not_configured"]).notNull(),
  fetched: int("fetched").notNull().default(0),
  newMessages: int("new_messages").notNull().default(0),
  detail: text("detail").notNull().default(""),
});

// --- jetons OAuth Gmail (ligne unique id=1) ---
export const gmailTokens = mysqlTable("gmail_tokens", {
  id: int("id").primaryKey(), // toujours 1
  accessToken: text("access_token").notNull().default(""),
  refreshToken: text("refresh_token").notNull().default(""),
  expiry: timestamp("expiry"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- compteur atomique des numéros de ticket par année ---
export const ticketCounters = mysqlTable("ticket_counters", {
  year: int("year").primaryKey(),
  lastSeq: int("last_seq").notNull().default(0),
});

export type Ticket = typeof tickets.$inferSelect;
export type TicketEvent = typeof ticketEvents.$inferSelect;
export type TicketComment = typeof ticketComments.$inferSelect;
export type EmailMessage = typeof emailMessages.$inferSelect;
export type SyncRun = typeof syncRuns.$inferSelect;
```

- [ ] **Step 4 : `src/db/index.ts`**

```ts
// Instance Drizzle + pool mysql2 — une seule source de connexion.
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 5,
});

export const db = drizzle(pool, { schema, mode: "default" });
export { pool };
```

- [ ] **Step 5 : `src/lib/db.ts` (requireWriteToken)**

```ts
// Sécurité des écritures : si API_WRITE_TOKEN est défini, il faut
// Authorization: Bearer <token>. Vide = écritures libres (dev local).
export function requireWriteToken(req: Request): boolean {
  const expected = process.env.API_WRITE_TOKEN;
  if (!expected) return true;
  return req.headers.get("authorization") === `Bearer ${expected}`;
}
```

- [ ] **Step 6 : `scripts/env.mjs` (mini-loader .env.local pour tsx)**

```ts
// Mini-loader .env.local pour les scripts (import, check-*).
// Next.js charge .env.local tout seul ; tsx/mjs non — d'où ce fichier.
import { readFileSync } from "fs";
export function loadEnv() {
  try {
    const txt = readFileSync(".env.local", "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* pas de .env.local : on laisse les valeurs du shell */ }
}
```

- [ ] **Step 7 : Champs optionnels + MODULES dans `src/lib/issues.ts`**

Ajouter `MODULES` (liste de la feuille « Key - Do Not Delete ») et étendre `Issue` de trois champs **optionnels** (aucun impact sur les graphiques/filtres existants) :

```ts
export const MODULES = [
  "Bank", "Bank Treso", "FI_AA", "FI_AP", "FI_AR", "FI_FM", "HCM",
  "MM_CONTRACT", "MM_INVENTORY", "MM_PROCUREMENT", "BLANK", "CLOTURE", "BASIS",
] as const;
```

```ts
  email?: string;
  assignee?: string;
  source?: string;
```

- [ ] **Step 8 : Export `readExcelIssues` dans `src/lib/loadIssues.ts`**

Extraire le parseur de `loadIssueData()` en `readExcelIssues(): { issues: Issue[]; summary }` exporté ; `loadIssueData()` (Excel, synchrone) garde **exactement** le même comportement (utilisé par `check-data/sla/metrics`). Ajouter `source: "excel"` dans chaque issue parsée.

- [ ] **Step 9 : `scripts/import-excel.ts` (idempotent)**

```ts
// Import Excel → MySQL (idempotent : ON DUPLICATE KEY ne fait rien si l'id existe)
// Usage : npx tsx scripts/import-excel.ts
import { loadEnv } from "./env.mjs";
loadEnv();
import { db } from "../src/db";
import { tickets } from "../src/db/schema";
import { readExcelIssues } from "../src/lib/loadIssues";

const { issues } = readExcelIssues();
let imported = 0;
for (const i of issues) {
  await db
    .insert(tickets)
    .values({
      id: i.id,
      description: i.description,
      status: i.status as never,
      priority: i.priority as never,
      module: i.module,
      raisedBy: i.raisedBy,
      openDate: i.openDate || null,
      closeDate: i.closeDate || null,
      payment: i.payment,
      comments: i.comments,
      source: "excel",
    })
    .onDuplicateKeyUpdate({ set: { id: i.id } }); // no-op si déjà présent
  imported += 1;
}
console.log(`Import terminé : ${imported} ligne(s) traitée(s) — les ids déjà présents sont ignorés.`);
```

- [ ] **Step 10 : `src/lib/loadDb.ts` (loader Drizzle)**

```ts
// Loader MySQL via Drizzle — même shape IssueData que le lecteur Excel.
// Utilisé par la page d'accueil ; l'Excel reste pour l'import.
import fs from "fs";
import path from "path";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { isOpen, todayISO, STATUSES, type Issue, type IssueData } from "./issues";
import { readExcelIssues } from "./loadIssues";

function iso(d: Date | string | null): string {
  if (!d) return "";
  const x = new Date(d);
  if (isNaN(x.getTime())) return "";
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

export async function loadIssueDataFromDb(): Promise<IssueData> {
  const rows = await db.select().from(tickets).orderBy(tickets.id);
  const issues: Issue[] = rows.map((t) => ({
    id: t.id, description: t.description, status: t.status, priority: t.priority,
    module: t.module, raisedBy: t.raisedBy, email: t.email, openDate: iso(t.openDate),
    closeDate: iso(t.closeDate), assignee: t.assignee, payment: t.payment,
    comments: t.comments ?? "", source: t.source,
  }));

  const summary = { status: {} as Record<string, number>, priority: {} as Record<string, number>, total: issues.length };
  for (const i of issues) {
    const ks = i.status.toLowerCase();
    const kp = i.priority.toLowerCase();
    summary.status[ks] = (summary.status[ks] || 0) + 1;
    summary.priority[kp] = (summary.priority[kp] || 0) + 1;
  }

  // --- contrôles qualité (signalent, ne masquent jamais) ---
  const controls: IssueData["controls"] = [];
  const ids = issues.map((i) => i.id);
  const dup = ids.length - new Set(ids).size;
  controls.push({ label: "Doublons d'identifiants", ok: dup === 0, detail: dup === 0 ? "Aucun doublon" : `${dup} doublon(s)` });

  const statutsConnus = new Set(STATUSES.map((s) => s.toLowerCase()));
  const badStatus = issues.filter((i) => !statutsConnus.has(i.status.toLowerCase())).length;
  controls.push({ label: "Statuts connus", ok: badStatus === 0, detail: badStatus === 0 ? "Tous valides" : `${badStatus} inconnu(s)` });

  const noModule = issues.filter((i) => !i.module || i.module.toUpperCase() === "BLANK").length;
  controls.push({ label: "Module SAP renseigné", ok: noModule === 0, detail: noModule === 0 ? "Tous renseignés" : `${noModule} sans module` });

  const noRaised = issues.filter((i) => !i.raisedBy).length;
  controls.push({ label: "Demandeur renseigné", ok: noRaised === 0, detail: noRaised === 0 ? "Tous renseignés" : `${noRaised} sans demandeur` });

  const closedNoDate = issues.filter((i) => !isOpen(i) && !i.closeDate).length;
  controls.push({ label: "Clôturés avec date de clôture", ok: closedNoDate === 0, detail: closedNoDate === 0 ? "Complets" : `${closedNoDate} incomplet(s)` });

  const openNoDate = issues.filter((i) => isOpen(i) && !i.openDate).length;
  controls.push({ label: "Ouverts avec date d'ouverture", ok: openNoDate === 0, detail: openNoDate === 0 ? "Complets" : `${openNoDate} incomplet(s)` });

  const noPayment = issues.filter((i) => !i.payment).length;
  controls.push({ label: "Payment status renseigné", ok: noPayment === 0, detail: noPayment === 0 ? "Tous renseignés" : `${noPayment} sans paiement` });

  const invDates = issues.filter((i) => i.openDate && i.closeDate && i.closeDate < i.openDate).length;
  controls.push({ label: "Dates cohérentes (clôture ≥ ouverture)", ok: invDates === 0, detail: invDates === 0 ? "Conformes" : `${invDates} incohérent(s)` });

  // Fidélité de l'import
  const excelPath = path.join(process.cwd(), "data", "IBN-SAP SUPPORT-Issue-Tracking-SCDP UPDATED.xlsx");
  if (fs.existsSync(excelPath)) {
    const excelIds = readExcelIssues().issues.map((i) => i.id);
    const baseIds = new Set(ids);
    const missing = excelIds.filter((id) => !baseIds.has(id)).length;
    controls.push({
      label: "Import Excel fidèle",
      ok: missing === 0,
      detail: missing === 0 ? `Base ${issues.length} tickets` : `${missing} ticket(s) Excel absent(s) — relancer npm run db:import`,
    });
  }

  const dates: string[] = [];
  for (const i of issues) { if (i.openDate) dates.push(i.openDate); if (i.closeDate) dates.push(i.closeDate); }
  dates.sort();

  const lastRow = await db.select({ m: tickets.updatedAt }).from(tickets).orderBy(tickets.updatedAt).limit(1);
  const lastUpdate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" })
    .format(lastRow[0]?.m ?? new Date());

  return {
    issues, summary, controls,
    period: { from: dates[0] || todayISO(), to: dates[dates.length - 1] || todayISO() },
    lastUpdate,
    source: "MySQL (base ibn_dashboard)",
  };
}
```

- [ ] **Step 11 : Génération + application de la migration**

```bash
npx drizzle-kit generate    # écrit drizzle/0000_xxx.sql
npx drizzle-kit migrate     # applique la migration (table __drizzle_migrations)
```

- [ ] **Step 12 : `scripts/import-excel.ts` + `scripts/check-db.ts`**

`scripts/check-db.ts` :

```ts
// Vérification de la base : npx tsx scripts/check-db.ts
import { loadEnv } from "./env.mjs";
loadEnv();
import { db } from "../src/db";
import { tickets } from "../src/db/schema";
import { loadIssueDataFromDb } from "../src/lib/loadDb";

function assert(cond: boolean, label: string): void {
  if (!cond) { console.error(`ECHEC: ${label}`); process.exit(1); }
}

const rows = await db.select().from(tickets);
assert(rows.length >= 98, `au moins 98 tickets en base (obtenu ${rows.length})`);

const d = await loadIssueDataFromDb();
assert(d.issues.length === rows.length, "loader DB = comptage SQL");
assert(d.issues.some((i) => i.id === "11"), "ticket Excel n° 11 présent");
assert(d.controls.length >= 8, `au moins 8 contrôles (obtenu ${d.controls.length})`);

console.log(`check-db: OK (${rows.length} tickets)`);
```

- [ ] **Step 13 : Bascule `src/app/page.tsx`**

```tsx
import { connection } from "next/server";
import { loadIssueDataFromDb } from "@/lib/loadDb";
import Banner from "@/components/Banner";
import Dashboard from "@/components/Dashboard";

export const instant = false;

export default async function HomePage() {
  await connection();
  const data = await loadIssueDataFromDb();
  return (
    <div className="min-h-screen bg-zinc-50">
      <Banner />
      <Dashboard data={data} />
    </div>
  );
}
```

(Bloc `instant`/`connection()` conservé **mot pour mot**.)

- [ ] **Step 14 : Import + vérifications**

```bash
npm run db:import             # 98 tickets importés
npx tsx scripts/check-db.ts   # check-db: OK
npx tsx scripts/check-data.ts # Tickets: 98
npx tsx scripts/check-sla.ts  # check-sla: OK
npx tsc --noEmit && npm run lint
node scripts/e2e-test.mjs     # 37 succès, 0 échec
```

- [ ] **Step 15 : Commit**

```bash
git add drizzle.config.ts src/db drizzle src/lib/db.ts src/lib/loadDb.ts src/lib/issues.ts src/lib/loadIssues.ts src/app/page.tsx scripts package.json package-lock.json .gitignore .env.example
git commit -m "feat: socle MySQL + Drizzle — schéma, migration, import Excel idempotent, loader base"
```

---

### Task 2 : API de création + formulaire `/tickets/nouveau`

**Files:**
- Create: `src/lib/validate.ts`, `src/app/api/tickets/route.ts`, `src/app/tickets/nouveau/page.tsx`, `src/components/TicketForm.tsx`
- Modify: `src/components/Dashboard.tsx` (bouton Nouveau ticket), `src/components/IssueTable.tsx` (id → lien), `scripts/e2e-test.mjs`

**Interfaces:**
- Consomme : `db`, `requireWriteToken`, schéma Drizzle, `STATUSES`/`PRIORITIES`/`MODULES`
- Produits : `validateTicketInput`, `POST /api/tickets` → 201/400/401, `TicketForm`, sélecteurs `[data-ticket-form]`, `[data-create-error]`

- [ ] **Step 1 : Tests e2e qui échouent** — insérer avant `// ---- 11. Screenshots desktop + tablette ----` :

```js
// ============================================================
// ---- CREATION DE TICKET (persistance) ----
// ============================================================
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
      status: "Not Started", priority: "High", module: "MM_INVENTORY",
      raisedBy: "E2E TEST", email: "e2e.test@ibngroup.com",
    }),
  });
  const body = await res.json();
  return { status: res.status, id: body.ticket?.id ?? null };
});
check("POST /api/tickets → 201 avec id généré", created.status === 201 && /^SAP-\d{4}-\d{4}$/.test(created.id), JSON.stringify(created));

const rejected = await page.evaluate(async () => {
  const res = await fetch("/api/tickets", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description: "x", email: "pas-un-email" }),
  });
  return { status: res.status, errors: (await res.json()).errors ?? [] };
});
check("POST invalide → 400 + erreurs FR", rejected.status === 400 && rejected.errors.length >= 2, JSON.stringify(rejected));
```

- [ ] **Step 2 : e2e → 4 FAIL neufs, 37 OK.**

- [ ] **Step 3 : `src/lib/validate.ts`** — `validateTicketInput` + `validateTicketPatch` (code FR complet, dans le plan Postgres équivalent — à reprendre tel quel, sans dépendance). Règles : description ≥ 5, email regex, statut/priorité/module dans listes, dates `AAAA-MM-JJ`.

- [ ] **Step 4 : `src/app/api/tickets/route.ts` (POST)** — Drizzle transaction : lire/compter `ticketCounters` avec `.for("update")`, incrémenter, insérer ticket + premier `ticketEvents` (field `creation`). Retour 201 `{ ticket }`.

- [ ] **Step 5 : `src/components/TicketForm.tsx`** — formulaire client complet (code du plan Postgres équivalent, sans changement de logique).

- [ ] **Step 6 : Page `src/app/tickets/nouveau/page.tsx`.**

- [ ] **Step 7 : Intégration dashboard** — bouton `<Link href="/tickets/nouveau">` (PlusCircle) ; `IssueTable` id → `<Link href={`/tickets/${row.id}`}>` ; pied de page ajusté.

- [ ] **Step 8 : e2e + `tsc` + lint → 41 succès.**

- [ ] **Step 9 : Commit** `feat: création de ticket — API validée, formulaire, numéro généré, lien détail`.

---

### Task 3 : Page détail, modification, historique, commentaires

**Files:**
- Create: `src/app/api/tickets/[id]/route.ts`, `src/app/api/tickets/[id]/history/route.ts`, `src/app/api/tickets/[id]/comments/route.ts`, `src/app/tickets/[id]/page.tsx`, `src/components/TicketEditForm.tsx`, `src/components/CommentForm.tsx`
- Modify: `scripts/e2e-test.mjs`

**Interfaces:**
- Consomme : `validateTicketPatch`, `db`, `requireWriteToken`, tables Drizzle
- Produits : `GET/PATCH /api/tickets/[id]` (PATCH écrit `ticketEvents`), `GET /api/tickets/[id]/history`, `GET/POST /api/tickets/[id]/comments`, page détail avec infos + édition + historique + commentaires ; règles `Closed` ↔ `closeDate`.

- [ ] **Step 1 : Tests e2e** (détail, PATCH 2 lignes events, historique, 404 inconnu, POST commentaire) — bloc « DETAIL + HISTORIQUE » du plan Postgres, étendu d'un check commentaire.
- [ ] **Step 2 : e2e → 5-6 FAIL neufs.**
- [ ] **Step 3 : Route PATCH** — Drizzle transaction : comparer champs, écrire chaque changement dans `ticketEvents`, appliquer la règle `Closed`/`closeDate`.
- [ ] **Step 4 : Route history + route comments (GET/POST).**
- [ ] **Step 5 : `TicketEditForm.tsx` + `CommentForm.tsx` + page détail** (affiche `ticketComments` + `ticketEvents` fusionnés/ordonnés).
- [ ] **Step 6 : e2e → 51-52 succès ; `tsc` + lint.**
- [ ] **Step 7 : Commit** `feat: page détail, modification, historique des événements, commentaires`.

---

### Task 4 : Gmail préparé (OAuth, staging, validation humaine) — SANS connexion simulée

**Files:**
- Create: `src/lib/gmail/{config,oauth,client,sync}.ts`, `src/app/api/gmail/{status,auth-url,callback,sync,staging}/route.ts`, `src/app/emails/page.tsx`, `src/components/{EmailCandidates,SyncControls}.tsx`, `scripts/check-gmail.ts`
- Modify: `scripts/e2e-test.mjs`

**Interfaces:**
- Consomme : tables Drizzle `emailMessages`, `syncRuns`, `gmailTokens`, `db`, `requireWriteToken`
- Produits : `isGmailConfigured`, `buildAuthUrl`, `exchangeCode`, `getAccessToken`, `runGmailSync(fetchImpl?)` (écrit `emailMessages` + `syncRuns`), routes API, page `/emails` avec boutons **Créer le ticket** / **Rattacher à un ticket existant** / **Ignorer**. `check-gmail.ts` sur fixtures (fetch injecté). **Aucune synchro auto.**

- [ ] **Step 1 : `scripts/check-gmail.ts` (fixtures, échec d'abord)** — extraction, règles, `not_configured` sans crash (code du plan Postgres, adapté noms de tables).
- [ ] **Step 2 : `src/lib/gmail/*`** — config (env), oauth (buildUrl/exchange/refresh), client (listMessageIds/getMessage/applyRules, fetch injecté), sync (runGmailSync → insert `emailMessages` + `syncRuns` ; `lastSync()` lit `syncRuns`).
- [ ] **Step 3 : Routes API Gmail** — status, auth-url, callback, sync, **staging** (PATCH : `converted` + `ticketId` OU `linked` + `ticketId` OU `ignored`).
- [ ] **Step 4 : Page `/emails` + `EmailCandidates` (3 actions : Créer / Rattacher / Ignorer) + `SyncControls` (Connecter / Synchroniser).**
- [ ] **Step 5 : e2e** — bandeau non-configuré, sync → `not_configured` (bloc Gmail du plan Postgres).
- [ ] **Step 6 : `npx tsx scripts/check-gmail.ts` OK ; `tsc`+lint ; Commit** `feat: intégration Gmail préparée — OAuth serveur, staging, rattachement, validation humaine`.

---

### Task 5 : Synchronisation dashboard + bandeau dernière synchro

**Files:**
- Create: (aucun nouveau fichier persistant — `SyncBanner` rendu via `syncNote`)
- Modify: `src/app/page.tsx` (appelle `lastSync()` → `syncNote`), `src/components/Dashboard.tsx` (bandeau `[data-sync-banner]` + lien `/emails`), `scripts/e2e-test.mjs`

**Interfaces:**
- Consomme : `lastSync()`, `isGmailConfigured()`
- Produits : bandeau d'état ; création/modif → `revalidatePath("/")` (déjà en Task 2/3) → KPI/graphiques/tableau rafraîchis.

- [ ] **Step 1 : Test e2e** — bandeau + lien /emails.
- [ ] **Step 2 : e2e → 2 FAIL.**
- [ ] **Step 3 : `page.tsx` calcule `syncNote` ; `Dashboard` l'affiche.**
- [ ] **Step 4 : e2e → 55 succès ; `tsc`+lint ; `npm run build`.**
- [ ] **Step 5 : Commit** `feat: bandeau dernière synchro Gmail + rafraîchissement KPI après mutation`.

---

### Task 6 : Tests obligatoires (brève §G) + documentation finale

**Files:**
- Create: `scripts/check-security.ts`
- Modify: `DOC.md`, `scripts/e2e-test.mjs` (bloc non-régression)

**Interfaces:**
- Consomme : tous les modules
- Produits : `check-security.ts` (validation, token, unicité, injection) ; DOC.md §Tickets/§Gmail ; e2e final.

Couverture explicite de la brève §G :
1. **Création + persistance** → e2e Task 2 (reload + `check-db`).
2. **Modification + historique** → e2e Task 3.
3. **Import sans doublons** → `check-db` (import relancé = 0 ajout) + contrôles.
4. **KPI/graphiques rafraîchis** → e2e Task 5 (revalidate).
5. **Filtrage croisé existant** → les 37 tests initiaux toujours verts.
6. **Erreurs validation + base** → `check-security` + e2e 400.
7. **TypeScript, ESLint, tests, build** → `tsc`, `lint`, `e2e` complet, `npm run build`.

- [ ] **Step 1 : `scripts/check-security.ts`** (validation, token, unicité, injection SQL via Drizzle paramétré, caractères spéciaux).
- [ ] **Step 2 : e2e bloc non-régression** (KPI > 98, lien détail, injection, ticket n° 1 toujours là).
- [ ] **Step 3 : Vérifications complètes** : check-data/sla/metrics/db/gmail/security + `tsc` + `lint` + `build` + e2e final.
- [ ] **Step 4 : `DOC.md`** — sections : tickets persistants (MySQL/Drizzle), modèle de données, commandes (`db:migrate`, `db:import`, `db:check`), variables d'environnement, Gmail (prérequis OAuth, aucun secret, pas de synchro auto), Odoo (inaccessible, pont futur).
- [ ] **Step 5 : Commit + push** `test+docs: sécurité, non-régression, documentation MySQL/Drizzle/Gmail` → `git push origin main`.

---

## Résumé de livraison attendu (fin de Phase 1)

- **Fichiers modifiés/créés** : listés par task ci-dessus.
- **Commandes** : `npm install`, `npx drizzle-kit generate`, `npx drizzle-kit migrate`, `npm run db:import`, `npm run db:check`.
- **Tests réussis** : check-data/sla/metrics/db/gmail/security + e2e complet (cible ~55, réel noté dans DOC.md) + `tsc` + `lint` + `build`.
- **Prérequis Gmail restants** : créer un projet Google Cloud, un client OAuth 2.0 (redirection `http://localhost:3000/api/gmail/callback`), renseigner `GMAIL_CLIENT_ID`/`SECRET` dans `.env.local`, autoriser l'accès à la boîte, puis « Connecter Gmail » sur `/emails`. Tant que ce n'est pas fait, l'application affiche « non configuré » et n'invente rien.
