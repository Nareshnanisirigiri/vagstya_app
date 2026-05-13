import { db } from "../config/db.js";

async function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

async function fixShopsSchema() {
  console.log("Fixing shops table schema...");
  try {
    const alterQueries = [
      "ALTER TABLE shops MODIFY COLUMN user_profile_url LONGTEXT",
      "ALTER TABLE shops MODIFY COLUMN logo_url LONGTEXT",
      "ALTER TABLE shops MODIFY COLUMN banner_url LONGTEXT",
      "ALTER TABLE shops MODIFY COLUMN description LONGTEXT",
      "ALTER TABLE shops MODIFY COLUMN address TEXT"
    ];

    for (const sql of alterQueries) {
      try {
        await query(sql);
        console.log(`Success: ${sql}`);
      } catch (err) {
        console.log(`Note: ${err.message}`);
      }
    }
    console.log("Shops schema fixed!");
  } catch (err) {
    console.error("Critical error fixing schema:", err);
  } finally {
    process.exit();
  }
}

fixShopsSchema();
