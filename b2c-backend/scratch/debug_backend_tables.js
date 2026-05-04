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
      `SELECT COLUMN_NAME AS name, DATA_TYPE AS dataType, COLUMN_KEY AS columnKey
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION ASC`,
      [process.env.DB_NAME || "sathyavogue_db", tableName]
    );
    console.log(`Table ${tableName} columns:`, columns.map(c => c.name));
    const primaryColumn = columns.find((column) => column.columnKey === "PRI")?.name || columns[0]?.name;
    console.log(`Primary column for ${tableName}:`, primaryColumn);
    const sql = `SELECT * FROM \`${tableName}\` ${primaryColumn ? `ORDER BY \`${primaryColumn}\` DESC` : ""} LIMIT 1`;
    console.log(`Executing: ${sql}`);
    const rows = await query(sql);
    console.log(`Success: ${rows.length} rows`);
  } catch (err) {
    console.error(`Error for ${tableName}:`, err.message);
  }
}

async function run() {
  await check("colors");
  await check("sizes");
  db.end();
}

run();
