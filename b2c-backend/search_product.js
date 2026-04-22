import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
  database: process.env.DB_NAME || "sathyavogue_db"
});

const searchTerm = "%Elegant Black Beaded Silver Chandbali Earrings%";

db.query("SELECT id, name FROM products WHERE name LIKE ?", [searchTerm], (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Search results for name:", rows);
  }
  db.end();
});
