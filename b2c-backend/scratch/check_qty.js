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
  
  connection.query("SELECT id, name, quantity FROM products WHERE id = 58", (err, results) => {
    if (err) {
      console.error("Error fetching product:", err.message);
    } else {
      console.log("Product 58:", results);
    }
    connection.end();
  });
});
