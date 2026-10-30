// Page /admin — Gestion des utilisateurs (ADMIN uniquement)
// Server Component : charge les utilisateurs, vérifie le rôle admin
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import UserManagementTable from "@/components/UserManagementTable";
import SessionControls from "@/components/SessionControls";

export const metadata = {
  title: "Administration — IBN SAP Dashboard",
  description: "Gestion des utilisateurs et des accès",
};

export const instant = false;

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* En-tête */}
      <header className="border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">
              Administration — Gestion des utilisateurs
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              IBN Group SARL · Rôle : Administrateur · {session.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SessionControls user={{ name: session.name, email: session.email, role: session.role }} />
            <Link
              href="/"
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              ← Tableau de bord
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <Suspense fallback={<UsersLoading />}>
          <UsersContent currentUserId={session.sub} />
        </Suspense>
      </div>
    </main>
  );
}

async function UsersContent({ currentUserId }: { currentUserId: number }) {
  let userList;
  try {
    userList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        active: users.active,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);
  } catch {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        Impossible de charger la liste des utilisateurs. Vérifiez la connexion à la base de données puis actualisez la page.
      </div>
    );
  }

  return <UserManagementTable users={userList} currentUserId={currentUserId} />;
}

function UsersLoading() {
  return (
    <div role="status" aria-live="polite" className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto block h-7 w-7 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
      <p className="mt-3 text-sm text-zinc-600">Chargement des comptes utilisateurs…</p>
    </div>
  );
}
