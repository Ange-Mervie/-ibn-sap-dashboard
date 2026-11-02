import { Suspense } from "react";

async function List() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/tickets`, { cache: "no-store" });
  const tickets = await res.json();
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold">Affectation des tickets</h1>
      <table className="w-full border text-sm">
        <thead><tr><th>Réf</th><th>Objet</th><th>Priorité</th><th>Statut</th><th>Agent affecté</th></tr></thead>
        <tbody>
          {tickets.map((t: { id: string; title?: string; subject?: string; priority: string; status: string; assignee: string }) => (
            <tr key={t.id} className="border-t">
              <td>{t.id}</td><td>{t.title ?? t.subject}</td><td>{t.priority}</td><td>{t.status}</td><td>{t.assignee || "Non affecté"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Chargement…</p>}><List /></Suspense>;
}
