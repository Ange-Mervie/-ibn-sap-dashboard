import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const rows = await db.select().from(notifications).where(eq(notifications.userId, session.sub));
  return NextResponse.json(rows);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await req.json();
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  return NextResponse.json({ ok: true });
}
