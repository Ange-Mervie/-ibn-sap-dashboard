// GET /api/agents — liste des agents (ADMIN / MANAGER uniquement).
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { jsonError } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié.");
  if (session.role !== "admin" && session.role !== "manager") {
    return jsonError(403, "Accès refusé. Rôle réservé aux administrateurs et managers.");
  }
  const list = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
    })
    .from(users)
    .where(eq(users.role, "agent"))
    .orderBy(users.name);
  return Response.json({ agents: list });
}
