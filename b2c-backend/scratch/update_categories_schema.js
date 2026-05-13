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

const cols = [
  { name: "image_url", type: "TEXT NULL" },
  { name: "description", type: "TEXT NULL" },
  { name: "meta_title", type: "VARCHAR(255) NULL" },
  { name: "meta_description", type: "TEXT NULL" },
  { name: "meta_keywords", type: "TEXT NULL" },
  { name: "is_active", type: "TINYINT(1) DEFAULT 1" }
];

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }

  db.query("DESCRIBE categories", (err, rows) => {
    if (err) {
      console.error("Error describing categories:", err);
      db.end();
      process.exit(1);
    }

    const existing = rows.map(r => r.Field.toLowerCase());
    const missing = cols.filter(c => !existing.includes(c.name.toLowerCase()));

    if (missing.length === 0) {
      console.log("No missing columns in categories.");
      db.end();
      process.exit(0);
    }

    let completed = 0;
    missing.forEach(col => {
      console.log(`Adding ${col.name} to categories...`);
      db.query(`ALTER TABLE categories ADD COLUMN ${col.name} ${col.type}`, (err) => {
        if (err) console.error(`Error adding ${col.name}:`, err.message);
        completed++;
        if (completed === missing.length) {
          console.log("Done.");
          db.end();
          process.exit(0);
        }
      });
    });
  });
});
