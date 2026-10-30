import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

// Configuration drizzle-kit — dialect MySQL, schéma partagé.
// Charger l'environnement Next.js pour les commandes Drizzle hors runtime Next.
export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
