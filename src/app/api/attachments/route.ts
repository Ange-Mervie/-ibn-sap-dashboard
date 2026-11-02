import { NextResponse } from "next/server";
import { db } from "@/db";
import { attachments } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ ticketId: z.string(), fileName: z.string(), url: z.string() });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  await db.insert(attachments).values({ ticketId: parsed.data.ticketId, uploadedBy: session.sub, fileName: parsed.data.fileName, url: parsed.data.url });
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get("ticketId");
  const rows = ticketId ? await db.select().from(attachments) : await db.select().from(attachments);
  return NextResponse.json(rows.filter((a: any) => !ticketId || a.ticketId === ticketId));
}
