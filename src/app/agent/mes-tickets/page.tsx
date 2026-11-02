import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function Page() {
  const session = await getSession();
  if (!session) return <p>Non authentifié</p>;
  const all = await db.select().from(tickets);
  const created = all.filter((t) => t.createdBy === session.email);
  const assigned = all.filter((t) => t.assignee === session.email);
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Mes tickets</h1>
      <section>
        <h2 className="font-semibold mb-2">Tickets créés par moi ({created.length})</h2>
        <table className="w-full border text-sm">
          <thead><tr><th>Réf</th><th>Objet</th><th>Statut</th><th>Priorité</th><th>Responsable</th></tr></thead>
          <tbody>
            {created.map((t) => (
              <tr key={t.id} className="border-t"><td>{t.id}</td><td>{t.description.slice(0,40)}</td><td>{t.status}</td><td>{t.priority}</td><td>{t.assignee || "—"}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="font-semibold mb-2">Tickets qui me sont affectés ({assigned.length})</h2>
        <table className="w-full border text-sm">
          <thead><tr><th>Réf</th><th>Objet</th><th>Statut</th><th>Priorité</th><th>Module</th></tr></thead>
          <tbody>
            {assigned.map((t) => (
              <tr key={t.id} className="border-t"><td>{t.id}</td><td>{t.description.slice(0,40)}</td><td>{t.status}</td><td>{t.priority}</td><td>{t.module}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
