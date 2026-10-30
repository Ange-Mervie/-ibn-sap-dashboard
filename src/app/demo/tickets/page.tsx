import { getSession } from "@/lib/auth";
import { lastSync } from "@/lib/gmail/sync";
import { redirect } from "next/navigation";
import SessionControls from "@/components/SessionControls";
import TicketForm from "@/components/TicketForm";
import Link from "next/link";

export const instant = false;

export default async function DemoTicketsPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=%2Fdemo%2Ftickets");

  const last = await lastSync();
  const syncNote = last ? { outcome: last.outcome, detail: last.detail } : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/demo/dashboard" className="text-sm font-medium text-blue-700 hover:underline">
          ← Tableau de bord
        </Link>
        <SessionControls user={{ name: session.name, email: session.email, role: session.role }} />
      </div>
      <h1 className="text-xl font-bold text-zinc-900">Démo — Gestion des tickets SAP</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Création de ticket via formulaire → persistance MySQL → vue détail / historique / commentaires.
        L&apos;intégration Gmail reste en mode non configuré pour la démo.
      </p>
      <div className="mt-5">
        <TicketForm />
      </div>
      {syncNote && (
        <div className="mt-5 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm">
          <span className="font-medium">Gmail :</span> Dernière synchronisation : {syncNote.outcome} — {syncNote.detail}
          <div className="mt-2">
            <Link href="/emails" className="text-blue-700 underline">
              Voir les candidats
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
