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

db.connect((err) => {
  if (err) {
    console.error("Connection Error:", err);
    process.exit(1);
  }

  db.query("SELECT * FROM flash_sale_products", (err, results) => {
    if (err) {
      console.error("Query Error:", err);
    } else {
      console.log("Current Flash Sale Table Contents:");
      console.table(results);
    }
    db.end();
  });
});
