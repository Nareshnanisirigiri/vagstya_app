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
  
  connection.query("SHOW CREATE TABLE orders", (err, results) => {
    if (err) {
      console.error("Error showing create table:", err.message);
    } else {
      console.log(results[0]['Create Table']);
    }
    connection.end();
  });
});
