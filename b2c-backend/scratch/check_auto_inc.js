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
  
  const tables = ["customers", "addresses", "payments", "order_products"];
  
  const checkAuto = (table) => {
    return new Promise((resolve) => {
      connection.query(`DESC ${table}`, (err, results) => {
        if (err) {
          console.error(`Error describing ${table}:`, err.message);
        } else {
          const idRow = results.find(r => r.Field === "id");
          console.log(`${table}.id:`, idRow ? idRow.Extra : "N/A");
        }
        resolve();
      });
    });
  };

  (async () => {
    for (const table of tables) {
      await checkAuto(table);
    }
    connection.end();
  })();
});
