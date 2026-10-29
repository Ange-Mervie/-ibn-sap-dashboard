// GET /api/gmail/callback — échange du code OAuth2 contre des jetons.
import { NextResponse } from "next/server";
import { exchangeCode } from "@/lib/gmail/oauth";
import { saveGmailTokens } from "@/lib/gmail/tokens";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  if (error || !code) {
    const redirect = new URL("http://localhost:3000/emails");
    redirect.searchParams.set("gmail", "error");
    redirect.searchParams.set("reason", error || "code_missing");
    return NextResponse.redirect(redirect.toString(), 302);
  }

  try {
    const tokens = await exchangeCode(code);
    await saveGmailTokens(tokens);
  } catch {
    const redirect = new URL("http://localhost:3000/emails");
    redirect.searchParams.set("gmail", "error");
    redirect.searchParams.set("reason", "exchange_failed");
    return NextResponse.redirect(redirect.toString(), 302);
  }

  const redirect = new URL("http://localhost:3000/emails");
  redirect.searchParams.set("gmail", "ok");
  redirect.searchParams.set("state", state ?? "");
  return NextResponse.redirect(redirect.toString(), 302);
}
