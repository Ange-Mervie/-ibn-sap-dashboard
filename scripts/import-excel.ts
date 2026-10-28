// Import Excel → MySQL (idempotent : les ids déjà présents sont ignorés).
// Usage : npm run db:import
import { loadEnv } from "./env.mjs";

async function main() {
  loadEnv();
  const { db, pool } = await import("../src/db");
  const { tickets } = await import("../src/db/schema");
  const { readExcelIssues } = await import("../src/lib/loadIssues");

  const { issues } = readExcelIssues();

  // Les colonnes MySQL de type DATE attendent un objet Date (drizzle convertit en "YYYY-MM-DD")
  const toDate = (v: string) => (v ? new Date(v + "T00:00:00") : null);

  await db
    .insert(tickets)
    .ignore() // INSERT IGNORE : idempotent, les ids déjà présents sont ignorés
    .values(
      issues.map((i) => ({
        id: i.id,
        description: i.description,
        status: i.status as never,
        priority: i.priority as never,
        module: i.module,
        raisedBy: i.raisedBy,
        openDate: toDate(i.openDate),
        closeDate: toDate(i.closeDate),
        payment: i.payment,
        comments: i.comments,
        source: "excel" as const,
      }))
    );

  const count = await db.select({ n: tickets.id }).from(tickets);
  console.log(`Import terminé : ${issues.length} ligne(s) du classeur traitée(s), base = ${count.length} ticket(s).`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
