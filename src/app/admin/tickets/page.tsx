import { Suspense } from "react";

async function TicketsList() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/tickets`, { cache: "no-store" });
  const tickets = await res.json();
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold">Tous les tickets</h1>
      <table className="w-full border text-sm">
        <thead><tr><th>Réf</th><th>Objet</th><th>Statut</th><th>Priorité</th><th>Agent</th></tr></thead>
        <tbody>
          {tickets.map((t: { id: string; title?: string; subject?: string; status: string; priority: string; assignee: string }) => (
            <tr key={t.id} className="border-t">
              <td>{t.id}</td><td>{t.title ?? t.subject}</td><td>{t.status}</td><td>{t.priority}</td><td>{t.assignee}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Chargement…</p>}><TicketsList /></Suspense>;
}
