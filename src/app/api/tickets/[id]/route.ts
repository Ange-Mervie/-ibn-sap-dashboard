// GET /api/tickets/[id]  — détail d'un ticket.
// DELETE /api/tickets/[id] — suppression (utilisé par les tests e2e).
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tickets, ticketEvents, ticketComments } from "@/db/schema";
import { requireWriteToken, jsonError } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const rows = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  const ticket = rows[0];
  if (!ticket) return jsonError(404, `Ticket introuvable : ${id}`);

  const events = await db.select().from(ticketEvents).where(eq(ticketEvents.ticketId, id));
  const comments = await db.select().from(ticketComments).where(eq(ticketComments.ticketId, id));
  return Response.json({ ticket, events, comments });
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!requireWriteToken(req)) {
    return jsonError(401, "Authentification requise : en-tête Authorization manquant ou invalide.");
  }
  const { id } = await params;
  const rows = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, id)).limit(1);
  if (!rows[0]) return jsonError(404, `Ticket introuvable : ${id}`);

  await db.delete(ticketComments).where(eq(ticketComments.ticketId, id));
  await db.delete(ticketEvents).where(eq(ticketEvents.ticketId, id));
  await db.delete(tickets).where(eq(tickets.id, id));
  revalidatePath("/");
  return Response.json({ deleted: id });
}
