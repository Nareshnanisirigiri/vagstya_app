import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
  database: process.env.DB_NAME || "sathyavogue_db"
});

db.query("DESCRIBE withdraws", (err, rows) => {
  if (err) console.error("withdraws:", err);
  else console.log("withdraws schema:", rows.map(r => `${r.Field} (${r.Type})`));

  db.query("DESCRIBE orders", (err2, rows2) => {
    if (err2) console.error("orders:", err2);
    else console.log("orders schema:", rows2.map(r => `${r.Field} (${r.Type})`));
    
    db.query("SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status", (err3, rows3) => {
      if (err3) console.error("orders statuses:", err3);
      else console.log("orders statuses:", rows3);
      db.end();
    });
  });
});
