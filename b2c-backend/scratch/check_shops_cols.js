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

async function checkShops() {
  try {
    const databaseName = process.env.DB_NAME || "sathyavogue_db";
    const tableName = "shops";
    
    const columns = await query(
      `SELECT COLUMN_NAME AS name, DATA_TYPE AS dataType, COLUMN_KEY AS columnKey
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION ASC`,
      [databaseName, tableName]
    );
    
    console.log(`Table ${tableName} columns:`, columns.map(c => c.name).join(", "));
    
    const rows = await query(`SELECT * FROM shops LIMIT 1`);
    console.log("First row:", JSON.stringify(rows[0], null, 2));
    
  } catch (err) {
    console.error("Error checking shops:", err.message);
  } finally {
    db.end();
  }
}

checkShops();
