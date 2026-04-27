import mysql from "mysql2";

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
  console.log("Connected to sathyavogue_db");
  connection.query("SHOW TABLES", (err, results) => {
    if (err) {
      console.error("Error showing tables:", err.message);
    } else {
      console.log("Tables:", results.map(row => Object.values(row)[0]));
    }
    connection.end();
  });
});
