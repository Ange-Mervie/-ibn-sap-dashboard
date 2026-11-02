import { getSession } from "@/lib/auth";

export default async function Page() {
  const session = await getSession();
  if (!session) return <p>Non authentifié</p>;
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Ma rémunération</h1>
      <p className="text-sm text-slate-500">Aucun paiement configuré pour le moment. Les montants apparaîtront ici après validation et enregistrement des paiements.</p>
    </div>
  );
}
