import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { ticketEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function Page() {
  const session = await getSession();
  if (!session) return <p>Non authentifié</p>;
  const events = await db.select().from(ticketEvents);
  const mine = events.filter((e) => e.changedBy === session.name);
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Mon historique</h1>
      <table className="w-full border text-sm">
        <thead><tr><th>Ticket</th><th>Champ</th><th>Ancien</th><th>Nouveau</th><th>Auteur</th></tr></thead>
        <tbody>
          {mine.map((e) => (
            <tr key={e.id} className="border-t"><td>{e.ticketId}</td><td>{e.field}</td><td>{e.oldValue}</td><td>{e.newValue}</td><td>{e.changedBy}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
