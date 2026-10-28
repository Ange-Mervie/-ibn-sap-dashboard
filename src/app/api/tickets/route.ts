// POST /api/tickets — création d'un ticket dans MySQL.
// Numéro lisible SAP-YYYY-NNNN généré via la table ticket_counters (sans collision).
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tickets, ticketCounters, ticketEvents, type Ticket } from "@/db/schema";
import { requireWriteToken, jsonError } from "@/lib/db";
import { validateTicketInput } from "@/lib/validate";

export async function POST(req: Request) {
  if (!requireWriteToken(req)) {
    return jsonError(401, "Authentification requise : en-tête Authorization manquant ou invalide.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Corps JSON invalide.");
  }

  const { data, errors } = validateTicketInput(body);
  if (!data) return jsonError(400, "Données invalides.", errors);

  const year = new Date().getFullYear();

  try {
    const ticket = await db.transaction(async (tx): Promise<Ticket> => {
      // Compteur atomique par année : INSERT IGNORE + UPDATE verrouillé (InnoDB)
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
        changedBy: data.raisedBy || "application",
      });

      const [saved] = await tx.select().from(tickets).where(eq(tickets.id, id));
      if (!saved) throw new Error("ticket relu introuvable après insertion");
      return saved;
    });

    revalidatePath("/"); // KPI, graphiques et tableau rafraîchis
    return Response.json({ ticket }, { status: 201 });
  } catch (err) {
    return jsonError(500, `Échec de la création : ${err instanceof Error ? err.message : "erreur inconnue"}`);
  }
}
