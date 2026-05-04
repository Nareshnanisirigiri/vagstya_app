import { db } from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

async function check(tableName) {
  try {
    const columns = await query(
      `SELECT COLUMN_NAME AS name
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [process.env.DB_NAME || "sathyavogue_db", tableName]
    );
    console.log(`Table ${tableName} columns:`, columns.map(c => c.name));
  } catch (err) {
    console.error(`Error for ${tableName}:`, err.message);
  }
}

async function run() {
  await check("categories");
  await check("sub_categories");
  db.end();
}

run();
