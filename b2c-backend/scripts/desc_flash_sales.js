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

db.query("SELECT * FROM flash_sales ORDER BY id DESC LIMIT 5", (err, rows) => {
  if (err) console.error(err);
  console.table(rows);
  db.query("DESCRIBE flash_sales", (err2, cols) => {
    if (err2) console.error(err2);
    console.table(cols);
    db.end();
  });
});
