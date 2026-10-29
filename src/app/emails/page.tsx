// Page /emails — état Gmail + candidats de synchronisation (staging).
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailMessages } from "@/db/schema";
import { getGmailToken } from "@/lib/gmail/tokens";
import { gmailConfigStatus } from "@/lib/gmail/config";
import { lastSync } from "@/lib/gmail/sync";
import { SyncControls } from "@/components/SyncControls";
import { EmailCandidates } from "@/components/EmailCandidates";

// Route bloquante : les données dynamiques (DB, params) ne peuvent pas être prérendues.
export const instant = false;

export default async function EmailsPage() {
  const status = gmailConfigStatus();
  const last = await lastSync();
  const token = await getGmailToken();
  const pending = await db
    .select()
    .from(emailMessages)
    .where(eq(emailMessages.status, "pending"));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Gmail — candidats d&apos;incident</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Synchronisation Gmail → staging. La création de ticket reste une action humaine.
          </p>
        </div>
        <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">
          Retour au tableau de bord
        </Link>
      </div>

      <SyncControls configured={status.configured} lastSync={last} accessToken={token?.accessToken ?? undefined} />

      <EmailCandidates messages={pending} />
    </main>
  );
}
