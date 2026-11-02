import { Suspense } from "react";

async function List() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/tickets`, { cache: "no-store" });
  const tickets = await res.json();
  const late = tickets.filter((t: { status: string; dueDate?: string }) => t.status !== "Closed" && t.dueDate && new Date(t.dueDate) < new Date());
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold">Retards et alertes</h1>
      <table className="w-full border text-sm">
        <thead><tr><th>Réf</th><th>Objet</th><th>Agent</th><th>Échéance</th><th>Priorité</th></tr></thead>
        <tbody>
          {late.map((t: { id: string; title?: string; subject?: string; assignee: string; dueDate: string; priority: string }) => (
            <tr key={t.id} className="border-t"><td>{t.id}</td><td>{t.title ?? t.subject}</td><td>{t.assignee}</td><td>{t.dueDate}</td><td>{t.priority}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Chargement…</p>}><List /></Suspense>;
}
