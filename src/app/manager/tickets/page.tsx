import { loadIssueDataFromDb } from "@/lib/loadDb";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import IssueTable from "@/components/IssueTable";

export const instant = false;

export default async function ManagerTicketsPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=%2Fmanager%2Ftickets");

  const data = await loadIssueDataFromDb({ role: session.role, email: session.email });
  const issues = data.issues;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-zinc-900">Suivi des tickets</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Tous les tickets accessibles au manager — {issues.length} ticket(s).
          </p>
        </div>
        <IssueTable issues={issues} onReset={() => {}} filtersActive={false} />
      </div>
    </div>
  );
}
