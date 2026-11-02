import { Suspense } from "react";

async function List() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/evaluations`, { cache: "no-store" });
  const data = await res.json();
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold">Suivi des interventions</h1>
      <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Chargement…</p>}><List /></Suspense>;
}
