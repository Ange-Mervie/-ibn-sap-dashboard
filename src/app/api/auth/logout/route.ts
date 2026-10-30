// POST /api/auth/logout — Déconnexion utilisateur
// Supprime le cookie de session côté serveur.
import { deleteSession } from "@/lib/auth";

export async function POST() {
  await deleteSession();
  return Response.json({ ok: true });
}
