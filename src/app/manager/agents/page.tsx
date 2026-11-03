import { db } from "@/db";
import { users, tickets, workEvaluations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const instant = false;

export default async function ManagerAgentsPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=%2Fmanager%2Fagents");

  const agents = await db
    .select({ id: users.id, name: users.name, email: users.email, active: users.active })
    .from(users)
    .where(eq(users.role, "agent"))
    .orderBy(users.name);

  const ticketsAll = await db.select().from(tickets);
  const openByAgent = new Map<string, number>();
  for (const t of ticketsAll) {
    if (t.status === "Closed") continue;
    openByAgent.set(t.assignee, (openByAgent.get(t.assignee) ?? 0) + 1);
  }

  const evals = await db.select().from(workEvaluations);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-zinc-900">Suivi des agents</h1>
          <p className="mt-1 text-sm text-zinc-500">Liste des agents et de leur charge de travail.</p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-600">
              <tr>
                <th className="px-3 py-3 font-semibold">Nom</th>
                <th className="px-3 py-3 font-semibold">E-mail</th>
                <th className="px-3 py-3 font-semibold">Statut compte</th>
                <th className="px-3 py-3 font-semibold">Tickets ouverts</th>
                <th className="px-3 py-3 font-semibold">Évaluations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {agents.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-500">Aucun agent.</td></tr>
              )}
              {agents.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-3 py-2.5 font-medium text-zinc-700">{a.name}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{a.email}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{a.active ? "Actif" : "Inactif"}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{openByAgent.get(a.email) ?? 0}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{evals.filter((e) => e.agentId === a.email).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
