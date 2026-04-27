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
  
  connection.query("DESC orders", (err, results) => {
    if (err) {
      console.error("Error describing orders:", err.message);
    } else {
      const idRow = results.find(r => r.Field === "id");
      console.log("orders.id Extra:", idRow ? idRow.Extra : "N/A");
    }
    connection.end();
  });
});
