// Vérifications sécurité du backend (Phase 6) : validators, secrets commités.
import { loadEnv } from "./env.mjs";

function assert(cond: boolean, label: string): void {
  if (!cond) {
    console.error(`ECHEC: ${label}`);
    process.exitCode = 1;
  }
}

async function main() {
  loadEnv();

  const { execSync } = await import("child_process");
  const files: string[] = execSync("git ls-files").toString().split("\n").filter((l) => l.trim().length > 0);
  const secretHits: string[] = [];
  const codeExts = [".ts", ".tsx", ".js", ".mjs", ".json", ".jsx"];
  const skip = new Set(["scripts/check-security.ts"]);
  for (const f of files) {
    if (!codeExts.some((e) => f.toLowerCase().endsWith(e))) continue;
    if (skip.has(f)) continue;
    let content = "";
    try {
      content = execSync(`git show HEAD:${JSON.stringify(f)}`).toString();
    } catch {
      continue;
    }
    if (/GMAIL_CLIENT_SECRET=(?!["'\s])/.test(content)) secretHits.push(`${f}:GMAIL_CLIENT_SECRET`);
    if (/DATABASE_URL=mysql:\/\/[^:]+:[^@]+@/.test(content)) secretHits.push(`${f}:DATABASE_URL_PASSWORD`);
  }
  assert(secretHits.length === 0, `Aucun secret committé (${secretHits.join(", ")})`);

  const { validateTicketInput, validateTicketPatch } = await import("../src/lib/validate");
  const badInput = validateTicketInput({ description: "x", raisedBy: "X", status: "Nope" });
  assert(badInput.data === null, "validateTicketInput rejette les données invalides");
  const badPatch = validateTicketPatch({ status: "Nope" });
  assert(badPatch.data === null, "validateTicketPatch rejette les données invalides");

  console.log("check-security: OK");
}

main()
  .then(() => {
    if (process.exitCode) process.exit(process.exitCode);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
