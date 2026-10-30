// GET /api/tickets/[id]/history — historique des événements (ticket_events).
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ticketEvents, tickets } from "@/db/schema";
import { jsonError } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié. Veuillez vous connecter.");

  const { id } = await params;
  const ticketRows = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, id));
  if (ticketRows.length === 0) return jsonError(404, `Ticket introuvable : ${id}`);
  const events = await db.select().from(ticketEvents).where(eq(ticketEvents.ticketId, id));
  return Response.json({ events });
}
