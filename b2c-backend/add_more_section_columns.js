import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
  database: process.env.DB_NAME || "sathyavogue_db"
});

const sql = `
  ALTER TABLE products 
  ADD COLUMN is_popular_jewellery TINYINT(1) DEFAULT 0,
  ADD COLUMN is_mens_shirts TINYINT(1) DEFAULT 0,
  ADD COLUMN is_womens_highlights TINYINT(1) DEFAULT 0,
  ADD COLUMN is_premium_sarees TINYINT(1) DEFAULT 0;
`;

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL.");
  
  db.query(sql, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_COLUMNNAME') {
        console.log("Section columns already exist.");
      } else {
        console.error("Query error:", err);
        process.exit(1);
      }
    } else {
      console.log("Success: Added manual selection columns for 4 more sections.");
    }
    db.end();
    process.exit(0);
  });
});
