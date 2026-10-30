// API évaluations de travail — /api/evaluations
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { workEvaluations, interventionReports, EVALUATION_DECISIONS } from "@/db/schema";
import { getSession, canManage } from "@/lib/auth";
import { jsonError } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié.");
  if (!canManage(session.role)) return jsonError(403, "Accès refusé. Rôle non autorisé.");

  const url = new URL(req.url);
  const ticketId = url.searchParams.get("ticketId") ?? "";

  const rows = await db
    .select()
    .from(workEvaluations)
    .where(eq(workEvaluations.ticketId, ticketId))
    .orderBy(desc(workEvaluations.evaluatedAt));

  return Response.json({ evaluations: rows });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié.");
  if (!canManage(session.role)) return jsonError(403, "Accès refusé. Rôle réservé aux administrateurs et managers.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Corps JSON invalide.");
  }
  const raw = body as Record<string, unknown>;

  const ticketId = typeof raw.ticketId === "string" ? raw.ticketId : "";
  const reportId = Number(raw.reportId);
  const agentId = typeof raw.agentId === "string" ? raw.agentId : "";
  const quality = Number(raw.quality);
  const deadlineRespect = raw.deadlineRespect === true;
  const solutionRelevance = Number(raw.solutionRelevance);
  const autonomy = Number(raw.autonomy);
  const observations = typeof raw.observations === "string" ? raw.observations : "";
  const decisionRaw = typeof raw.decision === "string" ? raw.decision : "";
  const decision = decisionRaw as "validated" | "to_correct" | "rejected";

  if (!ticketId) return jsonError(400, "Le ticket est requis.");
  if (!Number.isInteger(reportId) || reportId <= 0) return jsonError(400, "Le compte rendu est requis.");
  if (!agentId) return jsonError(400, "L'agent est requis.");
  if (!Number.isInteger(quality) || quality < 1 || quality > 5) return jsonError(400, "La qualité doit être un entier de 1 à 5.");
  if (!Number.isInteger(solutionRelevance) || solutionRelevance < 1 || solutionRelevance > 5) return jsonError(400, "La pertinence doit être un entier de 1 à 5.");
  if (!Number.isInteger(autonomy) || autonomy < 1 || autonomy > 5) return jsonError(400, "L'autonomie doit être un entier de 1 à 5.");
  if (!(EVALUATION_DECISIONS as readonly string[]).includes(decisionRaw)) {
    return jsonError(400, "La décision est invalide. Valeurs : validated, to_correct, rejected.");
  }

  await db.insert(workEvaluations).values({
    ticketId,
    reportId,
    agentId,
    quality,
    deadlineRespect,
    solutionRelevance,
    autonomy,
    observations,
    decision,
    evaluatedBy: session.email,
  });

  await db
    .update(interventionReports)
    .set({ status: decision })
    .where(eq(interventionReports.id, reportId));

  const evaluations = await db
    .select()
    .from(workEvaluations)
    .where(eq(workEvaluations.ticketId, ticketId))
    .orderBy(desc(workEvaluations.evaluatedAt));

  return Response.json({ evaluations }, { status: 201 });
}
