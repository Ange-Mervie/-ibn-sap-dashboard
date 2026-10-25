import { connection } from "next/server";
import { loadIssueData } from "@/lib/loadIssues";
import Banner from "@/components/Banner";
import Dashboard from "@/components/Dashboard";

// Route bloquante : rendue à chaque requête (l'ancienneté des tickets
// dépend de la date du jour, impossible à figer au moment du build)
export const instant = false;

export default async function HomePage() {
  // Arrête le prerender statique ici — le reste est calculé à la requête
  await connection();

  const data = loadIssueData();

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Bande d'images défilante (inchangée) */}
      <Banner />
      {/* Application : en-tête, filtres, sidebar, 3 sections */}
      <Dashboard data={data} />
    </div>
  );
}
