import { Suspense } from "react";

async function PaymentsList() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/payments`, { cache: "no-store" });
  const data = await res.json();
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold">Paiements</h1>
      <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Chargement…</p>}><PaymentsList /></Suspense>;
}
