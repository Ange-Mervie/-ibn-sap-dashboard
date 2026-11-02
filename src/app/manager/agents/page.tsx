import { Suspense } from "react";

async function List() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/users`, { cache: "no-store" });
  const users = await res.json();
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold">Agents</h1>
      <table className="w-full border text-sm">
        <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th></tr></thead>
        <tbody>
          {users.map((u: { id: number; name: string; email: string; role: string }) => (
            <tr key={u.id} className="border-t"><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Chargement…</p>}><List /></Suspense>;
}
