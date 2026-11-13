import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const rows =
    session.role === "consultant"
      ? await db.select().from(tickets).where(eq(tickets.assignee, session.email))
      : await db.select().from(tickets);

  const byWeek: Record<string, number> = {};
  for (const t of rows) {
    if (t.status === "Closed" && t.updatedAt) {
      const d = new Date(t.updatedAt);
      const week = Math.ceil((d.getDate() + 6 - d.getDay()) / 7);
      const key = `${d.getFullYear()}-W${week}`;
      byWeek[key] = (byWeek[key] ?? 0) + 1;
    }
  }

  return NextResponse.json({ completedByWeek: byWeek, total: rows.length });
}
