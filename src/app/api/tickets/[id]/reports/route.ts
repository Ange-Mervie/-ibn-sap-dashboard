// API comptes rendus d'intervention — /api/tickets/[id]/reports
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tickets, interventionReports, ticketEvents, REPORT_STATUSES } from "@/db/schema";
import { getSession, canWrite } from "@/lib/auth";
import { jsonError } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

function isReportStatus(v: unknown): v is (typeof REPORT_STATUSES)[number] {
  return typeof v === "string" && (REPORT_STATUSES as readonly string[]).includes(v);
}

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié.");
  if (session.role === "viewer") return jsonError(403, "Accès refusé. Rôle consultation uniquement.");

  const { id } = await params;
  const ticket = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  if (!ticket[0]) return jsonError(404, "Ticket introuvable.");

  const reports = await db
    .select()
    .from(interventionReports)
    .where(eq(interventionReports.ticketId, id))
    .orderBy(desc(interventionReports.createdAt));

  let scoped = reports;
  if (session.role === "agent") {
    scoped = reports.filter((r) => r.agentId.toLowerCase() === session.email.toLowerCase());
  }

  return Response.json({ reports: scoped });
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié.");
  if (!canWrite(session.role)) return jsonError(403, "Accès refusé. Rôle non autorisé.");

  const { id } = await params;
  const ticket = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  if (!ticket[0]) return jsonError(404, "Ticket introuvable.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Corps JSON invalide.");
  }
  const raw = body as Record<string, unknown>;

  const agentId = (session.role === "admin" && typeof raw.agentId === "string" ? raw.agentId : session.email).trim();
  const interventionDateRaw = typeof raw.interventionDate === "string" ? raw.interventionDate : "";
  const interventionDate = interventionDateRaw ? new Date(interventionDateRaw) : null;
  const nature = typeof raw.nature === "string" ? raw.nature.trim() : "";
  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  const actions = typeof raw.actions === "string" ? raw.actions.trim() : "";
  const result = typeof raw.result === "string" ? raw.result.trim() : "";
  const advancement = typeof raw.advancement === "string" ? raw.advancement.trim() : "";
  const difficulties = typeof raw.difficulties === "string" ? raw.difficulties.trim() : "";
  const remaining = typeof raw.remaining === "string" ? raw.remaining.trim() : "";
  const nextAction = typeof raw.nextAction === "string" ? raw.nextAction.trim() : "";
  const timeSpent = Number(raw.timeSpent);
  const status = isReportStatus(raw.status) ? raw.status : "draft";

  const missing: string[] = [];
  if (!interventionDate) missing.push("La date de l'intervention est requise.");
  if (!nature) missing.push("La nature du travail est requise.");
  if (!description) missing.push("La description du travail réalisé est requise.");
  if (!actions) missing.push("Les actions effectuées sont requises.");
  if (!result) missing.push("Le résultat obtenu est requis.");
  if (!advancement) missing.push("L'état d'avancement est requis.");
  if (!remaining) missing.push("Le travail restant est requis.");
  if (!nextAction) missing.push("La prochaine action prévue est requise.");
  if (Number.isNaN(timeSpent) || timeSpent < 0) missing.push("Le temps passé est invalide.");
  if (missing.length > 0) return jsonError(400, "Données du compte rendu invalides.", missing);

  if (session.role === "agent" && ticket[0].assignee.toLowerCase() !== session.email.toLowerCase()) {
    return jsonError(403, "Accès refusé. Ce ticket n'est pas assigné à cet agent.");
  }

  await db.insert(interventionReports).values({
    ticketId: id,
    agentId,
    status,
    interventionDate,
    nature,
    description,
    actions,
    result,
    advancement,
    difficulties,
    remaining,
    timeSpent: Math.floor(timeSpent),
    nextAction,
  });

  if (status === "submitted") {
    await db.insert(ticketEvents).values({
      ticketId: id,
      field: "report",
      oldValue: ticket[0].status,
      newValue: status,
      changedBy: agentId,
    });
  }

  revalidatePath(`/tickets/${id}`);

  const reports = await db
    .select()
    .from(interventionReports)
    .where(eq(interventionReports.ticketId, id))
    .orderBy(desc(interventionReports.createdAt));

  return Response.json({ reports }, { status: 201 });
}
