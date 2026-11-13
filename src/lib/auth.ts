// ============================================================
// src/lib/auth.ts — Authentification RBAC (sans dépendance externe)
// - Hash mot de passe : bcryptjs (nouveau) + compat scrypt legacy
// - Session : cookie httpOnly "ibn_session" contenant un JWT HS256
// - Clé : SESSION_SECRET dans .env.local (jamais committé)
// ============================================================
import { scrypt, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { promisify } from "util";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type Role } from "@/db/schema";

const scryptAsync = promisify(scrypt);

// --- Constantes de session ---
export const SESSION_COOKIE = "ibn_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 heures en secondes
const ALGORITHM = { name: "HMAC", hash: "SHA-256" };

// Payload JWT embarqué dans le cookie de session
export type SessionPayload = {
  sub: number;       // id utilisateur
  name: string;
  email: string;
  role: Role;
  iat: number;       // issued at (timestamp)
  exp: number;       // expiration (timestamp)
};

// ============================================================
// HACHAGE DES MOTS DE PASSE (scrypt + sel aléatoire)
// ============================================================

/**
 * Hache un mot de passe clair avec scrypt + sel de 16 octets.
 * Retourne "<sel_hex>:<hash_hex>" à stocker en DB.
 * Le mot de passe en clair n'est jamais loggué ni retourné.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare un mot de passe clair à son hash stocké.
 * Utilise timingSafeEqual pour éviter les timing attacks.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith("$2")) return bcrypt.compare(password, stored);
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  try {
    const hash = (await scryptAsync(password, salt, 64)) as Buffer;
    const storedBuf = Buffer.from(hashHex, "hex");
    return hash.length === storedBuf.length && timingSafeEqual(hash, storedBuf);
  } catch {
    return false;
  }
}

// ============================================================
// JWT SIGNÉ AVEC CRYPTO.SUBTLE (HS256)
// ============================================================

function b64url(data: string | ArrayBuffer): string {
  const str =
    typeof data === "string"
      ? btoa(data)
      : btoa(String.fromCharCode(...new Uint8Array(data)));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function decodeB64url(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  return atob(pad ? padded + "=".repeat(4 - pad) : padded);
}

async function getSigningKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET absent ou trop court (32 caractères minimum) — vérifier .env.local"
    );
  }
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    ALGORITHM,
    false,
    ["sign", "verify"]
  );
}

async function signJWT(payload: SessionPayload): Promise<string> {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const key = await getSigningKey();
  const sig = await crypto.subtle.sign(ALGORITHM, key, new TextEncoder().encode(data));
  return `${data}.${b64url(sig)}`;
}

async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const data = `${header}.${body}`;
    const key = await getSigningKey();
    const sigBuf = Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
      c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify(
      ALGORITHM,
      key,
      sigBuf,
      new TextEncoder().encode(data)
    );
    if (!valid) return null;
    const payload: SessionPayload = JSON.parse(decodeB64url(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ============================================================
// GESTION DE SESSION (cookies Next.js 16 — async)
// ============================================================

/**
 * Crée la session utilisateur et pose le cookie httpOnly.
 * À appeler depuis une Route Handler (POST /api/auth/login).
 */
export async function createSession(user: {
  id: number;
  name: string;
  email: string;
  role: Role;
}): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + SESSION_MAX_AGE,
  };
  const token = await signJWT(payload);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Lit et valide la session depuis le cookie.
 * Retourne le payload ou null (non connecté / expiré / invalide).
 */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyJWT(token);
  if (!payload) return null;

  try {
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);
    if (!user || !user.active) return null;
    return { ...payload, name: user.name, email: user.email, role: user.role };
  } catch {
    // Refuser l'accès si l'état du compte ne peut pas être vérifié.
    return null;
  }
}

/**
 * Supprime la session (déconnexion).
 * À appeler depuis une Route Handler (POST /api/auth/logout).
 */
export async function deleteSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

// ============================================================
// AUTORISATIONS PAR RÔLE (helpers globaux; accès contextualisé dans src/lib/access.ts)
// ============================================================

export function canWrite(role: Role | undefined): boolean {
  return role === "admin" || role === "manager";
}

export function canAdmin(role: Role | undefined): boolean {
  return role === "admin";
}

export function canManage(role: Role | undefined): boolean {
  return role === "admin" || role === "manager";
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  consultant: "Consultant",
  manager: "Manager",
};
