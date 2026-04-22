import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
  database: process.env.DB_NAME || "sathyavogue_db"
});

db.query("SELECT COUNT(*) as total FROM products", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Total products in database:", rows[0].total);
  }
  db.end();
});
