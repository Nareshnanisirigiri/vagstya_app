import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
  database: process.env.DB_NAME || "sathyavogue_db"
});

const queries = [
  "ALTER TABLE products ADD COLUMN metal VARCHAR(255) DEFAULT NULL;",
  "ALTER TABLE products ADD COLUMN weight VARCHAR(255) DEFAULT NULL;",
  "ALTER TABLE products ADD COLUMN size VARCHAR(255) DEFAULT NULL;"
];

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL.");
  
  let completed = 0;
  queries.forEach(sql => {
    db.query(sql, (err, result) => {
      completed++;
      if (err) {
        if (err.code === 'ER_DUP_COLUMNNAME') {
          console.log(`Column ${sql.split(' ')[4]} already exists.`);
        } else {
          console.error(`Error executing ${sql}:`, err.message);
        }
      } else {
        console.log(`Success executing: ${sql}`);
      }
      
      if (completed === queries.length) {
        db.end();
        console.log("Done.");
        process.exit(0);
      }
    });
  });
});
