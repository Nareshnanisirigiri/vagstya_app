import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    const [columns] = await connection.query("SHOW COLUMNS FROM drivers");
    console.log("Drivers columns:", JSON.stringify(columns, null, 2));
    
    // Try to modify it here
    console.log("Attempting to modify user_id to be NULL...");
    await connection.query("ALTER TABLE drivers MODIFY COLUMN user_id INT NULL");
    console.log("Modification successful.");

    const [newColumns] = await connection.query("SHOW COLUMNS FROM drivers");
    console.log("Updated Drivers columns:", JSON.stringify(newColumns, null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await connection.end();
  }
}

checkSchema();
