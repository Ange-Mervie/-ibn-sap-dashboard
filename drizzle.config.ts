import { defineConfig } from "drizzle-kit";

// Configuration drizzle-kit — dialect MySQL, schéma partagé.
// DATABASE_URL provient de .env.local (drizzle-kit lit .env automatiquement).
export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
