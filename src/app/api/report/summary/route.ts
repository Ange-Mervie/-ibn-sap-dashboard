import { NextResponse } from "next/server";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const rows = await db.select().from(tickets);
  const total = rows.length;
  const closed = rows.filter((t: { status: string }) => t.status === "Closed").length;
  return NextResponse.json({ total, closed, open: total - closed, generatedAt: new Date().toISOString() });
}
