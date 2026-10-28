// Instance Drizzle + pool mysql2 — une seule source de connexion.
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 5,
});

export const db = drizzle(pool, { schema, mode: "default" });
export { pool };
