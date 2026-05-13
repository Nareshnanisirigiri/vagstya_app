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
  { name: "image_url", type: "TEXT" },
  { name: "description", type: "TEXT" },
  { name: "meta_title", type: "VARCHAR(255)" },
  { name: "meta_description", type: "TEXT" },
  { name: "meta_keywords", type: "TEXT" },
  { name: "status", type: "TINYINT(1) DEFAULT 1" }
];

db.connect(async (err) => {
  if (err) { console.error(err); process.exit(1); }
  
  console.log("Checking sub_categories schema...");
  
  for (const col of cols) {
    try {
      await new Promise((resolve, reject) => {
        db.query(`ALTER TABLE sub_categories ADD COLUMN ${col.name} ${col.type}`, (err) => {
          if (err) {
            if (err.code === 'ER_DUP_COLUMN_NAME') {
              console.log(`Column ${col.name} already exists.`);
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log(`Added column ${col.name}.`);
            resolve();
          }
        });
      });
    } catch (e) {
      console.error(`Error adding ${col.name}:`, e.message);
    }
  }
  
  console.log("Schema update complete.");
  db.end();
});
