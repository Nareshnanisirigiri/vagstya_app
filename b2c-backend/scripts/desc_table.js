import mysql from "mysql2";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
  database: process.env.DB_NAME || "sathyavogue_db"
});

db.query("DESCRIBE products", (err, rows) => {
  if (err) console.error(err);
  console.log("PRODUCTS TABLE:");
  console.table(rows);
  db.query("DESCRIBE users", (err, rows2) => {
    if (err) console.error(err2);
    console.log("USERS TABLE:");
    console.table(rows2);
    db.end();
  });
});
