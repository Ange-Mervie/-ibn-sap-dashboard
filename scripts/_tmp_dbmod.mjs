import mysql from "mysql2/promise";
import { readFileSync } from "fs";

const txt = readFileSync(".env.local", "utf8");
for (const line of txt.split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "ibn_app",
  password: "ibn_app_2026",
  database: "ibn_dashboard",
  waitForConnections: true,
  connectionLimit: 5,
});
const [pri] = await pool.query(`SELECT priority AS p, COUNT(*) AS c FROM tickets GROUP BY priority ORDER BY p`);
console.log("PRIORITIES=" + JSON.stringify(pri));
const [low] = await pool.query(`SELECT module AS m, COUNT(*) AS c FROM tickets WHERE priority = 'Low' GROUP BY module ORDER BY m`);
console.log("LOW_BY_MODULE=" + JSON.stringify(low));
const [critSum] = await pool.query(`SELECT COUNT(*) AS c FROM tickets WHERE priority = 'Critical'`);
console.log("CRIT_TOTAL=" + critSum[0].c);
await pool.end();
