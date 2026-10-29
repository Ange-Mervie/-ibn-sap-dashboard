import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tickets } from "@/db/schema";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date | string | null) {
  if (!value) return "Non renseignée";

  if (value instanceof Date) {
    return value.toLocaleDateString("fr-FR");
  }

  return String(value).slice(0, 10);
}

export default async function TicketDetailPage({ params }: Props) {
  const { id } = await params;

  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1);

  if (!ticket) {
    notFound();
  }

  const details = [
    { label: "Numéro du ticket", value: ticket.id },
    { label: "Statut", value: ticket.status },
    { label: "Priorité", value: ticket.priority },
    { label: "Module", value: ticket.module },
    { label: "Déclaré par", value: ticket.raisedBy },
    { label: "E-mail", value: ticket.email },
    { label: "Responsable", value: ticket.assignee },
    { label: "Date d'ouverture", value: formatDate(ticket.openDate) },
    { label: "Date de clôture", value: formatDate(ticket.closeDate) },
    { label: "Paiement", value: ticket.payment },
    { label: "Source", value: ticket.source },
  ];

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          ← Retour au tableau de bord
        </Link>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">Détail du ticket</p>
              <h1 className="mt-2 text-2xl font-bold text-zinc-900">
                {ticket.id}
              </h1>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {ticket.status}
            </span>
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-zinc-900">
              Description du problème
            </h2>
            <p className="mt-3 whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
              {ticket.description}
            </p>
          </section>

          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Informations du ticket
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {details.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-zinc-200 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {item.label}
                  </p>
                  <p className="mt-2 break-words text-sm font-medium text-zinc-900">
                    {item.value || "Non renseigné"}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-8 border-t border-zinc-200 pt-5">
            <Link
              href="/tickets/nouveau"
              className="inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              + Créer un nouveau ticket
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
