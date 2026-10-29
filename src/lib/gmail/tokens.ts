// Stockage des jetons OAuth Gmail en base (table gmail_tokens, ligne unique).
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { gmailTokens } from "@/db/schema";
import { refreshAccessToken, type GmailTokens } from "./oauth";

export async function saveGmailTokens(tokens: GmailTokens): Promise<void> {
  await db
    .insert(gmailTokens)
    .values({
      id: 1,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiry: new Date(Date.now() + tokens.expiresIn * 1000),
    })
    .onDuplicateKeyUpdate({
      set: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiry: new Date(Date.now() + tokens.expiresIn * 1000),
      },
    });
}

export async function getGmailToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
  const rows = await db.select().from(gmailTokens).limit(1);
  const t = rows[0];
  if (!t) return null;
  if (t.expiry && t.expiry.getTime() < Date.now() + 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(t.refreshToken);
    await saveGmailTokens(refreshed);
    return { accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken };
  }
  if (!t.accessToken) return null;
  return { accessToken: t.accessToken, refreshToken: t.refreshToken };
}

export async function deleteGmailTokens(): Promise<void> {
  await db.delete(gmailTokens);
}
