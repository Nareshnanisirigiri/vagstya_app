import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
  database: process.env.DB_NAME || "sathyavogue_db"
});

db.query("DESCRIBE addresses", (err, rows) => {
  if (err) console.error("addresses:", err);
  else console.log("addresses schema:", rows.map(r => `${r.Field} (${r.Type})`));
  db.end();
});
