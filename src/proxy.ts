// ============================================================
// src/proxy.ts — Protection des routes (Next.js 16)
// NOTE : Dans Next.js 16, middleware.ts est DÉPRÉCIÉ → proxy.ts
//        L'export s'appelle `proxy` (et non plus `middleware`).
// ============================================================
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes d'écriture API qui exigent une session authentifiée
const WRITE_APIS = [
  /^\/api\/tickets$/,                        // POST
  /^\/api\/tickets\/[^/]+$/,                 // PATCH, DELETE
  /^\/api\/tickets\/[^/]+\/comments/,        // POST commentaire
  /^\/api\/gmail\/sync/,                     // POST sync
  /^\/api\/gmail\/staging/,                  // PATCH staging
  /^\/api\/auth\/logout/,                    // POST logout
];

// Pages UI protégées (redirection vers /login si non connecté)
const PROTECTED_PAGES = [
  /^\/$/,
  /^\/tickets\//,
  /^\/tickets$/,
  /^\/emails/,
  /^\/admin/,
  /^\/demo\//,
];

// Nom du cookie de session (doit correspondre à src/lib/auth.ts)
const SESSION_COOKIE = "ibn_session";

function getTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

/**
 * Décode le payload JWT sans vérification cryptographique.
 * La vérification réelle se fait dans src/lib/auth.ts (côté serveur complet).
 * Ici on lit uniquement le rôle/exp pour les redirections rapides du proxy.
 */
function decodePayloadFast(
  token: string
): { sub: number; role: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4;
    const decoded = atob(pad ? padded + "=".repeat(4 - pad) : padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  const token = getTokenFromRequest(request);
  const payload = token ? decodePayloadFast(token) : null;
  const isExpired = payload ? payload.exp < Math.floor(Date.now() / 1000) : true;
  const isAuthenticated = Boolean(payload && !isExpired);
  const isInternalApi = pathname.startsWith("/api/") && pathname !== "/api/auth/login";

  if (isInternalApi && !isAuthenticated) {
    return NextResponse.json({ error: "Non authentifié. Veuillez vous connecter." }, { status: 401 });
  }

  // --- Protection des pages UI ---
  const isProtectedPage = PROTECTED_PAGES.some((re) => re.test(pathname));
  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Empêcher un utilisateur déjà connecté d'accéder à /login
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // --- Protection des routes API d'écriture ---
  const isWriteApi = WRITE_APIS.some((re) => re.test(pathname));
  if (isWriteApi && (method === "POST" || method === "PATCH" || method === "DELETE")) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Non authentifié. Veuillez vous connecter." },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclure les ressources statiques et les images — ne traiter que les routes dynamiques
    "/((?!_next/static|_next/image|favicon.ico|public/|banner/).*)",
  ],
};
