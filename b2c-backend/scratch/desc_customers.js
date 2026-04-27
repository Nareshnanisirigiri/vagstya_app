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
  
  connection.query("DESC customers", (err, results) => {
    if (err) {
      console.error("Error describing customers:", err.message);
    } else {
      console.log("--- customers ---");
      console.table(results);
    }
    connection.end();
  });
});
