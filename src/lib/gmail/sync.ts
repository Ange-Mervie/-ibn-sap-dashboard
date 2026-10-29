// Orchestration Gmail : sync (list + staging) et dernier état.
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailMessages, gmailTokens, syncRuns, type EmailMessage, type SyncRun } from "@/db/schema";
import { GMAIL, isGmailConfigured } from "./config";
import { listGmailMessages, matchGmailMessage, type FetchLike, type GmailMessage } from "./client";
import { buildAuthUrl, exchangeCode, refreshAccessToken, type GmailTokens } from "./oauth";

export type GmailSyncResult = {
  outcome: "ok" | "error" | "not_configured";
  fetched: number;
  newMessages: number;
  detail: string;
};

export async function runGmailSync(opts: { accessToken?: string; fetchImpl?: FetchLike } = {}): Promise<GmailSyncResult> {
  if (!isGmailConfigured()) {
    return { outcome: "not_configured", fetched: 0, newMessages: 0, detail: "Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET." };
  }
  const accessToken = opts.accessToken;
  if (!accessToken) {
    return { outcome: "not_configured", fetched: 0, newMessages: 0, detail: "Aucun jeton d'accès Gmail : exécuter /api/gmail/auth-url → /api/gmail/callback." };
  }
  const doFetch: FetchLike = opts.fetchImpl ?? fetch;
  const messages = await listGmailMessages({ accessToken, fetchImpl: doFetch });

  const pending: GmailMessage[] = [];
  for (const m of messages) {
    const { matched, reason } = matchGmailMessage(m);
    if (!matched) continue;
    void reason;
    pending.push(m);
  }

  const last = await db.select().from(syncRuns).orderBy(syncRuns.ranAt).limit(1);

  let newMessages = 0;
  for (const m of pending) {
    const inserted = await db.insert(emailMessages).values({
      gmailMessageId: m.gmailMessageId,
      gmailThreadId: m.gmailThreadId,
      subject: m.subject,
      sender: m.sender,
      receivedAt: m.receivedAt ? new Date(m.receivedAt) : null,
      bodySnippet: m.bodySnippet,
      matchedRule: "subject_or_sender",
      status: "pending",
    });
    const rows = (inserted as unknown as { rowsAffected?: number }).rowsAffected;
    if (rows && rows > 0) newMessages += 1;
  }

  const run: SyncRun = {
    id: last[0]?.id ?? 1,
    ranAt: new Date(),
    outcome: "ok",
    fetched: messages.length,
    newMessages,
    detail: `messages lus=${messages.length} candidats=${pending.length}`,
  };
  await db.insert(syncRuns).values(run);

  return { outcome: "ok", fetched: messages.length, newMessages, detail: `messages lus=${messages.length} candidats=${pending.length}` };
}

export async function lastSync(): Promise<SyncRun | null> {
  const rows = await db.select().from(syncRuns).orderBy(syncRuns.ranAt).limit(1);
  return rows[0] ?? null;
}

export { buildAuthUrl, exchangeCode, refreshAccessToken, GMAIL };
export type { GmailTokens, EmailMessage };
