import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
  database: process.env.DB_NAME || "sathyavogue_db"
});

db.query("SHOW TABLES", (err, tables) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  
  const tableNames = tables.map(t => Object.values(t)[0]);
  console.log("Tables:", tableNames);
  
  let checked = 0;
  tableNames.forEach(table => {
    db.query(`DESCRIBE \`${table}\``, (err, rows) => {
      checked++;
      if (!err) {
        const hasMetal = rows.some(r => r.Field === 'metal');
        const hasWeight = rows.some(r => r.Field === 'weight');
        const hasSize = rows.some(r => r.Field === 'size');
        if (hasMetal || hasWeight || hasSize) {
          console.log(`Table '${table}' has:`, { hasMetal, hasWeight, hasSize });
        }
      }
      if (checked === tableNames.length) {
        db.end();
      }
    });
  });
});
