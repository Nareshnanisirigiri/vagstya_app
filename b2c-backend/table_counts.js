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
  let results = [];
  let checked = 0;
  
  tableNames.forEach(table => {
    db.query(`SELECT COUNT(*) as count FROM \`${table}\``, (err, rows) => {
      checked++;
      if (!err) {
        results.push({ table, count: rows[0].count });
      }
      if (checked === tableNames.length) {
        results.sort((a, b) => b.count - a.count);
        console.table(results);
        db.end();
      }
    });
  });
});
