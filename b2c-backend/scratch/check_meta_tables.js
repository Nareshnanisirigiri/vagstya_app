import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
  database: process.env.DB_NAME || "sathyavogue_db"
});

db.query("SHOW TABLES", (err, tables) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("Tables:", tables.map(t => Object.values(t)[0]));

  db.query("DESCRIBE sizes", (err1, sizes) => {
    if (err1) console.error("sizes error:", err1.message);
    else console.log("sizes schema:", sizes.map(r => r.Field));

    db.query("DESCRIBE colors", (err2, colors) => {
      if (err2) console.error("colors error:", err2.message);
      else console.log("colors schema:", colors.map(r => r.Field));
      db.end();
    });
  });
});
