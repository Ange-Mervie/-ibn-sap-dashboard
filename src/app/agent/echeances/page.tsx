import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";
const ECHEANCE_CUTOFF = new Date(Date.now() - 7 * 86400000);


export default async function Page() {
  const session = await getSession();
  if (!session) return <p>Non authentifié</p>;
  const all = await db.select().from(tickets);
  const mine = all.filter((t) => t.assignee === session.email || t.createdBy === session.email);
  const late = mine.filter((t) => t.status !== "Closed" && t.openDate && new Date(t.openDate) < ECHEANCE_CUTOFF);
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Mes échéances</h1>
      <table className="w-full border text-sm">
        <thead><tr><th>Réf</th><th>Objet</th><th>Statut</th><th>Priorité</th><th>Ouverture</th></tr></thead>
        <tbody>
          {mine.map((t) => (
            <tr key={t.id} className="border-t"><td>{t.id}</td><td>{t.description.slice(0,40)}</td><td>{t.status}</td><td>{t.priority}</td><td>{String(t.openDate)}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">En retard : {late.length}</p>
    </div>
  );
}
