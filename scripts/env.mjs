// Mini-loader .env.local pour les scripts (import, check-*).
// Next.js charge .env.local tout seul ; tsx/mjs non — d'où ce fichier.
import { readFileSync } from "fs";

export function loadEnv() {
  try {
    const txt = readFileSync(".env.local", "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* pas de .env.local : on laisse les valeurs du shell */
  }
}
