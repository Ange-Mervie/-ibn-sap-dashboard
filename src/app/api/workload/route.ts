import { NextResponse } from "next/server";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const rows = await db.select().from(tickets);
  const counts: Record<string, number> = {};
  for (const t of rows as { status: string; assignee: string }[]) {
    if (t.status !== "Closed") counts[t.assignee] = (counts[t.assignee] ?? 0) + 1;
  }
  return NextResponse.json(counts);
}
