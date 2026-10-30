// GET /api/gmail/status — état de la configuration + dernière synchronisation.
import { lastSync } from "@/lib/gmail/sync";
import { gmailConfigStatus } from "@/lib/gmail/config";
import { canManage, getSession } from "@/lib/auth";
import { jsonError } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié.");
  if (!canManage(session.role)) return jsonError(403, "Accès Gmail réservé aux administrateurs et managers.");

  const status = gmailConfigStatus();
  const last = await lastSync();
  return Response.json({
    ...status,
    lastSync: last
      ? { outcome: last.outcome, ranAt: last.ranAt, newMessages: last.newMessages, detail: last.detail }
      : null,
  });
}
