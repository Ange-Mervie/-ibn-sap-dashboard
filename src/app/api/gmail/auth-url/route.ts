// GET /api/gmail/auth-url — URL d'autorisation OAuth2 Gmail.
import { buildAuthUrl } from "@/lib/gmail/oauth";
import { gmailConfigStatus } from "@/lib/gmail/config";
import { canManage, getSession } from "@/lib/auth";
import { jsonError } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, "Non authentifié.");
  if (!canManage(session.role)) return jsonError(403, "Accès Gmail réservé aux administrateurs et managers.");

  const status = gmailConfigStatus();
  if (!status.configured) {
    return Response.json({ configured: false, url: null, error: "Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET." }, { status: 503 });
  }
  const url = buildAuthUrl();
  return Response.json({ configured: true, url });
}
