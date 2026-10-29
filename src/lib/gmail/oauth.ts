// OAuth2 Google pour Gmail (lecture seule) — flux code → tokens.
import { GMAIL } from "./config";

export type GmailTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export function buildAuthUrl(state = "ibn-sap-dashboard"): string {
  const params = new URLSearchParams({
    client_id: GMAIL.clientId,
    redirect_uri: GMAIL.redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<GmailTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GMAIL.clientId,
      client_secret: GMAIL.clientSecret,
      redirect_uri: GMAIL.redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  const json = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error(`Échange OAuth refusé : ${res.status}`);
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? "",
    expiresIn: json.expires_in ?? 3600,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<GmailTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GMAIL.clientId,
      client_secret: GMAIL.clientSecret,
      grant_type: "refresh_token",
    }).toString(),
  });
  const json = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("Refresh token Gmail refusé");
  return { accessToken: json.access_token, refreshToken: json.refresh_token ?? refreshToken, expiresIn: json.expires_in ?? 3600 };
}
