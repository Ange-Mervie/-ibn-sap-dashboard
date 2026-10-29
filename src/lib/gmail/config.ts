// Configuration Gmail (variables d'environnement côté serveur).
// Aucune donnée sensible n'est codée en dur : tout vient de .env.local.
export const GMAIL = {
  clientId: process.env.GMAIL_CLIENT_ID ?? "",
  clientSecret: process.env.GMAIL_CLIENT_SECRET ?? "",
  redirectUri:
    process.env.GMAIL_REDIRECT_URI || "http://localhost:3000/api/gmail/callback",
  syncLabel: process.env.GMAIL_SYNC_LABEL || "SAP",
  senderDomains: (process.env.GMAIL_SENDER_DOMAINS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  subjectKeywords: (process.env.GMAIL_SUBJECT_KEYWORDS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
};

export function isGmailConfigured(): boolean {
  return Boolean(GMAIL.clientId && GMAIL.clientSecret);
}

export function gmailConfigStatus(): {
  configured: boolean;
  redirectUri: string;
} {
  return { configured: isGmailConfigured(), redirectUri: GMAIL.redirectUri };
}
