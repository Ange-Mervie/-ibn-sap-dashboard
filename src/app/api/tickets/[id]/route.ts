// GET : consulter un ticket (avec historique + commentaires)
// PATCH : modifier un ticket (écrit ticket_events) — AGENT, ADMIN, MANAGER
// DELETE : supprimer un ticket — ADMIN uniquement
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tickets, ticketEvents, ticketComments, type Ticket } from "@/db/schema";
import { jsonError } from "@/lib/db";
import { getSession, canWrite, canManage, canAdmin } from "@/lib/auth";
import { validateTicketPatch } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié. Veuillez vous connecter.");

  const { id } = await params;

  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1);

  if (!ticket) {
    return jsonError(404, `Ticket introuvable : ${id}`);
  }

  const events = await db
    .select()
    .from(ticketEvents)
    .where(eq(ticketEvents.ticketId, id));

  const comments = await db
    .select()
    .from(ticketComments)
    .where(eq(ticketComments.ticketId, id));

  return Response.json({ ticket, events, comments });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié. Veuillez vous connecter.");
  if (!canWrite(session.role) && !canManage(session.role)) return jsonError(403, "Accès refusé. Votre rôle ne permet pas la modification de tickets.");

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Corps JSON invalide.");
  }

  const { data, errors } = validateTicketPatch(body);
  if (!data) {
    return jsonError(400, "Données invalides.", errors);
  }

  const existing = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1);

  if (!existing[0]) {
    return jsonError(404, `Ticket introuvable : ${id}`);
  }

  const changes: { field: string; oldValue: string; newValue: string }[] = [
    { field: "status", oldValue: existing[0].status, newValue: data.status ?? existing[0].status },
    { field: "priority", oldValue: existing[0].priority, newValue: data.priority ?? existing[0].priority },
    { field: "assignee", oldValue: existing[0].assignee, newValue: data.assignee ?? existing[0].assignee },
    { field: "module", oldValue: existing[0].module, newValue: data.module ?? existing[0].module },
    { field: "description", oldValue: existing[0].description, newValue: data.description ?? existing[0].description },
  ];
  const filtered = changes.filter((c) => (c.oldValue ?? "") !== (c.newValue ?? ""));

  await db.transaction(async (tx) => {
    const statusValue = filtered.find((c) => c.field === "status")?.newValue as Ticket["status"];
    const priorityValue = filtered.find((c) => c.field === "priority")?.newValue as Ticket["priority"];
    await tx
      .update(tickets)
      .set({
        status: statusValue ?? existing[0].status,
        priority: priorityValue ?? existing[0].priority,
        assignee: filtered.find((c) => c.field === "assignee")?.newValue ?? existing[0].assignee,
        module: filtered.find((c) => c.field === "module")?.newValue ?? existing[0].module,
        description: filtered.find((c) => c.field === "description")?.newValue ?? existing[0].description,
      })
      .where(eq(tickets.id, id));

    for (const change of filtered) {
      await tx.insert(ticketEvents).values({
        ticketId: id,
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        changedBy: session.name,
      });
    }
  });

  const [updated] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1);

  revalidatePath("/");
  revalidatePath(`/tickets/${id}`);

  return Response.json({ ticket: updated });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié. Veuillez vous connecter.");
  if (!canAdmin(session.role)) return jsonError(403, "Accès refusé. Seuls les administrateurs peuvent supprimer des tickets.");

  const { id } = await params;

  const rows = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1);

  if (rows.length === 0) {
    return jsonError(404, `Ticket introuvable : ${id}`);
  }

  await db.delete(ticketComments).where(eq(ticketComments.ticketId, id));
  await db.delete(ticketEvents).where(eq(ticketEvents.ticketId, id));
  await db.delete(tickets).where(eq(tickets.id, id));

  revalidatePath("/");
  return Response.json({ deleted: id });
}
