// GET /api/gmail/auth-url — URL d'autorisation OAuth2 Gmail.
import { buildAuthUrl } from "@/lib/gmail/oauth";
import { gmailConfigStatus } from "@/lib/gmail/config";

export async function GET() {
  const status = gmailConfigStatus();
  if (!status.configured) {
    return Response.json({ configured: false, url: null, error: "Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET." }, { status: 503 });
  }
  const url = buildAuthUrl();
  return Response.json({ configured: true, url });
}
