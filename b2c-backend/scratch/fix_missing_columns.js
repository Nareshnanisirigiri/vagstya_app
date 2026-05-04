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

const columnsToAdd = [
  { name: "is_featured", type: "TINYINT(1) DEFAULT 0" },
  { name: "is_auspicious", type: "TINYINT(1) DEFAULT 0" },
  { name: "is_banner_main", type: "TINYINT(1) DEFAULT 0" },
  { name: "is_banner_earrings", type: "TINYINT(1) DEFAULT 0" },
  { name: "is_banner_necklaces", type: "TINYINT(1) DEFAULT 0" },
  { name: "is_popular_jewellery", type: "TINYINT(1) DEFAULT 0" },
  { name: "is_mens_shirts", type: "TINYINT(1) DEFAULT 0" },
  { name: "is_womens_highlights", type: "TINYINT(1) DEFAULT 0" },
  { name: "is_premium_sarees", type: "TINYINT(1) DEFAULT 0" },
  { name: "is_ad", type: "TINYINT(1) DEFAULT 0" },
  { name: "is_new", type: "TINYINT(1) DEFAULT 0" }
];

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL.");

  db.query("SHOW COLUMNS FROM products", (err, rows) => {
    if (err) {
      console.error("Error fetching columns:", err);
      db.end();
      process.exit(1);
    }

    const existingColumns = rows.map(r => r.Field);
    console.log("Existing columns:", existingColumns);

    const missingColumns = columnsToAdd.filter(c => !existingColumns.includes(c.name));
    
    if (missingColumns.length === 0) {
      console.log("All columns exist. No changes needed.");
      db.end();
      process.exit(0);
    }

    console.log("Adding missing columns:", missingColumns.map(c => c.name));

    const createAdsTable = `
      CREATE TABLE IF NOT EXISTS ads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        media_id INT,
        status TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    db.query(createAdsTable, (err) => {
      if (err) console.error("Error creating ads table:", err);
      else console.log("Ads table checked/created.");

      let completed = 0;
      missingColumns.forEach(col => {
        const sql = `ALTER TABLE products ADD COLUMN ${col.name} ${col.type};`;
        db.query(sql, (err) => {
          completed++;
          if (err) {
            console.error(`Error adding column ${col.name}:`, err.message);
          } else {
            console.log(`Successfully added column: ${col.name}`);
          }

          if (completed === missingColumns.length) {
            console.log("All migrations finished.");
            db.end();
            process.exit(0);
          }
        });
      });
    });
  });
});
