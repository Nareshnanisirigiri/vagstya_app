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

const productIds = [208, 410, 411, 63, 62];

db.connect((err) => {
  if (err) {
    console.error("Connection Error:", err);
    process.exit(1);
  }

  const values = productIds.map(id => [id]);
  const sql = "INSERT IGNORE INTO flash_sale_products (product_id) VALUES ?";

  db.query(sql, [values], (err, results) => {
    if (err) {
      console.error("Insert Error:", err);
    } else {
      console.log(`Success: Added ${results.affectedRows} products to Flash Sale.`);
    }
    db.end();
  });
});
