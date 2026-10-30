// POST /api/auth/login — Authentification utilisateur
// Vérifie email + mot de passe, crée la session cookie.
// Ne jamais retourner le hash du mot de passe dans la réponse.
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword, createSession } from "@/lib/auth";
import { jsonError } from "@/lib/db";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Corps JSON invalide.");
  }

  const raw = body as Record<string, unknown>;
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  const password = typeof raw.password === "string" ? raw.password : "";

  if (!email || !password) {
    return jsonError(400, "Email et mot de passe requis.");
  }

  // Rechercher l'utilisateur — même message d'erreur si introuvable ou mauvais mdp
  // (anti-énumération d'utilisateurs)
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Vérifier le mot de passe même si l'utilisateur n'existe pas (évite timing attack)
  const dummyHash = "0000000000000000:0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? dummyHash);

  if (!user || !passwordOk) {
    return jsonError(401, "Email ou mot de passe incorrect.");
  }

  if (!user.active) {
    return jsonError(403, "Ce compte est désactivé. Contactez un administrateur.");
  }

  // Créer la session (pose le cookie httpOnly)
  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  // Ne jamais inclure passwordHash dans la réponse
  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
