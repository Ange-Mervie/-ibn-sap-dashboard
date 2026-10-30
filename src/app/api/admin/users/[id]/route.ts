// PATCH /api/admin/users/[id] — Modifier rôle, statut actif d'un utilisateur (ADMIN)
// DELETE /api/admin/users/[id] — Supprimer un utilisateur (ADMIN)
// La protection ADMIN est également appliquée dans proxy.ts
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, ROLES, type Role } from "@/db/schema";
import { getSession, canAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

const SAFE_FIELDS = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  active: users.active,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié.");
  if (!canAdmin(session.role)) return jsonError(403, "Accès refusé. Réservé aux administrateurs.");

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) return jsonError(400, "Identifiant invalide.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Corps JSON invalide.");
  }

  const raw = body as Record<string, unknown>;
  const updates: Partial<{ role: Role; active: boolean; name: string }> = {};
  const errors: string[] = [];

  if ("role" in raw) {
    if (!(ROLES as readonly string[]).includes(String(raw.role))) {
      errors.push(`Rôle invalide. Valeurs acceptées : ${ROLES.join(", ")}.`);
    } else {
      updates.role = raw.role as Role;
    }
  }

  if ("active" in raw) {
    if (typeof raw.active !== "boolean") errors.push("Le statut actif doit être un booléen.");
    else updates.active = raw.active;
  }

  if ("name" in raw) {
    const name = String(raw.name).trim();
    if (name.length < 2) errors.push("Le nom doit contenir au moins 2 caractères.");
    else updates.name = name;
  }

  if (errors.length > 0) return jsonError(400, "Données invalides.", errors);
  if (Object.keys(updates).length === 0) return jsonError(400, "Aucun champ à modifier.");
  if (userId === session.sub && ("role" in updates || updates.active === false)) {
    return jsonError(400, "Impossible de modifier votre propre rôle ou de désactiver votre compte.");
  }

  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: users.id, role: users.role, active: users.active })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!existing) return { ok: false as const, error: "Utilisateur introuvable.", status: 404 };

    const losesAdminAccess = existing.role === "admin" && existing.active &&
      (updates.active === false || (updates.role !== undefined && updates.role !== "admin"));
    if (losesAdminAccess) {
      const activeAdmins = await tx
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.role, "admin"), eq(users.active, true)))
        .orderBy(users.id)
        .for("update");
      if (activeAdmins.length <= 1) {
        return { ok: false as const, error: "Impossible de désactiver ou rétrograder le dernier administrateur actif.", status: 409 };
      }
    }

    await tx.update(users).set(updates).where(eq(users.id, userId));
    const [user] = await tx.select(SAFE_FIELDS).from(users).where(eq(users.id, userId));
    return { ok: true as const, user };
  });
  if (!updated.ok) return jsonError(updated.status, updated.error);
  return Response.json({ user: updated.user });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié.");
  if (!canAdmin(session.role)) return jsonError(403, "Accès refusé. Réservé aux administrateurs.");

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) return jsonError(400, "Identifiant invalide.");

  if (userId === session.sub) {
    return jsonError(400, "Impossible de supprimer votre propre compte.");
  }

  const result = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: users.id, role: users.role, active: users.active })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!existing) return { ok: false as const, error: "Utilisateur introuvable.", status: 404 };

    if (existing.role === "admin" && existing.active) {
      const activeAdmins = await tx
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.role, "admin"), eq(users.active, true)))
        .orderBy(users.id)
        .for("update");
      if (activeAdmins.length <= 1) {
        return { ok: false as const, error: "Impossible de supprimer le dernier administrateur actif.", status: 409 };
      }
    }

    await tx.delete(users).where(eq(users.id, userId));
    return { ok: true as const, deleted: userId };
  });
  if (!result.ok) return jsonError(result.status, result.error);
  return Response.json({ deleted: result.deleted });
}
