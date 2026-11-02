import { NextResponse } from "next/server";
import { db } from "@/db";
import { deadlineRequests } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ ticketId: z.string(), newDueDate: z.string(), reason: z.string().optional() });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  await db.insert(deadlineRequests).values({ ticketId: parsed.data.ticketId, requestedBy: session.sub, newDueDate: parsed.data.newDueDate as any, reason: parsed.data.reason ?? "" });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const rows = await db.select().from(deadlineRequests);
  return NextResponse.json(rows);
}
