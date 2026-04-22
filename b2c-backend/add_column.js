import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
  database: process.env.DB_NAME || "sathyavogue_db"
});

const sql = "ALTER TABLE products ADD COLUMN is_featured TINYINT(1) DEFAULT 0;";

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL.");
  
  db.query(sql, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_COLUMNNAME') {
        console.log("Column 'is_featured' already exists.");
      } else {
        console.error("Query error:", err);
        process.exit(1);
      }
    } else {
      console.log("Success: Added 'is_featured' column to products table.");
    }
    db.end();
    process.exit(0);
  });
});
