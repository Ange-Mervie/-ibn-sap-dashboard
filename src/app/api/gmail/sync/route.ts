// POST /api/gmail/sync — déclenche une synchronisation Gmail (staging).
import { db } from "@/db";
import { syncRuns } from "@/db/schema";
import { getGmailToken } from "@/lib/gmail/tokens";
import { runGmailSync } from "@/lib/gmail/sync";

export async function POST() {
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
