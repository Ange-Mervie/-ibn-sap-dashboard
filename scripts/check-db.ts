// Vérification de la base MySQL : npm run db:check
import { loadEnv } from "./env.mjs";

function assert(cond: boolean, label: string): void {
  if (!cond) {
    console.error(`ECHEC: ${label}`);
    process.exitCode = 1;
  }
}

async function main() {
  loadEnv();
  const { db, pool } = await import("../src/db");
  const { tickets } = await import("../src/db/schema");
  const { loadIssueDataFromDb } = await import("../src/lib/loadDb");

  const rows = await db.select().from(tickets);
  assert(rows.length >= 98, `au moins 98 tickets en base (obtenu ${rows.length})`);

  const d = await loadIssueDataFromDb();
  assert(d.issues.length === rows.length, "loader DB = comptage SQL");
  assert(d.issues.some((i) => i.id === "11"), "ticket Excel n° 11 présent");
  assert(d.controls.length >= 8, `au moins 8 contrôles (obtenu ${d.controls.length})`);
  assert(d.source.startsWith("MySQL"), "source = MySQL");

  console.log(`check-db: OK (${rows.length} tickets, ${d.controls.length} contrôles)`);
  await pool.end();
}

main()
  .then(() => {
    if (process.exitCode) process.exit(process.exitCode);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
