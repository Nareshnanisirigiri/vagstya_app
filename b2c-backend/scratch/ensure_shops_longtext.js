const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log("Migrating shops table...");
  
  const columns = [
    "ALTER TABLE shops MODIFY COLUMN logo_url LONGTEXT",
    "ALTER TABLE shops MODIFY COLUMN banner_url LONGTEXT",
    "ALTER TABLE shops MODIFY COLUMN user_profile_url LONGTEXT",
    "ALTER TABLE shops MODIFY COLUMN description LONGTEXT",
    "ALTER TABLE shops MODIFY COLUMN address LONGTEXT"
  ];

  for (const sql of columns) {
    try {
      await connection.execute(sql);
      console.log(`Success: ${sql}`);
    } catch (err) {
      console.error(`Failed: ${sql}`, err.message);
    }
  }

  await connection.end();
  console.log("Migration finished.");
}

migrate();
