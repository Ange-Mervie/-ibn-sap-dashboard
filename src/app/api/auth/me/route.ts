// GET /api/auth/me — Retourne le profil de l'utilisateur connecté
// Utilisé par les composants client pour connaître le rôle courant.
// Ne retourne jamais le passwordHash.
import { getSession } from "@/lib/auth";
import { jsonError } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié.");
  return Response.json({
    user: {
      id: session.sub,
      name: session.name,
      email: session.email,
      role: session.role,
    },
  });
}
