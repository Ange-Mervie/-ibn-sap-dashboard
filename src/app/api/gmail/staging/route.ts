// PATCH /api/gmail/staging — valider manuellement un candidat Gmail.
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailMessages, tickets } from "@/db/schema";
import { jsonError } from "@/lib/db";

export async function PATCH(req: Request) {
  const { gmailMessageId, action, ticketId } = (await req.json().catch(() => ({}))) as {
    gmailMessageId?: string;
    action?: string;
    ticketId?: string;
  };

  if (!gmailMessageId || !action) {
    return jsonError(400, "gmailMessageId et action sont requis.");
  }
  if (action !== "converted" && action !== "linked" && action !== "ignored") {
    return jsonError(400, "action invalide : converted | linked | ignored.");
  }
  if (action === "linked" && !ticketId) {
    return jsonError(400, "ticketId requis pour action=linked.");
  }

  const existing = await db
    .select()
    .from(emailMessages)
    .where(eq(emailMessages.gmailMessageId, gmailMessageId));
  const msg = existing[0];
  if (!msg) {
    return jsonError(404, `Candidat Gmail introuvable : ${gmailMessageId}`);
  }

  await db
    .update(emailMessages)
    .set({
      status: action,
      ticketId: action === "ignored" ? null : ticketId ?? msg.ticketId ?? null,
    })
    .where(eq(emailMessages.gmailMessageId, gmailMessageId));

  if (action === "linked" && ticketId) {
    const t = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
    if (!t[0]) {
      return jsonError(404, `Ticket introuvable : ${ticketId}`);
    }
  }

  return Response.json({ gmailMessageId, action });
}
