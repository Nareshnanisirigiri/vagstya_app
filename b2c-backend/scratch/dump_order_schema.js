import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
  database: process.env.DB_NAME || "sathyavogue_db"
});

const tables = ["orders", "order_products", "payments", "order_payments", "addresses", "customers", "shops"];

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
  
  let completed = 0;
  tables.forEach(table => {
    db.query(`DESCRIBE ${table}`, (err, rows) => {
      completed++;
      if (err) {
        console.log(`Table ${table} Error:`, err.message);
      } else {
        console.log(`Table ${table} Schema:`, rows.map(r => `${r.Field} (${r.Type})`));
      }
      
      if (completed === tables.length) {
        db.end();
        process.exit(0);
      }
    });
  });
});
