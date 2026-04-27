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
  
  connection.query("SELECT * FROM customers WHERE user_id = 1", (err, results) => {
    if (err) {
      console.error("Error fetching customers:", err.message);
    } else {
      console.log("Customers for user 1:", results);
    }
    connection.end();
  });
});
