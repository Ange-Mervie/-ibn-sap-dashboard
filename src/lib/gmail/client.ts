// Client Gmail (API REST) — fetch injectable pour les tests.
import { GMAIL } from "./config";

export type GmailMessage = {
  gmailMessageId: string;
  gmailThreadId: string;
  subject: string;
  sender: string;
  receivedAt: string;
  bodySnippet: string;
};

export type FetchLike = typeof fetch;

export async function listGmailMessages(opts: { accessToken: string; fetchImpl?: FetchLike }): Promise<GmailMessage[]> {
  const doFetch: FetchLike = opts.fetchImpl ?? fetch;
  const query = `in:${GMAIL.syncLabel || "SAP"}`;
  const res = await doFetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Gmail list : ${res.status}`);
  const json = (await res.json()) as { messages?: { id: string; threadId: string }[] };
  const ids = (json.messages ?? []).map((m) => m.id);
  const out: GmailMessage[] = [];
  for (const id of ids) {
    out.push(await getGmailMessage({ id, accessToken: opts.accessToken, fetchImpl: opts.fetchImpl ?? fetch }));
  }
  return out;
}

export async function getGmailMessage(opts: { id: string; accessToken: string; fetchImpl?: FetchLike }): Promise<GmailMessage> {
  const doFetch: FetchLike = opts.fetchImpl ?? fetch;
  const res = await doFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${opts.id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Gmail get : ${res.status}`);
  const json = (await res.json()) as {
    id: string;
    threadId: string;
    snippet: string;
    internalDate?: string;
    payload?: { headers?: { name: string; value: string }[] };
  };
  const headers = json.payload?.headers ?? [];
  const get = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
  const date = json.internalDate ? new Date(Number(json.internalDate)) : new Date();
  return {
    gmailMessageId: json.id,
    gmailThreadId: json.threadId,
    subject: get("Subject"),
    sender: get("From"),
    receivedAt: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    bodySnippet: json.snippet ?? "",
  };
}

// Règle de qualification : sujet ou expéditeur → candidat à rattachement.
export function matchGmailMessage(m: GmailMessage): { matched: boolean; reason: string } {
  const subject = (m.subject || "").toLowerCase();
  const sender = (m.sender || "").toLowerCase();
  const domain = sender.split("@")[1] || "";
  const keywordHit = GMAIL.subjectKeywords.some((k) => subject.includes(k));
  const domainHit = GMAIL.senderDomains.some((d) => domain.includes(d));
  const labelHit = subject.includes((GMAIL.syncLabel || "SAP").toLowerCase());
  const matched = Boolean(keywordHit || domainHit || labelHit);
  const reason = keywordHit
    ? `subject:${subject.slice(0, 40)}`
    : domainHit
      ? `sender_domain:${domain}`
      : labelHit
        ? `label:${GMAIL.syncLabel || "SAP"}`
        : "";
  return { matched, reason };
}
