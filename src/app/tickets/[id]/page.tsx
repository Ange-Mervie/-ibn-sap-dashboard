import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tickets, ticketEvents, STATUTS, PRIORITES } from "@/db/schema";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TicketDetailPage({ params }: Props) {
  const { id } = await params;

  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1);

  if (!ticket) notFound();

  async function updateTicket(formData: FormData) {
    "use server";

    const status = String(formData.get("status") ?? "");
    const priority = String(formData.get("priority") ?? "");
    const assignee = String(formData.get("assignee") ?? "").trim();
    const module = String(formData.get("module") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (
      !STATUTS.includes(status as (typeof STATUTS)[number]) ||
      !PRIORITES.includes(priority as (typeof PRIORITES)[number]) ||
      !description
    ) {
      throw new Error("Informations invalides. Vérifie les champs du ticket.");
    }

    const [current] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1);

    if (!current) notFound();

    const changes = [
      { field: "status", oldValue: current.status, newValue: status },
      { field: "priority", oldValue: current.priority, newValue: priority },
      { field: "assignee", oldValue: current.assignee, newValue: assignee },
      { field: "module", oldValue: current.module, newValue: module },
      {
        field: "description",
        oldValue: current.description,
        newValue: description,
      },
    ].filter((change) => change.oldValue !== change.newValue);

    if (changes.length > 0) {
      await db.transaction(async (tx) => {
        await tx
          .update(tickets)
          .set({ status: status as typeof current.status,
                 priority: priority as typeof current.priority,
                 assignee,
                 module,
                 description })
          .where(eq(tickets.id, id));

        for (const change of changes) {
          await tx.insert(ticketEvents).values({
            ticketId: id,
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
            changedBy: "application",
          });
        }
      });
    }

    revalidatePath("/");
    revalidatePath(`/tickets/${id}`);
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">
          ← Retour au tableau de bord
        </Link>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8">
            <p className="text-sm text-zinc-500">Gestion du ticket</p>
            <h1 className="mt-2 text-2xl font-bold text-zinc-900">
              {ticket.id}
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Modifie les informations et enregistre les changements.
            </p>
          </div>

          <form action={updateTicket} className="space-y-6">
            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-semibold">
                Description du problème
              </label>
              <textarea
                id="description"
                name="description"
                required
                defaultValue={ticket.description}
                rows={4}
                className="w-full rounded-lg border border-zinc-300 p-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="status" className="mb-2 block text-sm font-semibold">
                  Statut
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={ticket.status}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm"
                >
                  {STATUTS.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="mb-2 block text-sm font-semibold">
                  Priorité
                </label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue={ticket.priority}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm"
                >
                  {PRIORITES.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="assignee" className="mb-2 block text-sm font-semibold">
                  Technicien responsable
                </label>
                <input
                  id="assignee"
                  name="assignee"
                  defaultValue={ticket.assignee}
                  className="w-full rounded-lg border border-zinc-300 p-3 text-sm"
                  placeholder="Nom du technicien"
                />
              </div>

              <div>
                <label htmlFor="module" className="mb-2 block text-sm font-semibold">
                  Module SAP
                </label>
                <input
                  id="module"
                  name="module"
                  defaultValue={ticket.module}
                  className="w-full rounded-lg border border-zinc-300 p-3 text-sm"
                  placeholder="Ex. SAP Basis"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-zinc-200 pt-5">
              <button
                type="submit"
                className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Enregistrer les modifications
              </button>
              <Link
                href="/"
                className="rounded-lg border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Annuler
              </Link>
            </div>
          </form>
        </div>

        <p className="mt-5 text-sm text-zinc-500">
          Ticket déclaré par : {ticket.raisedBy} · E-mail : {ticket.email || "Non renseigné"}
        </p>
      </div>
    </main>
  );
}
