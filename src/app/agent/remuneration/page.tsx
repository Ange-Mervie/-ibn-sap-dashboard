import { getSession } from "@/lib/auth";

export const instant = false;

export default async function Page() {
  const session = await getSession();
  if (!session) return <p>Non authentifiÃ©</p>;
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Ma rÃ©munÃ©ration</h1>
      <p className="text-sm text-slate-500">Aucun paiement configurÃ© pour le moment. Les montants apparaÃ®tront ici aprÃ¨s validation et enregistrement des paiements.</p>
    </div>
  );
}

