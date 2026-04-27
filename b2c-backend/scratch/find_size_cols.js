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
  
  connection.query("DESC products", (err, results) => {
    if (err) {
      console.error("Error fetching products schema:", err.message);
    } else {
      const sizeCols = results.filter(r => r.Field.toLowerCase().includes('size'));
      console.log("Size related columns:", sizeCols);
    }
    connection.end();
  });
});
