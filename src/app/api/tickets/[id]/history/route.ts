// GET /api/tickets/[id]/history — historique des événements (ticket_events).
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ticketEvents, tickets } from "@/db/schema";
import { jsonError } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canReadTicket } from "@/lib/access";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié. Veuillez vous connecter.");

  const { id } = await params;
  const [ticket] = await db.select({ id: tickets.id, assignee: tickets.assignee }).from(tickets).where(eq(tickets.id, id));
  if (!ticket) return jsonError(404, `Ticket introuvable : ${id}`);
  if (!canReadTicket(session.role, ticket.assignee, session.email)) return jsonError(403, "Accès refusé.");
  const events = await db.select().from(ticketEvents).where(eq(ticketEvents.ticketId, id));
  return Response.json({ events });
}
