"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = ["admin", "manager", "agent", "viewer"] as const;
type Role = (typeof ROLES)[number];

type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: Date | string;
};

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  manager: "Manager",
  agent: "Agent",
  viewer: "Observateur",
};

const fieldClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

export default function UserManagementTable({
  users,
  currentUserId,
}: {
  users: ManagedUser[];
  currentUserId: number;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [busyId, setBusyId] = useState<number | "create" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeAdmins = users.filter((user) => user.active && user.role === "admin").length;

  async function send(url: string, method: "POST" | "PATCH" | "DELETE", payload?: unknown) {
    const response = await fetch(url, {
      method,
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error ?? `Opération refusée (HTTP ${response.status}).`);
    }
    return result;
  }

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (role === "admin" && !window.confirm(`Créer un compte administrateur pour ${email} ?`)) return;
    setBusyId("create");
    setError(null);
    try {
      await send("/api/admin/users", "POST", { name, email, password, role });
      setName("");
      setEmail("");
      setPassword("");
      setRole("viewer");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de créer le compte.");
    } finally {
      setBusyId(null);
    }
  }

  async function updateUser(user: ManagedUser, updates: { role?: Role; active?: boolean }) {
    if (user.id === currentUserId) {
      setError("Vous ne pouvez pas modifier votre propre compte depuis cette page.");
      return;
    }
    if (user.active && user.role === "admin" && activeAdmins <= 1 && (updates.active === false || (updates.role !== undefined && updates.role !== "admin"))) {
      setError("Impossible de désactiver ou rétrograder le dernier administrateur actif.");
      return;
    }
    if (updates.active === false && !window.confirm(`Désactiver le compte de ${user.name} ?`)) return;
    if (updates.role !== undefined && !window.confirm(`Attribuer le rôle ${ROLE_LABELS[updates.role]} à ${user.name} ?`)) return;

    setBusyId(user.id);
    setError(null);
    try {
      await send(`/api/admin/users/${user.id}`, "PATCH", updates);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de modifier ce compte.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(user: ManagedUser) {
    if (user.id === currentUserId) {
      setError("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    if (user.active && user.role === "admin" && activeAdmins <= 1) {
      setError("Impossible de supprimer le dernier administrateur actif.");
      return;
    }
    if (!window.confirm(`Supprimer définitivement le compte de ${user.name} (${user.email}) ?`)) return;

    setBusyId(user.id);
    setError(null);
    try {
      await send(`/api/admin/users/${user.id}`, "DELETE");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de supprimer ce compte.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-zinc-900">Créer un utilisateur</h2>
        <p className="mt-1 text-sm text-zinc-500">Le mot de passe doit comporter au moins 8 caractères.</p>
        <form onSubmit={createUser} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm font-medium text-zinc-700">
            Nom complet
            <input className={`${fieldClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} minLength={2} required />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Adresse e-mail
            <input className={`${fieldClass} mt-1`} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Mot de passe
            <input className={`${fieldClass} mt-1`} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Rôle
            <select className={`${fieldClass} mt-1`} value={role} onChange={(event) => setRole(event.target.value as Role)}>
              {ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}
            </select>
          </label>
          <button type="submit" disabled={busyId !== null} className="self-end rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {busyId === "create" ? "Création…" : "Créer le compte"}
          </button>
        </form>
      </section>

      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-zinc-900">Comptes utilisateurs ({users.length})</h2>
          <p className="mt-1 text-sm text-zinc-500">Administrateurs actifs : {activeAdmins}. Au moins un doit rester actif.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3">Utilisateur</th>
                <th className="px-5 py-3">Rôle</th>
                <th className="px-5 py-3">État</th>
                <th className="px-5 py-3">Créé le</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                const isLastActiveAdmin = user.active && user.role === "admin" && activeAdmins <= 1;
                const busy = busyId === user.id;
                return (
                  <tr key={user.id}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-900">{user.name}{isCurrentUser ? " (vous)" : ""}</p>
                      <p className="text-zinc-500">{user.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <select aria-label={`Rôle de ${user.name}`} disabled={busy || isCurrentUser || isLastActiveAdmin} value={user.role} onChange={(event) => void updateUser(user, { role: event.target.value as Role })} className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm disabled:bg-zinc-100 disabled:text-zinc-500">
                        {ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>
                        {user.active ? "Actif" : "Désactivé"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-500">{new Date(user.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button type="button" disabled={busy || isCurrentUser || isLastActiveAdmin} onClick={() => void updateUser(user, { active: !user.active })} className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40">
                          {user.active ? "Désactiver" : "Activer"}
                        </button>
                        <button type="button" disabled={busy || isCurrentUser || isLastActiveAdmin} onClick={() => void deleteUser(user)} className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-zinc-500">Aucun compte utilisateur.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}