import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";

export const instant = false;

export default async function Page() {
  const session = await getSession();
  if (!session) return <p>Non authentifiÃ©</p>;
  const assigned = await db.select().from(tickets).where(eq(tickets.assignee, session.email));
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Mes interventions</h1>
      <table className="w-full border text-sm">
        <thead><tr><th>RÃ©f</th><th>Objet</th><th>Statut</th><th>PrioritÃ©</th></tr></thead>
        <tbody>
          {assigned.map((t) => (
            <tr key={t.id} className="border-t"><td>{t.id}</td><td>{t.description.slice(0,40)}</td><td>{t.status}</td><td>{t.priority}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-xs text-slate-500">Enregistrement d&apos;intervention Ã  complÃ©ter via le formulaire dÃ©diÃ©.</p>
    </div>
  );
}

