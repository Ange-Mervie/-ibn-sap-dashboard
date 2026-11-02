import { NextResponse } from "next/server";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const rows = await db.select().from(tickets);
  const byWeek: Record<string, number> = {};
  for (const t of rows as { status: string; updatedAt: Date | null }[]) {
    if (t.status === "Closed" && t.updatedAt) {
      const d = new Date(t.updatedAt);
      const key = `${d.getFullYear()}-W${Math.ceil((d.getDate() + 6 - d.getDay()) / 7)}`;
      byWeek[key] = (byWeek[key] ?? 0) + 1;
    }
  }
  return NextResponse.json({ completedByWeek: byWeek, total: rows.length });
}
