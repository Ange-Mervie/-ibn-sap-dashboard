// API suivi des paiements — /api/payments
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { workPayments, tickets, PAYMENT_STATUSES } from "@/db/schema";
import { getSession, canManage } from "@/lib/auth";
import { jsonError } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié.");
  if (!canManage(session.role)) return jsonError(403, "Accès refusé. Rôle réservé aux administrateurs et managers.");

  const url = new URL(req.url);
  const ticketId = url.searchParams.get("ticketId") ?? "";

  const rows = await db
    .select()
    .from(workPayments)
    .where(eq(workPayments.ticketId, ticketId))
    .orderBy(desc(workPayments.createdAt));

  return Response.json({ payments: rows });
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
  const agentId = typeof raw.agentId === "string" ? raw.agentId : "";
  const nature = typeof raw.nature === "string" ? raw.nature : "";
  const amountPlanned = Number(raw.amountPlanned);
  const amountPaid = Number(raw.amountPaid);
  const interventionDateRaw = typeof raw.interventionDate === "string" ? raw.interventionDate : "";
  const paymentStatus = typeof raw.paymentStatus === "string" ? raw.paymentStatus : "to_pay";
  const paymentDateRaw = typeof raw.paymentDate === "string" ? raw.paymentDate : "";
  const paymentMode = typeof raw.paymentMode === "string" ? raw.paymentMode : "";
  const transactionRef = typeof raw.transactionRef === "string" ? raw.transactionRef : "";
  const proof = typeof raw.proof === "string" ? raw.proof : "";
  const comment = typeof raw.comment === "string" ? raw.comment : "";

  if (!ticketId) return jsonError(400, "Le ticket est requis.");
  if (!agentId) return jsonError(400, "L'agent est requis.");
  if (!Number.isInteger(amountPlanned) || amountPlanned < 0) return jsonError(400, "Le montant prévu est invalide.");
  if (!Number.isInteger(amountPaid) || amountPaid < 0) return jsonError(400, "Le montant payé est invalide.");
  if (!Number.isInteger(paymentStatus) && !(PAYMENT_STATUSES as readonly string[]).includes(paymentStatus)) {
    return jsonError(400, "Le statut du paiement est invalide.");
  }
  if (!Number.isInteger(amountPaid) || amountPaid < 0) return jsonError(400, "Le montant payé est invalide.");

  const ticket = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticket[0]) return jsonError(404, "Ticket introuvable.");

  const balance = Math.max(0, amountPlanned - amountPaid);

  await db
    .insert(workPayments)
    .values({
      ticketId,
      agentId,
      nature,
      amountPlanned,
      amountPaid,
      balance,
      interventionDate: interventionDateRaw ? new Date(interventionDateRaw) : null,
      validationStatus: "validated",
      paymentStatus: paymentStatus as "not_billable" | "to_pay" | "pending" | "partial" | "paid",
      paymentDate: paymentDateRaw ? new Date(paymentDateRaw) : null,
      paymentMode,
      transactionRef,
      proof,
      comment,
    });

  const payments = await db
    .select()
    .from(workPayments)
    .where(eq(workPayments.ticketId, ticketId))
    .orderBy(desc(workPayments.createdAt));
  const payment = payments[0];

  return Response.json({ payments }, { status: 201 });
}
