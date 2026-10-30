// ============================================================
// Schéma Drizzle ORM — MySQL 8.3 (InnoDB, utf8mb4)
// Tables : users, tickets, ticket_comments, ticket_events,
//          email_messages, sync_runs, gmail_tokens, ticket_counters
// ============================================================
import {
  mysqlTable,
  mysqlEnum,
  varchar,
  text,
  int,
  boolean,
  timestamp,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

// --- listes de référence (alignées sur le classeur + issues.ts) ---
export const STATUTS = [
  "Not Started",
  "In Progress",
  "On Hold",
  "Blocked",
  "Closed",
  "waiting for Customer",
] as const;
export const PRIORITES = ["Critical", "High", "Medium", "Low"] as const;
export const SOURCES = ["excel", "form", "email"] as const;
export const EMAIL_STATUSES = ["pending", "converted", "linked", "ignored"] as const;
export const SYNC_OUTCOMES = ["ok", "error", "not_configured"] as const;

// --- évaluations de travail (Partie 7) ---
export const EVALUATION_DECISIONS = ["validated", "to_correct", "rejected"] as const;

export const workEvaluations = mysqlTable(
  "work_evaluations",
  {
    id: int("id").autoincrement().primaryKey(),
    ticketId: varchar("ticket_id", { length: 32 })
      .notNull()
      .references(() => tickets.id),
    reportId: int("report_id").notNull(),
    agentId: varchar("agent_id", { length: 100 }).notNull(),
    quality: int("quality").notNull().default(3),
    deadlineRespect: boolean("deadline_respect").notNull().default(true),
    solutionRelevance: int("solution_relevance").notNull().default(3),
    autonomy: int("autonomy").notNull().default(3),
    observations: text("observations").notNull().default(""),
    decision: mysqlEnum("decision", EVALUATION_DECISIONS).notNull(),
    evaluatedBy: varchar("evaluated_by", { length: 100 }).notNull(),
    evaluatedAt: timestamp("evaluated_at").notNull().defaultNow(),
  },
  (t) => [
    index("work_evaluations_ticket").on(t.ticketId),
    index("work_evaluations_agent").on(t.agentId),
  ]
);

export type WorkEvaluation = typeof workEvaluations.$inferSelect;
export type NewWorkEvaluation = typeof workEvaluations.$inferInsert;

// --- comptes rendus d'intervention (Partie 6) ---
export const REPORT_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "to_correct",
  "validated",
  "rejected",
] as const;

// --- rôles utilisateurs (MANAGER préparé pour évolution future) ---
export const ROLES = ["admin", "agent", "viewer", "manager"] as const;
export type Role = (typeof ROLES)[number];

// --- utilisateurs (authentification RBAC) ---
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 150 }).notNull(),
    // Mot de passe stocké uniquement sous forme de hash scrypt — jamais en clair
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: mysqlEnum("role", ROLES).notNull().default("viewer"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [
    uniqueIndex("users_email_uid").on(t.email),
    index("users_role").on(t.role),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

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
    source: mysqlEnum("source", SOURCES).notNull().default("form"),
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

// --- comptes rendus d'intervention (Partie 6) ---
export const interventionReports = mysqlTable(
  "intervention_reports",
  {
    id: int("id").autoincrement().primaryKey(),
    ticketId: varchar("ticket_id", { length: 32 })
      .notNull()
      .references(() => tickets.id),
    agentId: varchar("agent_id", { length: 100 }).notNull(),
    status: mysqlEnum("status", REPORT_STATUSES).notNull().default("draft"),
    interventionDate: date("intervention_date"),
    nature: varchar("nature", { length: 255 }).notNull().default(""),
    description: text("description").notNull().default(""),
    actions: text("actions").notNull().default(""),
    result: text("result").notNull().default(""),
    advancement: varchar("advancement", { length: 100 }).notNull().default(""),
    difficulties: text("difficulties").notNull().default(""),
    remaining: text("remaining").notNull().default(""),
    timeSpent: int("time_spent").notNull().default(0),
    nextAction: varchar("next_action", { length: 255 }).notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [
    index("intervention_reports_ticket").on(t.ticketId),
    index("intervention_reports_agent").on(t.agentId),
  ]
);

export type InterventionReport = typeof interventionReports.$inferSelect;
export type NewInterventionReport = typeof interventionReports.$inferInsert;

// --- e-mails candidats Gmail (staging) ---
export const emailMessages = mysqlTable("email_messages", {
  gmailMessageId: varchar("gmail_message_id", { length: 100 }).primaryKey(),
  gmailThreadId: varchar("gmail_thread_id", { length: 100 }).notNull().default(""),
  subject: text("subject").notNull().default(""),
  sender: varchar("sender", { length: 200 }).notNull().default(""),
  receivedAt: timestamp("received_at"),
  bodySnippet: text("body_snippet").notNull().default(""),
  matchedRule: varchar("matched_rule", { length: 200 }).notNull().default(""),
  status: mysqlEnum("status", EMAIL_STATUSES).notNull().default("pending"),
  ticketId: varchar("ticket_id", { length: 32 }).references(() => tickets.id),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
});

// --- journal des synchronisations ---
export const syncRuns = mysqlTable("sync_runs", {
  id: int("id").autoincrement().primaryKey(),
  ranAt: timestamp("ran_at").notNull().defaultNow(),
  outcome: mysqlEnum("outcome", SYNC_OUTCOMES).notNull(),
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
export type NewTicket = typeof tickets.$inferInsert;
export type TicketEvent = typeof ticketEvents.$inferSelect;
export type TicketComment = typeof ticketComments.$inferSelect;
export type EmailMessage = typeof emailMessages.$inferSelect;
export type SyncRun = typeof syncRuns.$inferSelect;
