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
  if (err) { console.error(err); process.exit(1); }
  db.query("DESCRIBE categories", (err, rows) => {
    if (err) console.error(err);
    else console.log(JSON.stringify(rows, null, 2));
    db.end();
  });
});
