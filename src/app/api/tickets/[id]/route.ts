// GET : consulter un ticket
// PATCH : modifier un ticket
// DELETE : supprimer un ticket

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  tickets,
  ticketEvents,
  ticketComments,
  STATUTS,
  PRIORITES,
} from "@/db/schema";
import { requireWriteToken, jsonError } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
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
  if (!requireWriteToken(req)) {
    return jsonError(401, "Authentification requise : en-tête Authorization manquant ou invalide.");
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Corps JSON invalide.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError(400, "Données invalides.");
  }

  const input = body as Record<string, unknown>;
  const allowedFields = [
    "description",
    "status",
    "priority",
    "module",
    "raisedBy",
    "email",
    "assignee",
    "payment",
  ] as const;

  const updates: Record<string, string> = {};

  for (const field of allowedFields) {
    if (field in input) {
      if (typeof input[field] !== "string") {
        return jsonError(400, `Le champ ${field} doit être du texte.`);
      }
      updates[field] = input[field] as string;
    }
  }

  if (Object.keys(updates).length === 0) {
    return jsonError(400, "Aucune modification fournie.");
  }

  if ("description" in updates && !updates.description.trim()) {
    return jsonError(400, "La description ne peut pas être vide.");
  }

  if (
    "status" in updates &&
    !STATUTS.includes(updates.status as (typeof STATUTS)[number])
  ) {
    return jsonError(400, "Statut invalide.");
  }

  if (
    "priority" in updates &&
    !PRIORITES.includes(updates.priority as (typeof PRIORITES)[number])
  ) {
    return jsonError(400, "Priorité invalide.");
  }

  const [existing] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1);

  if (!existing) {
    return jsonError(404, `Ticket introuvable : ${id}`);
  }

  try {
    await db.transaction(async (tx) => {
      for (const [field, newValue] of Object.entries(updates)) {
        const oldValue = String(
          existing[field as keyof typeof existing] ?? ""
        );

        if (oldValue !== newValue) {
          await tx.insert(ticketEvents).values({
            ticketId: id,
            field,
            oldValue,
            newValue,
            changedBy: "application",
          });
        }
      }

      await tx
        .update(tickets)
        .set(updates)
        .where(eq(tickets.id, id));
    });

    const [updated] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1);

    revalidatePath("/");
    revalidatePath(`/tickets/${id}`);

    return Response.json({ ticket: updated });
  } catch {
    return jsonError(500, "Échec de la modification du ticket.");
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!requireWriteToken(req)) {
    return jsonError(401, "Authentification requise : en-tête Authorization manquant ou invalide.");
  }

  const { id } = await params;

  const [existing] = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1);

  if (!existing) {
    return jsonError(404, `Ticket introuvable : ${id}`);
  }

  await db.delete(ticketComments).where(eq(ticketComments.ticketId, id));
  await db.delete(ticketEvents).where(eq(ticketEvents.ticketId, id));
  await db.delete(tickets).where(eq(tickets.id, id));

  revalidatePath("/");
  return Response.json({ deleted: id });
}