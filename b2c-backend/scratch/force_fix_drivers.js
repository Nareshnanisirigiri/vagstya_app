import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function fixDrivers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log("Fetching table structure...");
    const [columns] = await connection.query("DESCRIBE drivers");
    console.log("Current schema:", columns);

    console.log("Attempting to force user_id to NULL...");
    
    // Check if it's a foreign key
    const [fks] = await connection.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_NAME = 'drivers' AND COLUMN_NAME = 'user_id' AND CONSTRAINT_NAME != 'PRIMARY'
    `);
    
    for (const fk of fks) {
      console.log(`Dropping foreign key: ${fk.CONSTRAINT_NAME}`);
      await connection.query(`ALTER TABLE drivers DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
    }

    await connection.query("ALTER TABLE drivers MODIFY COLUMN user_id INT NULL DEFAULT NULL");
    console.log("Success!");

  } catch (error) {
    console.error("Migration failed:", error.message);
    
    if (error.message.includes("check that it exists")) {
       console.log("Trying to add column instead...");
       await connection.query("ALTER TABLE drivers ADD COLUMN user_id INT NULL DEFAULT NULL");
    }
  } finally {
    await connection.end();
  }
}

fixDrivers();
