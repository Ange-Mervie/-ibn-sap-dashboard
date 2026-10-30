
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession, canWrite } from "@/lib/auth";
import SessionControls from "@/components/SessionControls";
import ReportForm from "@/components/ReportForm";
import EvaluationForm from "@/components/EvaluationForm";

import { db } from "@/db";
import {
  tickets,
  ticketEvents,
  ticketComments,
  interventionReports,
  STATUTS,
  PRIORITES,
} from "@/db/schema";

type PageProps = {
  params: Promise<{ id: string }>;
};

// Route bloquante : les données dynamiques (params DB) ne peuvent pas être prérendues.
export const instant = false;

export default async function TicketDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect(`/login?from=${encodeURIComponent(`/tickets/${(await params).id}`)}`);
  const canEdit = canWrite(session.role);
  const { id } = await params;

  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, id))
    .limit(1);

  if (!ticket) {
    notFound();
  }

  const comments = await db
    .select()
    .from(ticketComments)
    .where(eq(ticketComments.ticketId, id))
    .orderBy(desc(ticketComments.createdAt));

  const events = await db
    .select()
    .from(ticketEvents)
    .where(eq(ticketEvents.ticketId, id))
    .orderBy(desc(ticketEvents.changedAt));

  const submittedReports = await db
    .select()
    .from(interventionReports)
    .where(and(eq(interventionReports.ticketId, id), eq(interventionReports.status, "submitted")))
    .orderBy(desc(interventionReports.createdAt));

  async function updateTicket(formData: FormData) {
    "use server";

    const currentSession = await getSession();
    if (!currentSession) redirect(`/login?from=${encodeURIComponent(`/tickets/${id}`)}`);
    if (!canWrite(currentSession.role)) redirect("/");

    const status = String(formData.get("status") ?? "");
    const priority = String(formData.get("priority") ?? "");
    const assignee = String(formData.get("assignee") ?? "").trim();
    const moduleValue = String(formData.get("module") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (
      !STATUTS.includes(status as (typeof STATUTS)[number]) ||
      !PRIORITES.includes(priority as (typeof PRIORITES)[number]) ||
      !description
    ) {
      throw new Error(
        "Informations invalides. Vérifie la description, le statut et la priorité."
      );
    }

    const [current] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1);

    if (!current) {
      notFound();
    }

    const changes = [
      {
        field: "status",
        oldValue: current.status,
        newValue: status,
      },
      {
        field: "priority",
        oldValue: current.priority,
        newValue: priority,
      },
      {
        field: "assignee",
        oldValue: current.assignee,
        newValue: assignee,
      },
      {
        field: "module",
        oldValue: current.module,
        newValue: moduleValue,
      },
      {
        field: "description",
        oldValue: current.description,
        newValue: description,
      },
    ].filter((change) => change.oldValue !== change.newValue);

    await db.transaction(async (tx) => {
      await tx
        .update(tickets)
        .set({
          status: status as typeof current.status,
          priority: priority as typeof current.priority,
          assignee,
          module: moduleValue,
          description,
        })
        .where(eq(tickets.id, id));

      for (const change of changes) {
        await tx.insert(ticketEvents).values({
          ticketId: id,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changedBy: currentSession.name,
        });
      }
    });

    revalidatePath("/");
    revalidatePath(`/tickets/${id}`);
  }

  async function addComment(formData: FormData) {
    "use server";

    const currentSession = await getSession();
    if (!currentSession) redirect(`/login?from=${encodeURIComponent(`/tickets/${id}`)}`);
    if (!canWrite(currentSession.role)) redirect("/");

    const author = currentSession.name;
    const body = String(formData.get("body") ?? "").trim();

    if (!author || !body) {
      throw new Error("Le nom et le commentaire sont obligatoires.");
    }

    if (author.length > 100 || body.length > 5000) {
      throw new Error("Le nom ou le commentaire est trop long.");
    }

    const [current] = await db
      .select({ id: tickets.id })
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1);

    if (!current) {
      notFound();
    }

    await db.transaction(async (tx) => {
      await tx.insert(ticketComments).values({
        ticketId: id,
        author,
        body,
      });

      await tx.insert(ticketEvents).values({
        ticketId: id,
        field: "commentaire",
        oldValue: "",
        newValue: `Commentaire ajouté par ${author}`,
        changedBy: author,
      });
    });

   revalidatePath("/");
   revalidatePath(`/tickets/${id}`);

   redirect(`/tickets/${id}?saved=1`);
  }

  const dateLabel = (value: Date | string | null | undefined) => {
    if (!value) return "—";

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString("fr-FR");
  };

  return (
    <main className="min-h-screen bg-zinc-50 p-4 text-zinc-900 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-blue-700 hover:underline"
            >
              ← Retour au tableau de bord
            </Link>

            <h1 className="mt-3 text-2xl font-bold">
              Ticket {ticket.id}
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              {canEdit ? "Consulte et modifie les informations de ce ticket SAP." : "Consultation du ticket SAP."}
            </p>
          </div>

          <SessionControls user={{ name: session.name, email: session.email, role: session.role }} />

          <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800">
            {ticket.status}
          </span>
        </div>

        <section
          data-ticket-detail
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="mb-5 text-lg font-bold">
            Informations du ticket
          </h2>

          <form action={updateTicket} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-medium"
                >
                  Statut
                </label>

                <select
                  id="status"
                  name="status"
                  defaultValue={ticket.status}
                  disabled={!canEdit}
                  required
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-sm"
                >
                  {STATUTS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="priority"
                  className="mb-2 block text-sm font-medium"
                >
                  Priorité
                </label>

                <select
                  id="priority"
                  name="priority"
                  defaultValue={ticket.priority}
                  disabled={!canEdit}
                  required
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-sm"
                >
                  {PRIORITES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="assignee"
                  className="mb-2 block text-sm font-medium"
                >
                  Responsable
                </label>

                <input
                  id="assignee"
                  name="assignee"
                  defaultValue={ticket.assignee}
                  readOnly={!canEdit}
                  maxLength={100}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="Nom du responsable"
                />
              </div>

              <div>
                <label
                  htmlFor="module"
                  className="mb-2 block text-sm font-medium"
                >
                  Module SAP
                </label>

                <input
                  id="module"
                  name="module"
                  defaultValue={ticket.module}
                  readOnly={!canEdit}
                  maxLength={50}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm"
                  placeholder="Ex. FI, MM, SD..."
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium"
              >
                Description du problème
              </label>

              <textarea
                id="description"
                name="description"
                defaultValue={ticket.description}
                readOnly={!canEdit}
                required
                rows={5}
                className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm"
                placeholder="Décris le problème rencontré..."
              />
            </div>

            <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-5">
              {canEdit && <button
                type="submit"
                className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Enregistrer les modifications
              </button>}

              <Link
                href="/"
                className="rounded-lg border border-zinc-300 px-5 py-3 text-sm font-medium hover:bg-zinc-100"
              >
                Annuler
              </Link>
            </div>
          </form>
        </section>

        {canEdit && (session.role === "admin" || ticket.assignee.toLowerCase().includes(session.email.toLowerCase())) && (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 text-lg font-bold">Compte rendu d&apos;intervention</h2>
            <p className="mb-4 text-sm text-zinc-500">
              Déclarez l&apos;intervention réalisée sur ce ticket. Le compte rendu est enregistré puis, après soumission, transmis au manager pour validation.
            </p>
            <ReportForm ticketId={ticket.id} agentEmail={session.email} />
          </section>
        )}

        {canEdit && (session.role === "admin" || session.role === "manager") && submittedReports[0] && (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 text-lg font-bold">Évaluation du travail</h2>
            <EvaluationForm ticketId={ticket.id} reportId={String(submittedReports[0].id)} agentId={submittedReports[0].agentId} />
          </section>
        )}

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-5 text-lg font-bold">
            Détails complémentaires
          </h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-zinc-500">Déclaré par</p>
              <p className="mt-1 font-medium">{ticket.raisedBy || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">E-mail</p>
              <p className="mt-1 break-words font-medium">
                {ticket.email || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">Paiement</p>
              <p className="mt-1 font-medium">{ticket.payment || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">Module SAP</p>
              <p className="mt-1 font-medium">
                {ticket.module && ticket.module.toUpperCase() !== "BLANK"
                  ? ticket.module
                  : "Non renseigné"}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">Date d&apos;ouverture</p>
              <p className="mt-1 font-medium">
                {dateLabel(ticket.openDate)}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">Date de clôture</p>
              <p className="mt-1 font-medium">
                {dateLabel(ticket.closeDate)}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">Dernière mise à jour</p>
              <p className="mt-1 font-medium">
                {dateLabel(ticket.updatedAt)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-5 text-lg font-bold">
            {canEdit ? "Commentaires" : "Commentaires"}
          </h2>

          {canEdit && <form data-comment-form action={addComment} className="space-y-4">
            <p className="text-sm text-zinc-500">Commentaire ajouté sous le nom de {session.name}.</p>

            <div>
              <label
                htmlFor="body"
                className="mb-2 block text-sm font-medium"
              >
                Commentaire
              </label>

              <textarea
                id="body"
                name="body"
                required
                maxLength={5000}
                rows={4}
                className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm"
                placeholder="Ajoute une note sur le traitement du ticket..."
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              Ajouter le commentaire
            </button>
          </form>}

          <div className="mt-6 space-y-4" data-comment-list>
            {comments.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Aucun commentaire pour le moment.
              </p>
            ) : (
              comments.map((comment) => (
                <article
                  key={comment.id}
                  className="rounded-lg bg-zinc-50 p-4"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-semibold">{comment.author}</p>
                    <p className="text-xs text-zinc-500">
                      {dateLabel(comment.createdAt)}
                    </p>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                    {comment.body}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <section
          data-history-list
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="mb-5 text-lg font-bold">
            Historique des modifications
          </h2>

          {events.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Aucun changement enregistré pour le moment.
            </p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="border-l-2 border-blue-200 pl-4"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-semibold">
                      {event.field === "status"
                        ? "Statut"
                        : event.field === "priority"
                          ? "Priorité"
                          : event.field === "assignee"
                            ? "Responsable"
                            : event.field === "module"
                              ? "Module SAP"
                              : event.field === "description"
                                ? "Description"
                                : event.field === "commentaire"
                                  ? "Commentaire"
                                  : event.field}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {dateLabel(event.changedAt)}
                    </p>
                  </div>

                  <p className="mt-1 break-words text-sm text-zinc-600">
                    {event.oldValue
                      ? event.oldValue
                      : "Valeur initiale vide"}
                    {" → "}
                    {event.newValue || "Valeur vide"}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Modifié par : {event.changedBy || "application"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
