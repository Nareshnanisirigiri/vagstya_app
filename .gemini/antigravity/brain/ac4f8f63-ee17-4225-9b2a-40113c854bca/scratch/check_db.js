import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../../b2c-backend/.env") });

async function checkDrivers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [rows] = await connection.execute("SELECT * FROM drivers");
    console.log("Drivers in DB:", rows);
    
    const [tables] = await connection.execute("SHOW TABLES");
    console.log("Tables in DB:", tables);
  } catch (error) {
    console.error("Error checking drivers:", error);
  } finally {
    await connection.end();
  }
}

checkDrivers();
