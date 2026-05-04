import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
  database: process.env.DB_NAME || "sathyavogue_db"
});

const tables = ["colors", "sizes", "categories", "sub_categories"];

async function check() {
  for (const table of tables) {
    console.log(`\n--- TABLE: ${table} ---`);
    await new Promise((resolve) => {
      db.query(`DESCRIBE \`${table}\``, (err, rows) => {
        if (err) {
          console.error(`Error describing ${table}:`, err.message);
        } else {
          console.table(rows);
        }
        resolve();
      });
    });
  }
  db.end();
}

check();
