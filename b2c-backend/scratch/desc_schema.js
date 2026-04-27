import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "root",
  database: "sathyavogue_db"
});

connection.connect((err) => {
  if (err) {
    console.error("Connection failed:", err.message);
    return;
  }
  
  const tables = ["customers", "addresses", "orders", "shops", "order_products", "payments"];
  
  const descTable = (table) => {
    return new Promise((resolve) => {
      connection.query(`DESC ${table}`, (err, results) => {
        if (err) {
          console.error(`Error describing ${table}:`, err.message);
          resolve([]);
        } else {
          console.log(`\n--- ${table} ---`);
          console.table(results.map(r => ({ Field: r.Field, Type: r.Type, Null: r.Null })));
          resolve(results);
        }
      });
    });
  };

  (async () => {
    for (const table of tables) {
      await descTable(table);
    }
    connection.end();
  })();
});
