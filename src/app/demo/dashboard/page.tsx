import { connection } from "next/server";
import { loadIssueDataFromDb } from "@/lib/loadDb";
import { lastSync } from "@/lib/gmail/sync";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Banner from "@/components/Banner";
import Dashboard from "@/components/Dashboard";

// Route de démonstration — données dynamiques (ancienneté)
export const instant = false;

export default async function DemoDashboardPage() {
  await connection();
  const data = await loadIssueDataFromDb();
  const last = await lastSync();
  const syncNote = last ? { outcome: last.outcome, detail: last.detail } : null;
  const session = await getSession();
  if (!session) redirect("/login?from=%2Fdemo%2Fdashboard");

  const user = { name: session.name, email: session.email, role: session.role };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Banner />
      <Dashboard data={data} syncNote={syncNote} user={user} />
    </div>
  );
}
