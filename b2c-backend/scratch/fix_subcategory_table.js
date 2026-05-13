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

const subCategoryColumns = [
  { name: "category_id", type: "INT" },
  { name: "image_url", type: "LONGTEXT" },
  { name: "description", type: "TEXT" },
  { name: "meta_title", type: "VARCHAR(255)" },
  { name: "meta_description", type: "TEXT" },
  { name: "meta_keywords", type: "TEXT" },
  { name: "status", type: "TINYINT(1) DEFAULT 1" }
];

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL.");

  db.query("SHOW COLUMNS FROM sub_categories", (err, rows) => {
    if (err) {
      console.error("Error fetching sub_categories columns:", err);
      // If table doesn't exist, we might need to create it, but usually it exists
      db.end();
      process.exit(1);
    }

    const existingColumns = rows.map(r => r.Field);
    const missingColumns = subCategoryColumns.filter(c => !existingColumns.includes(c.name));

    if (missingColumns.length === 0) {
      console.log("All sub_categories columns exist.");
      db.end();
      process.exit(0);
    }

    console.log("Adding missing columns to sub_categories:", missingColumns.map(c => c.name));

    let completed = 0;
    missingColumns.forEach(col => {
      const sql = `ALTER TABLE sub_categories ADD COLUMN ${col.name} ${col.type};`;
      db.query(sql, (err) => {
        completed++;
        if (err) {
          console.error(`Error adding column ${col.name}:`, err.message);
        } else {
          console.log(`Successfully added column: ${col.name}`);
        }

        if (completed === missingColumns.length) {
          console.log("Sub_categories table updated successfully.");
          db.end();
          process.exit(0);
        }
      });
    });
  });
});
