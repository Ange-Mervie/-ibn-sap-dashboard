import { connection } from "next/server";
import { loadIssueDataFromDb } from "@/lib/loadDb";
import { lastSync } from "@/lib/gmail/sync";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Banner from "@/components/Banner";
import Dashboard from "@/components/Dashboard";

// Route bloquante : rendue à chaque requête (l'ancienneté des tickets
// dépend de la date du jour, impossible à figer au moment du build)
export const instant = false;

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login?from=%2F");

  // Arrête le prerender statique ici — le reste est calculé à la requête
  await connection();

  const data = await loadIssueDataFromDb();
  const last = await lastSync();
  const syncNote = last ? { outcome: last.outcome, detail: last.detail } : null;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Bande d'images défilante (inchangée) */}
      <Banner />
      {/* Application : en-tête, filtres, sidebar, 3 sections */}
      <Dashboard
        data={data}
        syncNote={session.role === "admin" || session.role === "manager" ? syncNote : null}
        user={{ name: session.name, email: session.email, role: session.role }}
      />
    </div>
  );
}
