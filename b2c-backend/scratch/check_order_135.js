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

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
  
  db.query(`SELECT id, order_status, payment_status FROM orders WHERE id = 135`, (err, rows) => {
    if (err) {
      console.log(`Error:`, err.message);
    } else {
      console.log(`Order 135 Data:`, rows[0]);
    }
    db.end();
    process.exit(0);
  });
});
