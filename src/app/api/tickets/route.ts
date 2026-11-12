// GET : liste des tickets (ADMIN / MANAGER : tous Â· AGENT : les siens)
// POST : crÃ©ation d'un ticket dans MySQL.
// NumÃ©ro lisible SAP-YYYY-NNNN gÃ©nÃ©rÃ© via la table ticket_counters (sans collision).
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tickets, ticketCounters, ticketEvents, type Ticket } from "@/db/schema";
import { jsonError } from "@/lib/db";
import { getSession, canWrite } from "@/lib/auth";
import { validateTicketInput } from "@/lib/validate";

// GET /api/tickets â€” liste des tickets accessibles Ã  la session.
export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifiÃ©. Veuillez vous connecter.");

  if (session.role === "admin" || session.role === "manager") {
    const rows = await db.select().from(tickets).orderBy(tickets.id);
    return Response.json({ tickets: rows });
  }

  if (session.role === "agent") {
    const rows = await db
      .select()
      .from(tickets)
      .where(eq(tickets.assignee, session.email))
      .orderBy(tickets.id);
    return Response.json({ tickets: rows });
  }

  return jsonError(403, "AccÃ¨s refusÃ©. RÃ´le non autorisÃ© Ã  consulter les tickets.");
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifiÃ©. Veuillez vous connecter.");
  if (!canWrite(session.role)) return jsonError(403, "AccÃ¨s refusÃ©. Votre rÃ´le ne permet pas la crÃ©ation de tickets.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Corps JSON invalide.");
  }

  const { data, errors } = validateTicketInput(body);
  if (!data) return jsonError(400, "DonnÃ©es invalides.", errors);

  const year = new Date().getFullYear();

  try {
    const ticket = await db.transaction(async (tx): Promise<Ticket> => {
      await tx.insert(ticketCounters).ignore().values({ year, lastSeq: 0 });
      await tx
        .update(ticketCounters)
        .set({ lastSeq: sql`${ticketCounters.lastSeq} + 1` })
        .where(eq(ticketCounters.year, year));
      const counters = await tx.select().from(ticketCounters).where(eq(ticketCounters.year, year));
      const id = `SAP-${year}-${String(counters[0]?.lastSeq ?? 1).padStart(4, "0")}`;

      const [row] = await tx
        .insert(tickets)
        .values({
          id,
          description: data.description,
          status: data.status as Ticket["status"],
          priority: data.priority as Ticket["priority"],
          module: data.module,
          raisedBy: data.raisedBy,
          email: data.email,
          assignee: data.assignee,
          createdBy: session.email,
          openDate: data.openDate ? new Date(data.openDate + "T00:00:00") : null,
          closeDate: data.closeDate ? new Date(data.closeDate + "T00:00:00") : null,
          payment: data.payment,
          source: "form",
        })
        .execute();
      if (row.affectedRows === 0) throw new Error("insertion sans effet");

      await tx.insert(ticketEvents).values({
        ticketId: id,
        field: "creation",
        oldValue: "",
        newValue: id,
        changedBy: session.name,
      });

      const [saved] = await tx.select().from(tickets).where(eq(tickets.id, id));
      if (!saved) throw new Error("ticket relu introuvable aprÃ¨s insertion");
      return saved;
    });

    revalidatePath("/");
    return Response.json({ ticket }, { status: 201 });
  } catch (err) {
    return jsonError(500, `Ã‰chec de la crÃ©ation : ${err instanceof Error ? err.message : "erreur inconnue"}`);
  }
}


