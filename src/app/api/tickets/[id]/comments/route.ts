// POST /api/tickets/[id]/comments — ajout d'un commentaire sur un ticket.
// Exige une session active (AGENT, ADMIN ou MANAGER).
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ticketComments, ticketEvents, tickets } from "@/db/schema";
import { jsonError } from "@/lib/db";
import { getSession, canWrite } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié. Veuillez vous connecter.");
  if (!canWrite(session.role)) return jsonError(403, "Accès refusé. Votre rôle ne permet pas d'ajouter des commentaires.");

  const { id } = await params;
  const ticketRows = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, id));
  if (ticketRows.length === 0) return jsonError(404, `Ticket introuvable : ${id}`);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Corps JSON invalide.");
  }

  // L'auteur provient de la session pour éviter l'usurpation d'identité.
  const author = session.name;
  const message = String((body as { body?: unknown })?.body ?? "").trim();
  if (!author || !message) return jsonError(400, "Le nom et le commentaire sont obligatoires.");

  await db.transaction(async (tx) => {
    await tx.insert(ticketComments).values({ ticketId: id, author, body: message });
    await tx.insert(ticketEvents).values({
      ticketId: id,
      field: "commentaire",
      oldValue: "",
      newValue: `Commentaire ajouté par ${author}`,
      changedBy: author,
    });
  });

  revalidatePath("/");
  revalidatePath(`/tickets/${id}`);
  return Response.json({ ok: true }, { status: 201 });
}
