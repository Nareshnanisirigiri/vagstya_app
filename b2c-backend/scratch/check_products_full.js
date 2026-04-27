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
  
  connection.query("SELECT id, name, price, discount_price, quantity FROM products LIMIT 5", (err, results) => {
    if (err) {
      console.error("Error fetching products:", err.message);
    } else {
      console.table(results);
    }
    connection.end();
  });
});
