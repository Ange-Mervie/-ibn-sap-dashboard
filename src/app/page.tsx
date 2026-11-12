import { connection } from "next/server";
import { loadIssueDataFromDb } from "@/lib/loadDb";
import { lastSync } from "@/lib/gmail/sync";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/locale";
import Dashboard from "@/components/Dashboard";

export const instant = false;

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login?from=%2F");

  await connection();

  const [data, last, locale] = await Promise.all([
    loadIssueDataFromDb({ role: session.role, email: session.email }),
    lastSync(),
    getLocale(),
  ]);
  const syncNote = last ? { outcome: last.outcome, detail: last.detail } : null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Dashboard
        data={data}
        syncNote={session.role === "admin" || session.role === "manager" ? syncNote : null}
        user={{ name: session.name, email: session.email, role: session.role }}
        locale={locale}
      />
    </div>
  );
}
