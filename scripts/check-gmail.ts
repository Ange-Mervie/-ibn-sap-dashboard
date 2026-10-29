// Vérification Gmail préparée : npm run check:gmail
import { loadEnv } from "./env.mjs";

function assert(cond: boolean, label: string): void {
  if (!cond) {
    console.error(`ECHEC: ${label}`);
    process.exitCode = 1;
  }
}

async function main() {
  loadEnv();
  const { isGmailConfigured } = await import("../src/lib/gmail/config");
  const { runGmailSync } = await import("../src/lib/gmail/sync");
  const { matchGmailMessage } = await import("../src/lib/gmail/client");

  assert(isGmailConfigured() === false, "Gmail non configuré (variables absentes)");

  const sync = await runGmailSync();
  assert(sync.outcome === "not_configured", `sync → not_configured (obtenu ${sync.outcome})`);
  assert(sync.detail.includes("non configuré"), "sync → message de non-config");

  const hit = matchGmailMessage({
    gmailMessageId: "msg-1",
    gmailThreadId: "thread-1",
    subject: "Incident SAP - transfert stock entre magasin",
    sender: "service@ibn-group.com",
    receivedAt: "2026-10-29",
    bodySnippet: "Bonjour, transfert...",
  });
  assert(hit.matched === true, `règle d'e-mail → matched (obtenu ${JSON.stringify(hit)})`);

  const miss = matchGmailMessage({
    gmailMessageId: "msg-2",
    gmailThreadId: "thread-2",
    subject: "Newsletter hebdo",
    sender: "news@weekly.com",
    receivedAt: "2026-10-29",
    bodySnippet: "Info...",
  });
  assert(miss.matched === false, `règle d'e-mail → non matché attendu (obtenu ${JSON.stringify(miss)})`);

  console.log("check-gmail: OK");
}

main()
  .then(() => {
    if (process.exitCode) process.exit(process.exitCode);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
