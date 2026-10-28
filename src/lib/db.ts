// Sécurité des écritures : si API_WRITE_TOKEN est défini, il faut
// Authorization: Bearer <token>. Vide = écritures libres (dev local).
export function requireWriteToken(req: Request): boolean {
  const expected = process.env.API_WRITE_TOKEN;
  if (!expected) return true;
  return req.headers.get("authorization") === `Bearer ${expected}`;
}

// Réponse d'erreur uniforme pour les routes API.
export function jsonError(status: number, message: string, errors?: string[]): Response {
  return Response.json({ error: message, errors }, { status });
}
