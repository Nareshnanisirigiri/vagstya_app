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

const createTableSql = `
CREATE TABLE IF NOT EXISTS flash_sale_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  sale_price DECIMAL(10, 2) DEFAULT NULL,
  start_date DATETIME DEFAULT NULL,
  end_date DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_product (product_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
`;

db.connect((err) => {
  if (err) {
    console.error("Migration Error: Could not connect to DB:", err);
    process.exit(1);
  }
  
  db.query(createTableSql, (err) => {
    if (err) {
      console.error("Migration Error: Could not create table:", err);
    } else {
      console.log("Success: flash_sale_products table ensured.");
    }
    db.end();
  });
});
