import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
  database: process.env.DB_NAME || "sathyavogue_db"
});

db.query("DESCRIBE sub_categories", (err, rows) => {
  if (err) {
    console.error(err);
    db.end();
    return;
  }
  console.log("Columns in sub_categories:", rows.map(r => r.Field));
  db.end();
});
