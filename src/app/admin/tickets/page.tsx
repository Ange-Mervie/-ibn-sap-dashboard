import { loadIssueDataFromDb } from "@/lib/loadDb";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import IssueTable from "@/components/IssueTable";

export const instant = false;

export default async function AdminTicketsPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=%2Fadmin%2Ftickets");

  const data = await loadIssueDataFromDb({ role: session.role, email: session.email });
  const issues = data.issues;
  const isManager = session.role === "manager";

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-zinc-900">{isManager ? "Suivi des tickets" : "Tous les tickets"}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Liste complète des tickets en base (MySQL) — {issues.length} ticket(s) visibles pour ce profil.
          </p>
        </div>
        <IssueTable issues={issues} filtersActive={false} />
      </div>
    </div>
  );
}
