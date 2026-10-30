import TicketForm from "@/components/TicketForm";
import { getSession, canWrite } from "@/lib/auth";
import { redirect } from "next/navigation";
import SessionControls from "@/components/SessionControls";
import Link from "next/link";

// Page de création d'un ticket — Formulaire contrôlé côté client.
export const instant = false;

export default async function NouveauTicketPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=%2Ftickets%2Fnouveau");
  if (!canWrite(session.role)) redirect("/");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">← Tableau de bord</Link>
        <SessionControls user={{ name: session.name, email: session.email, role: session.role }} />
      </div>
      <h1 className="text-xl font-bold text-zinc-900">Nouveau ticket SAP</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Le numéro est généré automatiquement (format SAP-AAAA-NNNN) et le ticket est enregistré en base MySQL.
      </p>
      <TicketForm />
    </main>
  );
}
