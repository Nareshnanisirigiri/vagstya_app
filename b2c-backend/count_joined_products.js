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
    SELECT p.id
    FROM products p
    LEFT JOIN product_categories pc ON pc.product_id = p.id
`;

db.query(sql, (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Total rows returned by getProducts SQL (with joins):", rows.length);
  }
  db.end();
});
