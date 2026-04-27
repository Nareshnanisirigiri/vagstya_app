import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "root"
});

connection.connect((err) => {
  if (err) {
    console.error("Connection failed:", err.message);
    return;
  }
  console.log("Connected to MySQL on localhost");
  connection.query("SHOW DATABASES", (err, results) => {
    if (err) {
      console.error("Error showing databases:", err.message);
    } else {
      console.log("Databases:", results.map(db => db.Database));
    }
    connection.end();
  });
});
