#!/usr/bin/env node
// scripts/create-admin.ts
// ============================================================
// Procédure sécurisée de création du premier compte ADMIN.
// Usage : npx tsx scripts/create-admin.ts
//
// Ce script est interactif : il demande le nom, l'email et le
// mot de passe en ligne de commande (stdin) sans les afficher.
// NE JAMAIS hardcoder un mot de passe dans ce fichier.
// ============================================================
import { createInterface } from "readline";

// Charger .env.local avant toute initialisation de la connexion DB.
import { loadEnv } from "./env.mjs";
loadEnv();

// Lecture d'une ligne depuis stdin
async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

// Lecture masquée du mot de passe (ne l'affiche pas dans le terminal)
async function promptPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let password = "";
    stdin.on("data", function handler(ch: string) {
      if (ch === "\r" || ch === "\n") {
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.removeListener("data", handler);
        process.stdout.write("\n");
        resolve(password);
      } else if (ch === "\u0003") {
        process.exit(1); // Ctrl+C
      } else if (ch === "\u007f" || ch === "\b") {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else {
        password += ch;
        process.stdout.write("*");
      }
    });
  });
}

async function main() {
  // Imports dynamiques : ils s'exécutent après loadEnv() et configurent le pool
  // MySQL avec les variables de .env.local.
  const { eq } = await import("drizzle-orm");
  const { db, pool } = await import("../src/db");
  const { users } = await import("../src/db/schema");
  const { hashPassword } = await import("../src/lib/auth");

  console.log("=== Création du premier compte ADMIN — IBN SAP Dashboard ===\n");
  console.log("Ce compte aura tous les droits. Gardez ces informations en lieu sûr.\n");

  const name = await prompt("Nom complet de l'administrateur : ");
  if (name.length < 2) {
    console.error("❌ Le nom doit contenir au moins 2 caractères.");
    process.exit(1);
  }

  const email = await prompt("Email (sera l'identifiant de connexion) : ");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    console.error("❌ Email invalide.");
    process.exit(1);
  }

  // Vérifier si cet email existe déjà
  const [existing] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing) {
    if (existing.role === "admin") {
      console.log(`\n✅ Un compte ADMIN existe déjà avec cet email (id=${existing.id}).`);
      console.log("   Si vous souhaitez réinitialiser son mot de passe, utilisez la page /admin.");
    } else {
      console.log(
        `\n⚠️  Un compte existe déjà avec cet email (rôle : ${existing.role}).`
      );
      console.log("   Utilisez la page /admin pour élever son rôle à ADMIN.");
    }
    process.exit(0);
  }

  const password = await promptPassword("Mot de passe (min. 8 caractères, masqué) : ");
  if (password.length < 8) {
    console.error("❌ Le mot de passe doit contenir au moins 8 caractères.");
    process.exit(1);
  }

  const confirm = await promptPassword("Confirmer le mot de passe : ");
  if (password !== confirm) {
    console.error("❌ Les mots de passe ne correspondent pas.");
    process.exit(1);
  }

  console.log("\nCréation du compte en cours...");

  const passwordHash = await hashPassword(password);
  await db.insert(users).values({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: "admin",
    active: true,
  });

  console.log(`\n✅ Compte ADMIN créé avec succès !`);
  console.log(`   Nom   : ${name}`);
  console.log(`   Email : ${email.toLowerCase()}`);
  console.log(`\n→ Connectez-vous sur http://localhost:3000/login`);
  console.log(
    "→ Le mot de passe est haché et stocké de manière sécurisée (scrypt).\n"
  );

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erreur :", err instanceof Error ? err.message : err);
  process.exit(1);
});
