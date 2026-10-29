// GET /api/gmail/status — état de la configuration + dernière synchronisation.
import { lastSync } from "@/lib/gmail/sync";
import { gmailConfigStatus } from "@/lib/gmail/config";

export async function GET() {
  const status = gmailConfigStatus();
  const last = await lastSync();
  return Response.json({
    ...status,
    lastSync: last
      ? { outcome: last.outcome, ranAt: last.ranAt, newMessages: last.newMessages, detail: last.detail }
      : null,
  });
}
