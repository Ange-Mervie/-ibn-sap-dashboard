import TicketForm from "@/components/TicketForm";

// Page de création d'un ticket — Formulaire contrôlé côté client.
export default async function NouveauTicketPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-bold text-zinc-900">Nouveau ticket SAP</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Le numéro est généré automatiquement (format SAP-AAAA-NNNN) et le ticket est enregistré en base MySQL.
      </p>
      <TicketForm />
    </main>
  );
}
