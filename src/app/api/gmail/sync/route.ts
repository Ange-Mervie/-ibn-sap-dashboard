// POST /api/gmail/sync — déclenche une synchronisation Gmail (staging).
// Réservé aux administrateurs et managers.
import { db } from "@/db";
import { syncRuns } from "@/db/schema";
import { getGmailToken } from "@/lib/gmail/tokens";
import { runGmailSync } from "@/lib/gmail/sync";
import { getSession, canManage } from "@/lib/auth";
import { jsonError } from "@/lib/db";

export async function POST() {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié.");
  if (!canManage(session.role)) return jsonError(403, "Accès refusé. Réservé aux administrateurs et managers.");

  const token = await getGmailToken();
  const accessToken = token?.accessToken;
  const result = await runGmailSync({ accessToken });
  await db.insert(syncRuns).values({
    ranAt: new Date(),
    outcome: result.outcome,
    fetched: result.fetched,
    newMessages: result.newMessages,
    detail: result.detail,
  });
  if (result.outcome === "not_configured") {
    return Response.json({ ...result, outcome: result.outcome }, { status: 503 });
  }
  return Response.json(result, { status: 200 });
}
