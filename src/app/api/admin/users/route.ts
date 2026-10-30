// GET /api/admin/users — Liste des utilisateurs (ADMIN uniquement)
// POST /api/admin/users — Création d'un nouvel utilisateur (ADMIN uniquement)
// La protection ADMIN est également appliquée dans proxy.ts
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, ROLES, type Role } from "@/db/schema";
import { hashPassword, getSession, canAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/db";

// Champs retournés — jamais le passwordHash
const SAFE_FIELDS = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  active: users.active,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié.");
  if (!canAdmin(session.role)) return jsonError(403, "Accès refusé. Réservé aux administrateurs.");

  const list = await db.select(SAFE_FIELDS).from(users).orderBy(users.createdAt);
  return Response.json({ users: list });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié.");
  if (!canAdmin(session.role)) return jsonError(403, "Accès refusé. Réservé aux administrateurs.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Corps JSON invalide.");
  }

  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  const password = typeof raw.password === "string" ? raw.password : "";
  const role = typeof raw.role === "string" ? raw.role : "viewer";

  const errors: string[] = [];
  if (name.length < 2) errors.push("Le nom doit contenir au moins 2 caractères.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.push("Email invalide.");
  if (password.length < 8) errors.push("Le mot de passe doit contenir au moins 8 caractères.");
  if (!(ROLES as readonly string[]).includes(role)) {
    errors.push(`Rôle invalide. Valeurs acceptées : ${ROLES.join(", ")}.`);
  }

  if (errors.length > 0) return jsonError(400, "Données invalides.", errors);

  // Vérifier que l'email n'est pas déjà pris
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) return jsonError(409, "Un utilisateur avec cet email existe déjà.");

  // Hasher le mot de passe — jamais stocker en clair
  const passwordHash = await hashPassword(password);

  const [result] = await db.insert(users).values({
    name,
    email,
    passwordHash,
    role: role as Role,
    active: true,
  });

  const id = (result as { insertId?: number })?.insertId;

  return Response.json(
    { user: { id, name, email, role, active: true } },
    { status: 201 }
  );
}
